const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const queryAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(results);
    });
});

const beginTransactionAsync = () => new Promise((resolve, reject) => {
    db.beginTransaction(err => err ? reject(err) : resolve());
});

const commitAsync = () => new Promise((resolve, reject) => {
    db.commit(err => err ? reject(err) : resolve());
});

const rollbackAsync = () => new Promise(resolve => {
    db.rollback(() => resolve());
});

const toMoney = (value) => Number((Number(value) || 0).toFixed(2));
const toPositiveInt = (value) => Math.max(1, Number(value) || 1);
const normalizeSize = (size) => {
    if (!size || size === 'default') {
        return null;
    }
    return String(size).trim().toLowerCase();
};

const buildInvoiceNumber = (id) => `BWL-${String(id).padStart(8, '0')}`;
const resolveInvoiceNumber = (order) => order.invoice_number || buildInvoiceNumber(order.id);

async function getPricingMaps(items) {
    const productIds = [...new Set(items.map(item => Number(item.product_id)).filter(Boolean))];
    if (!productIds.length) {
        return { productMap: new Map(), sizeMap: new Map() };
    }

    const products = await queryAsync(
        'SELECT id, name, price, costing FROM products WHERE id IN (?)',
        [productIds]
    );

    const sizes = await queryAsync(
        'SELECT id, product_id, size, price, costing FROM product_sizes WHERE product_id IN (?)',
        [productIds]
    );

    const productMap = new Map(products.map(product => [Number(product.id), product]));
    const sizeMap = new Map(
        sizes.map(size => [`${Number(size.product_id)}:${String(size.size).toLowerCase()}`, size])
    );

    return { productMap, sizeMap };
}

async function prepareOrderItems(items) {
    const { productMap, sizeMap } = await getPricingMaps(items);

    return items.map(item => {
        const productId = Number(item.product_id);
        const product = productMap.get(productId);
        if (!product) {
            throw new Error(`Product ${productId} not found`);
        }

        const sizeKey = normalizeSize(item.product_size || item.size);
        const sizeRecord = sizeKey ? sizeMap.get(`${productId}:${sizeKey}`) : null;
        const quantity = toPositiveInt(item.quantity);
        const unitPrice = toMoney(sizeRecord?.price ?? item.unit_price ?? product.price);
        const unitCost = toMoney(sizeRecord?.costing ?? product.costing);
        const totalPrice = toMoney(item.total_price ?? unitPrice * quantity);
        const totalCost = toMoney(unitCost * quantity);
        const totalProfit = toMoney(totalPrice - totalCost);

        return {
            product_id: productId,
            product_size: sizeRecord?.size || item.product_size || item.size || null,
            quantity,
            unit_price: unitPrice,
            unit_cost: unitCost,
            total_price: totalPrice,
            total_cost: totalCost,
            total_profit: totalProfit
        };
    });
}

function sumPreparedItems(items) {
    return items.reduce((acc, item) => {
        acc.totalAmount += toMoney(item.total_price);
        acc.totalCost += toMoney(item.total_cost);
        acc.grossProfit += toMoney(item.total_profit);
        return acc;
    }, { totalAmount: 0, totalCost: 0, grossProfit: 0 });
}

// Auth
exports.login = (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        
        const user = results[0];
        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
            
            const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
        });
    });
};

// Categories
exports.getCategories = (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addCategory = (req, res) => {
    const { name, description } = req.body;
    db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, description });
    });
};

exports.updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    db.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category updated successfully' });
    });
};

exports.deleteCategory = (req, res) => {
    db.query('DELETE FROM categories WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category deleted' });
    });
};

