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

//verryn code
router.get('/admin/sleeplog', checkAuthenticated, (req, res) => {
    const sql = 'SELECT * FROM sleep_logs';
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving sleep logs');
        }

        res.render('admin/sleeplog', { user: req.session.user, sleep_logs: results });
    });
});

// View a single sleep log (renders views/admin/sleeplog_view.ejs)
router.get('/admin/sleeplog/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM sleep_logs WHERE logId = ?';

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving sleep log by ID');
        }
        if (results.length > 0) {
            res.render('admin/sleeplog_view', {
                user: req.session.user,
                sleep_log: results[0]
            });
        } else {
            res.status(404).send('Sleep log not found');
        }
    });
});

router.get('/sleeplogs', checkAuthenticated, (req, res) => {
    const userId = req.session.user.userId;  // Get the logged-in user's ID from the session

    const sql = 'SELECT * FROM sleep_logs WHERE userId = ? ORDER BY sleepDate DESC';

    db.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving sleep logs');
        }

        // Render the sleeplogs.ejs view
        res.render('sleeplogs', {
            user: req.session.user,
            sleep_logs: results
        });
    });
});

// User view single sleep log (renders sleeplog_view.ejs for user)
router.get('/sleeplog_view/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM sleep_logs WHERE logId = ? AND userId = ?'; // Ensure userId is included in the query for user-specific logs

    db.query(sql, [id, req.session.user.userId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving sleep log by ID');
        }
        if (results.length > 0) {
            res.render('sleeplog_view', {  // Render the user-specific view
                user: req.session.user,
                sleep_log: results[0]
            });
        } else {
            res.status(404).send('Sleep log not found');
        }
    });
});


module.exports = router;
