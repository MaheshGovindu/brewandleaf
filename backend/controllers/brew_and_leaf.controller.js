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
        res.json(results);
    });
};

exports.addProduct = (req, res) => {
    const { category_id, sub_category_id, name, description, price, costing, discount, inventory_count, aspect_ratio } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const sql = 'INSERT INTO products (category_id, sub_category_id, name, description, price, costing, discount, inventory_count, image_url, aspect_ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [category_id, sub_category_id, name, description, price, costing, discount, inventory_count, image_url, aspect_ratio], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, price });
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

// Orders
exports.createOrder = (req, res) => {
    const { customer_name, customer_email, items, total_amount, discount_applied, final_amount } = req.body;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        const orderSql = 'INSERT INTO orders (customer_name, customer_email, total_amount, discount_applied, final_amount) VALUES (?, ?, ?, ?, ?)';
        db.query(orderSql, [customer_name, customer_email, total_amount, discount_applied, final_amount], (err, result) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ error: err.message }));
            }
            
            const orderId = result.insertId;
            const itemSql = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ?';
            const itemValues = items.map(item => [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]);

            db.query(itemSql, [itemValues], (err, result) => {
                if (err) {
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

                Promise.all(inventoryPromises)
                    .then(() => {
                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                            res.json({ message: 'Order created successfully', orderId });
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

exports.getOrderById = (req, res) => {
    const orderSql = 'SELECT * FROM orders WHERE id = ?';
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

// Stats
exports.getDailyStats = (req, res) => {
    db.query('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 30', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getSummaryStats = (req, res) => {
    const sql = `
        SELECT 
            (SELECT IFNULL(SUM(final_amount), 0) FROM orders) as total_revenue,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT IFNULL(SUM(inventory_count), 0) FROM products) as total_inventory
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

// Upload invoice/pdf and return public URL
exports.uploadInvoice = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${filePath}`;
    res.json({ url: fullUrl });
};
