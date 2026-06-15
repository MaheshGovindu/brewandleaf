const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
        SELECT p.*, c.name as category_name, s.name as sub_category_name 
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
                    acc[row.product_id].push({ id: row.id, size: row.size, price: row.price, costing: row.costing });
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
    const sql = `SELECT p.*, c.name as category_name, s.name as sub_category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN sub_categories s ON p.sub_category_id = s.id WHERE p.id = ?`;
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
exports.createOrder = (req, res) => {
    console.log('Creating order with payload:', JSON.stringify(req.body, null, 2));
    
    const { customer_id, customer_name, customer_email, customer_phone, items, total_amount, discount_applied, final_amount, payment_method, invoice_number, loyalty_points_used = 0, order_status = 'closed' } = req.body;
    
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
    }
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        // Calculate loyalty points earned (1 point per ₹10 spent)
        const loyalty_points_earned = Math.floor(final_amount / 10);
        
        const orderSql = 'INSERT INTO orders (invoice_number, customer_id, customer_name, customer_email, customer_phone, total_amount, discount_applied, final_amount, payment_method, loyalty_points_earned, loyalty_points_used, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(orderSql, [invoice_number, customer_id, customer_name, customer_email, customer_phone, total_amount, discount_applied, final_amount, payment_method, loyalty_points_earned, loyalty_points_used, order_status], (err, result) => {
            if (err) {
                console.error('Error inserting order:', err);
                return db.rollback(() => res.status(500).json({ error: err.message }));
            }
            
            const orderId = result.insertId;
            console.log('Order created with ID:', orderId);
            
            // Map items properly - handle both size and product_size
            const itemValues = items.map(item => [
                orderId, 
                item.product_id, 
                item.product_size || item.size || null, // Accept either field
                item.quantity, 
                Number(item.unit_price), 
                Number(item.total_price)
            ]);
            
            console.log('Inserting items:', itemValues);
            
            const itemSql = 'INSERT INTO order_items (order_id, product_id, product_size, quantity, unit_price, total_price) VALUES ?';
            
            db.query(itemSql, [itemValues], (err) => {
                if (err) {
                    console.error('Error inserting order items:', err);
                    return db.rollback(() => res.status(500).json({ error: err.message }));
                }

                // Update inventory
                const inventoryPromises = items.map(item => {
                    return new Promise((resolve, reject) => {
                        db.query('UPDATE products SET inventory_count = inventory_count - ? WHERE id = ?', [item.quantity, item.product_id], (err, res) => {
                            if (err) reject(err);
                            else resolve(res);
                        });
                    });
                });

                // Update customer loyalty points and stats if customer exists
                let customerPromise = Promise.resolve();
                if (customer_id) {
                    customerPromise = new Promise((resolve, reject) => {
                        const pointsChange = loyalty_points_earned - loyalty_points_used;
                        db.query('UPDATE customers SET loyalty_points = loyalty_points + ?, total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?', [pointsChange, final_amount, customer_id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }

                // Update daily stats
                const today = new Date().toISOString().split('T')[0];
                const updateStatSql = `
                    INSERT INTO daily_stats (date, total_sales)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE
                        total_sales = total_sales + VALUES(total_sales)
                `;
                
                Promise.all([...inventoryPromises, customerPromise])
                    .then(() => {
                        db.query(updateStatSql, [today, final_amount], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                            
                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                console.log('Order committed successfully!');
                                res.json({ message: 'Order created successfully', orderId, invoice_number });
                            });
                        });
                    })
                    .catch(err => db.rollback(() => res.status(500).json({ error: err.message })));
            });
        });
    });
};

