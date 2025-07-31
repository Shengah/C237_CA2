//main app.js, shared
 
const express = require('express');
const mysql = require('mysql2');
const db = require('../db');
 
 
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const router = express.Router();
 
 
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
 
 
app.use(flash());
 
 
app.set('view engine', 'ejs');
 
 
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};
 
 
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/dashboard');
    }
};

router.get('/admin/sleeplog/search', checkAuthenticated, checkAdmin, async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      req.flash('error', 'Please enter a User ID to search');
      return res.redirect('/admin/sleeplog');
    }

    const [logs] = await db.promise().query(
      `SELECT * FROM sleep_logs WHERE userId = ? ORDER BY sleepDate DESC`,
      [userId]
    );

    res.render('admin/sleeplog', {
      sleep_logs: logs,
      searched: true,
      user: req.session.user // 确保传递user变量
    });
    
  } catch (err) {
    console.error('Error searching sleep logs:', err);
    req.flash('error', 'Error searching sleep logs');
    res.redirect('/admin/sleeplog');
  }
});

router.get('/admin/sleeplog', checkAuthenticated, checkAdmin, async (req, res) => {
  try {
    const [logs] = await db.promise().query(
      `SELECT * FROM sleep_logs ORDER BY sleepDate DESC`
    );

    res.render('admin/sleeplog', {
      sleep_logs: logs,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error fetching sleep logs:', err);
    req.flash('error', 'Error fetching sleep logs');
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;