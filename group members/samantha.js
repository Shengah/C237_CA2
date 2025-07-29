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

//******** TODO: Insert code for dashboard route to render dashboard page for users. ********//
router.get('/dashboard', checkAuthenticated, (req, res) => {
    const user = req.session.user;

    if (!user || !user.userId) {
        req.flash('error', 'User not found in session');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM sleep_logs WHERE userId = ? ORDER BY sleepDate DESC';
    db.query(sql, [user.userId], (err, results) => {
        if (err) throw err;

        res.render('dashboard', {
            user,
            sleepLogs: results,
            success: req.flash('success')
        });
    });
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
router.get('/admin/dashboard', checkAuthenticated, checkAdmin, (req, res) => {
    const successMsg = req.flash('success');
    res.render('admin/dashboard', { user: req.session.user });
});

module.exports = router;