// Sub-Categories
exports.getSubCategories = (req, res) => {
    const sql = `
        SELECT s.*, c.name as category_name 
        FROM sub_categories s 
        LEFT JOIN categories c ON s.category_id = c.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addSubCategory = (req, res) => {
    const { category_id, name, description } = req.body;
    db.query('INSERT INTO sub_categories (category_id, name, description) VALUES (?, ?, ?)', [category_id, name, description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, category_id, name, description });
    });
};

exports.updateSubCategory = (req, res) => {
    const { id } = req.params;
    const { category_id, name, description } = req.body;
    db.query('UPDATE sub_categories SET category_id = ?, name = ?, description = ? WHERE id = ?', [category_id, name, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Sub-category updated successfully' });
    });
};

exports.deleteSubCategory = (req, res) => {
    db.query('DELETE FROM sub_categories WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Sub-category deleted' });
    });
};

// Products
exports.getProducts = (req, res) => {
    const sql = `
        SELECT
            p.id,
            p.category_id,
            p.sub_category_id,
            p.name,
            p.description,
            p.price,
            p.costing,
            p.discount,
            p.inventory_count,
            p.image_url,
            p.aspect_ratio,
            p.created_at,
            c.name as category_name,
            s.name as sub_category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN sub_categories s ON p.sub_category_id = s.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Attach images and sizes for each product
        const productIds = results.map(r => r.id);
        if (productIds.length === 0) return res.json([]);

        db.query('SELECT * FROM product_images WHERE product_id IN (?)', [productIds], (err, imgs) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.query('SELECT * FROM product_sizes WHERE product_id IN (?)', [productIds], (err, sizes) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const imagesByProduct = imgs.reduce((acc, row) => {
                    acc[row.product_id] = acc[row.product_id] || [];
                    acc[row.product_id].push(row.image_url);
                    return acc;
                }, {});

                const sizesByProduct = sizes.reduce((acc, row) => {
                    acc[row.product_id] = acc[row.product_id] || [];
                    acc[row.product_id].push({
                        id: row.id,
                        size: row.size,
                        price: row.price,
                        costing: row.costing
                    });
                    return acc;
                }, {});

                const out = results.map(p => ({ 
                    ...p, 
                    images: imagesByProduct[p.id] || [],
                    sizes: sizesByProduct[p.id] || []
                }));
                res.json(out);
            });
        });
    });
};

exports.addProduct = (req, res) => {
    const { category_id, sub_category_id, name, description, price, costing, discount, inventory_count, aspect_ratio } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = 'INSERT INTO products (category_id, sub_category_id, name, description, price, costing, discount, inventory_count, image_url, aspect_ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [category_id, sub_category_id, name, description, price, costing, discount, inventory_count, image_url, aspect_ratio], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const productId = result.insertId;
        // If additional images were uploaded via 'images' field, save them
        if (req.files && req.files.length > 0) {
            const imgValues = req.files.map(f => [productId, `/uploads/${f.filename}`]);
            db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imgValues], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                return res.json({ id: productId, name, price });
            });
        } else {
            res.json({ id: productId, name, price });
        }
    });
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const { category_id, sub_category_id, name, description, price, costing, discount, inventory_count, aspect_ratio } = req.body;
    let sql = 'UPDATE products SET category_id=?, sub_category_id=?, name=?, description=?, price=?, costing=?, discount=?, inventory_count=?, aspect_ratio=?';
    let params = [category_id, sub_category_id, name, description, price, costing, discount, inventory_count, aspect_ratio];

    if (req.file) {
        sql += ', image_url=?';
        params.push(`/uploads/${req.file.filename}`);
    }
    sql += ' WHERE id=?';
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product updated successfully' });
    });
};

exports.deleteProduct = (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted' });
    });
};

// Get single product by id with images and sizes
exports.getProductById = (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT
            p.id,
            p.category_id,
            p.sub_category_id,
            p.name,
            p.description,
            p.price,
            p.costing,
            p.discount,
            p.inventory_count,
            p.image_url,
            p.aspect_ratio,
            p.created_at,
            c.name as category_name,
            s.name as sub_category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN sub_categories s ON p.sub_category_id = s.id
        WHERE p.id = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Product not found' });

        db.query('SELECT image_url FROM product_images WHERE product_id = ?', [id], (err2, imgs) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            db.query('SELECT id, size, price, costing FROM product_sizes WHERE product_id = ? ORDER BY size ASC', [id], (err3, sizes) => {
                if (err3) return res.status(500).json({ error: err3.message });
                
                const images = imgs.map(r => r.image_url);
                res.json({ ...results[0], images, sizes });
            });
        });
    });
};

