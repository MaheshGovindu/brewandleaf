const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pmechtech0031',
  database: process.env.DB_NAME || 'brew_and_leaf_db'
});

db.connect((err) => {
  if(err){
    console.error('MySQL Connection failed to database:', process.env.DB_NAME);
    console.error('Error Details:', err.message);
    throw err;
  } else {
    console.log('Successfully connected to MySQL database:', process.env.DB_NAME);
  }
});

module.exports = db;