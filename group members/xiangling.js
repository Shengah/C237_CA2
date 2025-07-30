//main app.js, shared
 
const express = require('express');
const mysql = require('mysql2');
 
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const router = express.Router();
const db = require('../db');
 
 
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

router.get('/sleep-logs', checkAuthenticated, async (req, res) => {
    const userId = req.session.user.userId;

    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM sleep_logs WHERE userId = ?',
            [userId]
        );

        res.render('sleep-logs', { sleepLogs: rows }); // Make sure this view exists
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load sleep logs');
        res.redirect('/');
    }
});

router.post('/sleep-logs/:id/delete', checkAuthenticated, async (req, res) => {
    const sleepLogId = req.params.id;
    const userId = req.session.user.userId;

    try {
        const [rows] = await db.promise().query(
            'SELECT userId FROM sleep_logs WHERE logId = ?',
            [sleepLogId]
        );

        if (rows.length === 0 || rows[0].userId !== userId) {
            req.flash('error', 'Not authorized or log not found');
            return res.redirect('/dashboard');
        }

        await db.promise().query('DELETE FROM sleep_logs WHERE logId = ?', [sleepLogId]);

        req.flash('success', 'Log deleted');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error deleting log:', err);
        req.flash('error', 'Something went wrong');
        res.redirect('/dashboard');
    }
});






router.get('/sleep-calculator', (req, res) => {
    try {
        res.render('sleep-calculator', {
            title: 'Sleep Calculator',
            user: req.session.user,  // Pass user data if available
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    } catch (err) {
        console.error('Error rendering sleep calculator:', err);
        req.flash('error', 'Sleep calculator is currently unavailable');
        res.redirect('/');
    }
});
 

module.exports = router;