// Add product size variant
exports.addProductSize = (req, res) => {
    const { size, price, costing } = req.body;
    const productId = req.params.id;

    const sql = 'INSERT INTO product_sizes (product_id, size, price, costing) VALUES (?, ?, ?, ?)';
    db.query(sql, [productId, size, price, costing], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: `Size '${size}' already exists for this product` });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, size, price, costing });
    });
};

// Update product size variant
exports.updateProductSize = (req, res) => {
    const { size, price, costing } = req.body;
    const sizeId = req.params.sizeId;

    const sql = 'UPDATE product_sizes SET size = ?, price = ?, costing = ? WHERE id = ?';
    db.query(sql, [size, price, costing, sizeId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Size updated successfully' });
    });
};

// Delete product size variant
exports.deleteProductSize = (req, res) => {
    const sizeId = req.params.sizeId;
    db.query('DELETE FROM product_sizes WHERE id = ?', [sizeId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Size deleted successfully' });
    });
};

// Upload multiple images for a product
exports.uploadProductImages = (req, res) => {
    const id = req.params.id;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const imgValues = req.files.map(f => [id, `/uploads/${f.filename}`]);
    db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imgValues], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Images uploaded successfully' });
    });
};

exports.getTestimonials = (req, res) => {
    db.query('SELECT * FROM testimonials WHERE is_active = TRUE', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Gallery
exports.getGallery = (req, res) => {
    db.query('SELECT * FROM gallery ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};


// Customers
exports.getCustomers = (req, res) => {
    db.query('SELECT * FROM customers ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getCustomerById = (req, res) => {
    db.query('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Customer not found' });
        res.json(results[0]);
    });
};

exports.addCustomer = (req, res) => {
    const { name, email, phone } = req.body;
    db.query('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [name, email, phone], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, email, phone, loyalty_points: 0, total_orders: 0, total_spent: 0 });
    });
};

exports.updateCustomer = (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    db.query('UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer updated successfully' });
    });
};

exports.deleteCustomer = (req, res) => {
    db.query('DELETE FROM customers WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer deleted' });
    });
};

// Credit/Debit
exports.getCreditDebit = (req, res) => {
    const sql = 'SELECT cd.*, o.invoice_number FROM credit_debit cd LEFT JOIN orders o ON cd.order_id = o.id ORDER BY cd.created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addCreditDebit = (req, res) => {
    const { type, amount, description, order_id } = req.body;
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query('INSERT INTO credit_debit (type, amount, description, order_id) VALUES (?, ?, ?, ?)', [type, amount, description, order_id], (err, result) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
            
            // Update daily stats
            const today = new Date().toISOString().split('T')[0];
            const updateStatSql = `
                INSERT INTO daily_stats (date, total_credit, total_debit)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    total_credit = total_credit + VALUES(total_credit),
                    total_debit = total_debit + VALUES(total_debit)
            `;
            const creditAmount = type === 'credit' ? amount : 0;
            const debitAmount = type === 'debit' ? amount : 0;
            
            db.query(updateStatSql, [today, creditAmount, debitAmount], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    res.json({ id: result.insertId, type, amount, description, order_id });
                });
            });
        });
    });
};

exports.deleteCreditDebit = (req, res) => {
    db.query('DELETE FROM credit_debit WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Transaction deleted' });
    });
};

exports.getSettings = (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = results.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        res.json(settings);
    });
};

exports.updateSettings = (req, res) => {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Setting key and value are required' });
    }
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query('SELECT id FROM settings WHERE setting_key = ?', [key], (err, results) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: err.message }));
            }
            
            const query = results.length > 0 
                ? 'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?'
                : 'INSERT INTO settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())';
            const params = results.length > 0 ? [value, key] : [key, value];
            
            db.query(query, params, (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: err.message }));
                }
                
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    res.json({ 
                        message: results.length > 0 ? 'Setting updated successfully' : 'Setting created successfully' 
                    });
                });
            });
        });
    });
};

