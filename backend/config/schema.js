// USE brew_and_leaf_db;
// ALTER TABLE products
// DROP COLUMN margin;


const TABLES = {
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      sub_category_id INT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      costing DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(10, 2) DEFAULT 0.00,
      inventory_count INT DEFAULT 0,
      image_url VARCHAR(255),
      aspect_ratio VARCHAR(20) DEFAULT '1:1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  product_sizes: `
    CREATE TABLE IF NOT EXISTS product_sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      size VARCHAR(50) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      costing DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_product_size (product_id, size)
    )
  `,
  product_images: `
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      loyalty_points INT DEFAULT 0,
      total_orders INT DEFAULT 0,
      total_spent DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(100) NULL,
      customer_id INT NULL,
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      discount_applied DECIMAL(10, 2) DEFAULT 0.00,
      final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(20) DEFAULT 'cash',
      payment_status VARCHAR(20) DEFAULT 'paid',
      order_status VARCHAR(20) DEFAULT 'open',
      loyalty_points_earned INT DEFAULT 0,
      loyalty_points_used INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  order_items: `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_size VARCHAR(50),
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      total_profit DECIMAL(10, 2) NOT NULL DEFAULT 0.00
    )
  `,
  credit_debit: `
    CREATE TABLE IF NOT EXISTS credit_debit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      description TEXT,
      order_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  daily_stats: `
    CREATE TABLE IF NOT EXISTS daily_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      total_sales DECIMAL(10, 2) DEFAULT 0.00,
      total_cost DECIMAL(10, 2) DEFAULT 0.00,
      total_profit DECIMAL(10, 2) DEFAULT 0.00,
      total_credit DECIMAL(10, 2) DEFAULT 0.00,
      total_debit DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
};

const REQUIRED_COLUMNS = {
  products: [
    ['description', 'TEXT NULL'],
    ['sub_category_id', 'INT NULL'],
    ['costing', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['discount', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['inventory_count', 'INT NOT NULL DEFAULT 0'],
    ['image_url', 'VARCHAR(255) NULL'],
    ['aspect_ratio', "VARCHAR(20) NOT NULL DEFAULT '1:1'"],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ],
  product_sizes: [
    ['costing', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ],
  product_images: [
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ],
  customers: [
    ['email', 'VARCHAR(255) NULL'],
    ['phone', 'VARCHAR(50) NULL'],
    ['loyalty_points', 'INT NOT NULL DEFAULT 0'],
    ['total_orders', 'INT NOT NULL DEFAULT 0'],
    ['total_spent', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ],
  orders: [
    ['invoice_number', 'VARCHAR(100) NULL'],
    ['customer_email', 'VARCHAR(255) NULL'],
    ['customer_phone', 'VARCHAR(50) NULL'],
    ['discount_applied', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['payment_method', "VARCHAR(20) NOT NULL DEFAULT 'cash'"],
    ['payment_status', "VARCHAR(20) NOT NULL DEFAULT 'paid'"],
    ['order_status', "VARCHAR(20) NOT NULL DEFAULT 'open'"],
    ['loyalty_points_earned', 'INT NOT NULL DEFAULT 0'],
    ['loyalty_points_used', 'INT NOT NULL DEFAULT 0'],
    ['updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP']
  ],
  order_items: [
    ['product_size', 'VARCHAR(50) NULL'],
    ['unit_cost', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['total_cost', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['total_profit', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00']
  ],
  credit_debit: [
    ['description', 'TEXT NULL'],
    ['order_id', 'INT NULL'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ],
  daily_stats: [
    ['total_cost', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['total_profit', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['total_credit', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['total_debit', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP']
  ]
};

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tableName, indexName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function ensureTable(connection, tableName) {
  await connection.query(TABLES[tableName]);
}

async function ensureColumns(connection, tableName) {
  for (const [columnName, definition] of REQUIRED_COLUMNS[tableName] || []) {
    const exists = await columnExists(connection, tableName, columnName);
    if (!exists) {
      await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    }
  }
}

async function normalizeExistingData(connection) {
  const hasOrders = await tableExists(connection, 'orders');
  if (hasOrders && await columnExists(connection, 'orders', 'invoice_number')) {
    await connection.query(
      `UPDATE orders
       SET invoice_number = CONCAT('BWL-', LPAD(id, 8, '0'))
       WHERE invoice_number IS NULL OR TRIM(invoice_number) = ''`
    );
  }

  if (await tableExists(connection, 'order_items')) {
    await connection.query(
      `UPDATE order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_sizes ps
         ON ps.product_id = oi.product_id
        AND LOWER(ps.size) = LOWER(COALESCE(oi.product_size, ''))
       SET
         oi.unit_cost = COALESCE(ps.costing, p.costing, oi.unit_cost, 0),
         oi.total_cost = COALESCE(ps.costing, p.costing, oi.unit_cost, 0) * oi.quantity,
         oi.total_profit = oi.total_price - (COALESCE(ps.costing, p.costing, oi.unit_cost, 0) * oi.quantity)
       WHERE
         oi.unit_cost IS NULL OR oi.unit_cost = 0 OR
         oi.total_cost IS NULL OR oi.total_cost = 0 OR
         oi.total_profit IS NULL OR oi.total_profit = 0`
    );
  }
}

async function ensureIndexes(connection) {
  if (await tableExists(connection, 'product_sizes')) {
    const hasSizeIndex = await indexExists(connection, 'product_sizes', 'unique_product_size');
    if (!hasSizeIndex) {
      await connection.query('ALTER TABLE `product_sizes` ADD UNIQUE KEY `unique_product_size` (`product_id`, `size`)');
    }
  }

  if (await tableExists(connection, 'orders')) {
    const hasInvoiceIndex = await indexExists(connection, 'orders', 'unique_invoice_number');
    if (!hasInvoiceIndex) {
      await connection.query('ALTER TABLE `orders` ADD UNIQUE KEY `unique_invoice_number` (`invoice_number`)');
    }
  }
}

async function ensureSchema(db) {
  const connection = db.promise();

  for (const tableName of Object.keys(TABLES)) {
    await ensureTable(connection, tableName);
    await ensureColumns(connection, tableName);
  }

  await normalizeExistingData(connection);
  await ensureIndexes(connection);
}

module.exports = { ensureSchema };
