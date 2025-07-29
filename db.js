// db.js
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect once
db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to database');
});

// Export for use in all routes
module.exports = db;
