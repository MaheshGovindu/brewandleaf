const mysql = require('mysql2');
require('dotenv').config();
const { ensureSchema } = require('./schema');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mahindu@85',  //pmechtech0031
  database: process.env.DB_NAME || 'brew_and_leaf_db'
});

db.ready = new Promise((resolve, reject) => {
  db.connect(async (err) => {
    if (err) {
      console.error('MySQL Connection failed to database:', process.env.DB_NAME);
      console.error('Error Details:', err.message);
      return reject(err);
    }

    try {
      console.log('Successfully connected to MySQL database:', process.env.DB_NAME);
      await ensureSchema(db);
      console.log('Database schema is ready');
      resolve();
    } catch (schemaError) {
      console.error('Failed to ensure database schema:', schemaError.message);
      reject(schemaError);
    }
  });
});

module.exports = db;
