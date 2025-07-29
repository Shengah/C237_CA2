// db.js
const mysql = require('mysql2');

// Create a single shared connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Republic_C237',
  database: 'sleeptracker'
});

// Connect once
db.connect((err) => {
  if (err) throw err;
  console.log('✅ Connected to database');
});

// Export for use in all routes
module.exports = db;