exports.getOrders = (req, res) => {
    db.query('SELECT * FROM orders ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getOpenOrders = (req, res) => {
    db.query('SELECT * FROM orders WHERE order_status = "open" ORDER BY created_at DESC', (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (orders.length === 0) {
            return res.json([]);
        }
        
        const orderIds = orders.map(o => o.id);
        // Use LEFT JOIN to get items even if some products are deleted
        db.query('SELECT oi.*, p.name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id IN (?)', [orderIds], (err, items) => {
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
    const orderSql = 'SELECT o.*, c.name as customer_name, c.loyalty_points FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?';
    const itemsSql = 'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?';
    
    db.query(orderSql, [req.params.id], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
        
        db.query(itemsSql, [req.params.id], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...orders[0], items });
        });
    });
};

exports.addItemsToOrder = (req, res) => {
    const { orderId, items } = req.body;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Get current order
        db.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orders) => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
            if (orders.length === 0) return db.rollback(() => res.status(404).json({ message: 'Order not found' }));
            if (orders[0].order_status !== 'open') return db.rollback(() => res.status(400).json({ message: 'Order is already closed' }));
            
            const order = orders[0];
            const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0);
            const newTotalAmount = order.total_amount + itemsTotal;
            const newFinalAmount = newTotalAmount - order.discount_applied;
            
            // Insert new items
            const itemSql = 'INSERT INTO order_items (order_id, product_id, product_size, quantity, unit_price, total_price) VALUES ?';
            const itemValues = items.map(item => [orderId, item.product_id, item.size, item.quantity, item.unit_price, item.total_price]);
            
            db.query(itemSql, [itemValues], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                
                // Update order totals
                db.query('UPDATE orders SET total_amount = ?, final_amount = ? WHERE id = ?', [newTotalAmount, newFinalAmount, orderId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                    
                    // Update inventory
                    const inventoryPromises = items.map(item => {
                        return new Promise((resolve, reject) => {
                            db.query('UPDATE products SET inventory_count = inventory_count - ? WHERE id = ?', [item.quantity, item.product_id], (err, res) => {
                                if (err) reject(err);
                                else resolve(res);
                            });
                        });
                    });
                    
                    Promise.all(inventoryPromises)
                        .then(() => {
                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                                res.json({ message: 'Items added successfully' });
                            });
                        })
                        .catch(err => db.rollback(() => res.status(500).json({ error: err.message })));
                });
            });
        });
    });
};

exports.closeOrder = (req, res) => {
  db.query('UPDATE orders SET order_status = "closed" WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order closed successfully' });
  });
};

exports.updateOrder = (req, res) => {
  console.log('Updating order with payload:', JSON.stringify(req.body, null, 2));
  
  const { id } = req.params;
  const { customer_name, customer_email, customer_phone, items, total_amount, discount_applied, final_amount, payment_method, order_status } = req.body;

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: err.message });

    // Update order details
    const orderSql = `
      UPDATE orders 
      SET customer_name = ?, customer_email = ?, customer_phone = ?, 
          total_amount = ?, discount_applied = ?, final_amount = ?, 
          payment_method = ?, order_status = ?
      WHERE id = ?
    `;
    db.query(orderSql, [customer_name, customer_email, customer_phone, total_amount, discount_applied, final_amount, payment_method, order_status, id], (err) => {
      if (err) {
        console.error('Error updating order:', err);
        return db.rollback(() => res.status(500).json({ error: err.message }));
      }

      // Delete old order items
      db.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
        if (err) {
          console.error('Error deleting old order items:', err);
          return db.rollback(() => res.status(500).json({ error: err.message }));
        }

        // Insert new order items
        if (items && items.length > 0) {
          // Map items properly - handle both size and product_size
          const itemValues = items.map(item => [
            id, 
            item.product_id, 
            item.product_size || item.size || null, // Accept either field
            item.quantity, 
            Number(item.unit_price), 
            Number(item.total_price)
          ]);
          
          console.log('Inserting updated items:', itemValues);
          
          const itemSql = 'INSERT INTO order_items (order_id, product_id, product_size, quantity, unit_price, total_price) VALUES ?';
          db.query(itemSql, [itemValues], (err) => {
            if (err) {
              console.error('Error inserting updated order items:', err);
              return db.rollback(() => res.status(500).json({ error: err.message }));
            }

            db.commit(err => {
              if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
              console.log('Order updated successfully!');
              res.json({ message: 'Order updated successfully' });
            });
          });
        } else {
          db.commit(err => {
            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
            console.log('Order updated (no items) successfully!');
            res.json({ message: 'Order updated successfully' });
          });
        }
      });
    });
  });
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
    db.query('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getSummaryStats = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const sql = `
        SELECT 
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders) as total_revenue,
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders WHERE DATE(created_at) = ?) as today_revenue,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?) as today_orders,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT IFNULL(SUM(inventory_count), 0) FROM products) as total_inventory,
            (SELECT IFNULL(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) FROM credit_debit) as total_credit,
            (SELECT IFNULL(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) FROM credit_debit) as total_debit
    `;
    db.query(sql, [today, today], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

exports.getTransactions = (req, res) => {
    const sql = `
        SELECT 
            DATE(o.created_at) as transaction_date,
            o.invoice_number,
            o.customer_name,
            o.customer_phone,
            o.payment_method,
            o.total_amount,
            o.discount_applied,
            o.final_amount,
            o.order_status,
            o.created_at,
            COUNT(oi.id) as item_count,
            SUM(oi.quantity) as total_quantity
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;
    db.query(sql, (err, results) => {
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

// Upload invoice/pdf and return public URL
exports.uploadInvoice = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${filePath}`;
    res.json({ url: fullUrl });
};