// Orders & Billing
exports.createOrder = async (req, res) => {
    const {
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        items,
        total_amount,
        discount_applied,
        final_amount,
        payment_method,
        invoice_number,
        loyalty_points_used = 0,
        order_status = 'closed'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    try {
        const preparedItems = await prepareOrderItems(items);
        const orderTotals = sumPreparedItems(preparedItems);
        const safeDiscount = toMoney(discount_applied);
        const safeFinalAmount = toMoney(final_amount ?? (orderTotals.totalAmount - safeDiscount));
        const loyaltyPointsEarned = Math.floor(safeFinalAmount / 10);

        await beginTransactionAsync();

        const orderResult = await queryAsync(
            `INSERT INTO orders
             (invoice_number, customer_name, customer_email, customer_phone, total_amount, discount_applied, final_amount, payment_method, loyalty_points_earned, loyalty_points_used, order_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice_number || null,
                customer_name,
                customer_email,
                customer_phone,
                toMoney(total_amount ?? orderTotals.totalAmount),
                safeDiscount,
                safeFinalAmount,
                payment_method || 'cash',
                loyaltyPointsEarned,
                Number(loyalty_points_used) || 0,
                order_status
            ]
        );

        const orderId = orderResult.insertId;
        const fallbackInvoiceNumber = invoice_number || buildInvoiceNumber(orderId);
        if (!invoice_number) {
            await queryAsync('UPDATE orders SET invoice_number = ? WHERE id = ?', [fallbackInvoiceNumber, orderId]);
        }

        const itemValues = preparedItems.map(item => [
            orderId,
            item.product_id,
            item.product_size,
            item.quantity,
            item.unit_price,
            item.unit_cost,
            item.total_price,
            item.total_cost,
            item.total_profit
        ]);

        await queryAsync(
            `INSERT INTO order_items
             (order_id, product_id, product_size, quantity, unit_price, unit_cost, total_price, total_cost, total_profit)
             VALUES ?`,
            [itemValues]
        );

        for (const item of preparedItems) {
            await queryAsync(
                'UPDATE products SET inventory_count = GREATEST(inventory_count - ?, 0) WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // if (customer_id) {
        //     const pointsChange = loyaltyPointsEarned - (Number(loyalty_points_used) || 0);
        //     await queryAsync(
        //         'UPDATE customers SET loyalty_points = loyalty_points + ?, total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?',
        //         [pointsChange, safeFinalAmount, customer_id]
        //     );
        // }

        await commitAsync();
        res.json({ message: 'Order created successfully', orderId, invoice_number: fallbackInvoiceNumber });
    } catch (error) {
        await rollbackAsync();
        res.status(500).json({ error: error.message });
    }
};

exports.getOrders = (req, res) => {
    db.query('SELECT *, COALESCE(invoice_number, CONCAT("BWL-", LPAD(id, 8, "0"))) AS invoice_number FROM orders ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getOpenOrders = (req, res) => {
    db.query('SELECT *, COALESCE(invoice_number, CONCAT("BWL-", LPAD(id, 8, "0"))) AS invoice_number FROM orders WHERE order_status = "open" ORDER BY created_at DESC', (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (orders.length === 0) {
            return res.json([]);
        }
        
        const orderIds = orders.map(o => o.id);
        // Use LEFT JOIN to get items even if some products are deleted
        db.query(`
            SELECT
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.product_size,
                oi.quantity,
                oi.unit_price,
                oi.unit_cost,
                ROUND(oi.unit_price - oi.unit_cost, 2) AS unit_profit,
                oi.total_price,
                oi.total_cost,
                oi.total_profit,
                p.name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id IN (?)
        `, [orderIds], (err, items) => {
            if (err) {
                console.error('Error fetching order items:', err);
                // If items query failed, still return orders with empty items
                const ordersWithEmptyItems = orders.map(order => ({
                    ...order,
                    items: []
                }));
                return res.json(ordersWithEmptyItems);
            }
            
            const itemsByOrderId = items ? items.reduce((acc, item) => {
                if (!acc[item.order_id]) {
                    acc[item.order_id] = [];
                }
                acc[item.order_id].push(item);
                return acc;
            }, {}) : {};
            
            const ordersWithItems = orders.map(order => ({
                ...order,
                items: itemsByOrderId[order.id] || []
            }));
            
            res.json(ordersWithItems);
        });
    });
};

exports.getOrderById = (req, res) => {
    const orderSql = 'SELECT o.*, COALESCE(o.invoice_number, CONCAT("BWL-", LPAD(o.id, 8, "0"))) AS invoice_number, c.name as customer_name, c.loyalty_points FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?';
    const itemsSql = `
        SELECT
            oi.id,
            oi.order_id,
            oi.product_id,
            oi.product_size,
            oi.quantity,
            oi.unit_price,
            oi.unit_cost,
            ROUND(oi.unit_price - oi.unit_cost, 2) AS unit_profit,
            oi.total_price,
            oi.total_cost,
            oi.total_profit,
            p.name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `;
    
    db.query(orderSql, [req.params.id], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        db.query(itemsSql, [req.params.id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...orders[0], items });
        });
    });
};

exports.addItemsToOrder = async (req, res) => {
    const payloadOrderId = Number(req.params.id || req.body.orderId);
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!payloadOrderId || !items.length) {
        return res.status(400).json({ error: 'Order id and items are required' });
    }

    try {
        const preparedItems = await prepareOrderItems(items);
        const orderTotals = sumPreparedItems(preparedItems);
        await beginTransactionAsync();

        const orders = await queryAsync('SELECT * FROM orders WHERE id = ?', [payloadOrderId]);
        if (!orders.length) {
            await rollbackAsync();
            return res.status(404).json({ message: 'Order not found' });
        }
        if (orders[0].order_status !== 'open') {
            await rollbackAsync();
            return res.status(400).json({ message: 'Order is already closed' });
        }

        const order = orders[0];
        const newTotalAmount = toMoney(Number(order.total_amount) + orderTotals.totalAmount);
        const newFinalAmount = toMoney(newTotalAmount - Number(order.discount_applied || 0));
        const itemValues = preparedItems.map(item => [
            payloadOrderId,
            item.product_id,
            item.product_size,
            item.quantity,
            item.unit_price,
            item.unit_cost,
            item.total_price,
            item.total_cost,
            item.total_profit
        ]);

        await queryAsync(
            `INSERT INTO order_items
             (order_id, product_id, product_size, quantity, unit_price, unit_cost, total_price, total_cost, total_profit)
             VALUES ?`,
            [itemValues]
        );

        await queryAsync('UPDATE orders SET total_amount = ?, final_amount = ? WHERE id = ?', [newTotalAmount, newFinalAmount, payloadOrderId]);

        for (const item of preparedItems) {
            await queryAsync(
                'UPDATE products SET inventory_count = GREATEST(inventory_count - ?, 0) WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await commitAsync();
        res.json({ message: 'Items added successfully' });
    } catch (error) {
        await rollbackAsync();
        res.status(500).json({ error: error.message });
    }
};

exports.closeOrder = (req, res) => {
  db.query('UPDATE orders SET order_status = "closed" WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order closed successfully' });
  });
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const {
    customer_name,
    customer_email,
    customer_phone,
    items = [],
    total_amount,
    discount_applied,
    final_amount,
    payment_method,
    order_status
  } = req.body;

  try {
    const preparedItems = items.length ? await prepareOrderItems(items) : [];
    const orderTotals = sumPreparedItems(preparedItems);
    const safeDiscount = toMoney(discount_applied);
    const safeTotalAmount = toMoney(total_amount ?? orderTotals.totalAmount);
    const safeFinalAmount = toMoney(final_amount ?? (safeTotalAmount - safeDiscount));

    await beginTransactionAsync();

    await queryAsync(
      `UPDATE orders
       SET customer_name = ?, customer_email = ?, customer_phone = ?,
           total_amount = ?, discount_applied = ?, final_amount = ?,
           payment_method = ?, order_status = ?
       WHERE id = ?`,
      [customer_name, customer_email, customer_phone, safeTotalAmount, safeDiscount, safeFinalAmount, payment_method, order_status, id]
    );

    await queryAsync('DELETE FROM order_items WHERE order_id = ?', [id]);

    if (preparedItems.length) {
      const itemValues = preparedItems.map(item => [
        id,
        item.product_id,
        item.product_size,
        item.quantity,
        item.unit_price,
        item.unit_cost,
        item.total_price,
        item.total_cost,
        item.total_profit
      ]);

      await queryAsync(
        `INSERT INTO order_items
         (order_id, product_id, product_size, quantity, unit_price, unit_cost, total_price, total_cost, total_profit)
         VALUES ?`,
        [itemValues]
      );
    }

    await commitAsync();
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await rollbackAsync();
    res.status(500).json({ error: error.message });
  }
};

// Testimonials
exports.getTestimonials = (req, res) => {
    db.query('SELECT * FROM testimonials WHERE is_active = TRUE', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Gallery
exports.getGallery = (req, res) => {
    db.query('SELECT * FROM gallery ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Settings
exports.getSettings = (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = results.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        res.json(settings);
    });
};

// Stats
exports.getDailyStats = (req, res) => {
    const { startDate, endDate, limit = 30 } = req.query;
    const params = [];
    const filters = [];

    if (startDate) {
        filters.push('stats.date >= ?');
        params.push(startDate);
    }
    if (endDate) {
        filters.push('stats.date <= ?');
        params.push(endDate);
    }

    const sql = `
        SELECT *
        FROM (
            SELECT
                d.date,
                COALESCE(o.total_sales, 0) AS total_sales,
                COALESCE(o.total_cost, 0) AS total_cost,
                COALESCE(o.total_profit, 0) AS total_profit,
                COALESCE(c.total_credit, 0) AS total_credit,
                COALESCE(c.total_debit, 0) AS total_debit
            FROM (
                SELECT DATE(created_at) AS date FROM orders
                UNION
                SELECT DATE(created_at) AS date FROM credit_debit
            ) d
            LEFT JOIN (
                SELECT
                    DATE(o.created_at) AS date,
                    SUM(o.final_amount) AS total_sales,
                    SUM(COALESCE(oi.total_cost, 0)) AS total_cost,
                    SUM(COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0)) AS total_profit
                FROM orders o
                LEFT JOIN (
                    SELECT order_id, SUM(total_cost) AS total_cost, SUM(total_profit) AS total_profit
                    FROM order_items
                    GROUP BY order_id
                ) oi ON oi.order_id = o.id
                GROUP BY DATE(o.created_at)
            ) o ON o.date = d.date
            LEFT JOIN (
                SELECT
                    DATE(created_at) AS date,
                    SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS total_credit,
                    SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS total_debit
                FROM credit_debit
                GROUP BY DATE(created_at)
            ) c ON c.date = d.date
        ) stats
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY stats.date DESC
        LIMIT ?
    `;

    params.push(Number(limit) || 30);
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getSummaryStats = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    const sql = `
        SELECT 
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders) as total_revenue,
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders WHERE DATE(created_at) = ?) as today_revenue,
            (SELECT IFNULL(SUM(COALESCE(oi.total_cost, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_cost) AS total_cost FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id) as total_cost,
            (SELECT IFNULL(SUM(COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_profit) AS total_profit FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id) as total_profit,
            (SELECT IFNULL(SUM(COALESCE(oi.total_cost, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_cost) AS total_cost FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id WHERE DATE(o.created_at) = ?) as today_cost,
            (SELECT IFNULL(SUM(COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_profit) AS total_profit FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id WHERE DATE(o.created_at) = ?) as today_profit,
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders WHERE DATE_FORMAT(created_at, '%Y-%m') = ?) as current_month_revenue,
            (SELECT IFNULL(SUM(COALESCE(oi.total_cost, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_cost) AS total_cost FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id WHERE DATE_FORMAT(o.created_at, '%Y-%m') = ?) as current_month_cost,
            (SELECT IFNULL(SUM(COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0)), 0) FROM orders o LEFT JOIN (SELECT order_id, SUM(total_profit) AS total_profit FROM order_items GROUP BY order_id) oi ON oi.order_id = o.id WHERE DATE_FORMAT(o.created_at, '%Y-%m') = ?) as current_month_profit,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?) as today_orders,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT IFNULL(SUM(inventory_count), 0) FROM products) as total_inventory,
            (SELECT IFNULL(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) FROM credit_debit) as total_credit,
            (SELECT IFNULL(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) FROM credit_debit) as total_debit
    `;
    db.query(sql, [today, today, today, currentMonth, currentMonth, currentMonth, today], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

exports.getTransactions = (req, res) => {
    const { startDate, endDate } = req.query;
    const filters = [];
    const params = [];

    if (startDate) {
        filters.push('DATE(o.created_at) >= ?');
        params.push(startDate);
    }
    if (endDate) {
        filters.push('DATE(o.created_at) <= ?');
        params.push(endDate);
    }

    const sql = `
        SELECT 
            DATE(o.created_at) as transaction_date,
            COALESCE(o.invoice_number, CONCAT('BWL-', LPAD(o.id, 8, '0'))) as invoice_number,
            o.customer_name,
            o.customer_phone,
            o.payment_method,
            o.total_amount,
            o.discount_applied,
            o.final_amount,
            o.order_status,
            o.created_at,
            COALESCE(oi.item_count, 0) as item_count,
            COALESCE(oi.total_quantity, 0) as total_quantity,
            COALESCE(oi.total_cost, 0) as total_cost,
            COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0) as total_profit,
            COALESCE(oi.items_summary, '') as items_summary
        FROM orders o
        LEFT JOIN (
            SELECT
                oi.order_id,
                COUNT(oi.id) as item_count,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.total_cost) as total_cost,
                SUM(oi.total_profit) as total_profit,
                GROUP_CONCAT(
                    CONCAT(
                        COALESCE(p.name, 'Deleted Product'),
                        CASE WHEN oi.product_size IS NOT NULL AND oi.product_size <> '' THEN CONCAT(' (', oi.product_size, ')') ELSE '' END,
                        ' x',
                        oi.quantity
                    )
                    ORDER BY oi.id
                    SEPARATOR ', '
                ) as items_summary
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            GROUP BY oi.order_id
        ) oi ON o.id = oi.order_id
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY o.created_at DESC
    `;
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Group by date
        const transactionsByDate = results.reduce((acc, transaction) => {
            const date = transaction.transaction_date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(transaction);
            return acc;
        }, {});
        
        res.json(transactionsByDate);
    });
};

exports.getMonthlyStats = (req, res) => {
    const { startMonth, endMonth, limit = 12 } = req.query;
    const filters = [];
    const params = [];

    if (startMonth) {
        filters.push('stats.month >= ?');
        params.push(startMonth);
    }
    if (endMonth) {
        filters.push('stats.month <= ?');
        params.push(endMonth);
    }

    const sql = `
        SELECT *
        FROM (
            SELECT
                m.month,
                COALESCE(o.total_sales, 0) AS total_sales,
                COALESCE(o.total_cost, 0) AS total_cost,
                COALESCE(o.total_profit, 0) AS total_profit,
                COALESCE(c.total_credit, 0) AS total_credit,
                COALESCE(c.total_debit, 0) AS total_debit
            FROM (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month FROM orders
                UNION
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month FROM credit_debit
            ) m
            LEFT JOIN (
                SELECT
                    DATE_FORMAT(o.created_at, '%Y-%m') AS month,
                    SUM(o.final_amount) AS total_sales,
                    SUM(COALESCE(oi.total_cost, 0)) AS total_cost,
                    SUM(COALESCE(oi.total_profit, 0) - COALESCE(o.discount_applied, 0)) AS total_profit
                FROM orders o
                LEFT JOIN (
                    SELECT order_id, SUM(total_cost) AS total_cost, SUM(total_profit) AS total_profit
                    FROM order_items
                    GROUP BY order_id
                ) oi ON oi.order_id = o.id
                GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
            ) o ON o.month = m.month
            LEFT JOIN (
                SELECT
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS total_credit,
                    SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS total_debit
                FROM credit_debit
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ) c ON c.month = m.month
        ) stats
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY stats.month DESC
        LIMIT ?
    `;

    params.push(Number(limit) || 12);
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Upload invoice/pdf and return public URL
exports.uploadInvoice = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${filePath}`;
    res.json({ url: fullUrl });
};
