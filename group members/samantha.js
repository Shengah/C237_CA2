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

        let averageDuration = 'N/A';
        let latestLog = { date: 'No logs' };

        if (results.length > 0) {
            const total = results.reduce((sum, log) => sum + parseFloat(log.duration), 0);
            averageDuration = (total / results.length).toFixed(2);
            latestLog = results[0]; //Most recent entry
        }

        res.render('dashboard', {
            user,
            sleepLogs: results,
            averageDuration,
            latestLog,
            success: req.flash('success')
        });
    });
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
router.get('/admin/dashboard', checkAuthenticated, checkAdmin, (req, res) => {
    const sql = 'SELECT * FROM sleep_logs ORDER BY sleepDate DESC';

    db.query(sql, (err, results) => {
        if (err) throw err;

        res.render('admin/dashboard', {
            user: req.session.user,
            sleepLogs: results // send all logs
        });
    });
});

router.get('/addlog', (req, res) => {
    res.render('addlog'); // renders the form page
});

router.post('/addlog', checkAuthenticated, (req, res) => {
    console.log('Session User:', req.session.user);
    const { sleepDate, sleepTime, wakeTime, notes, sleepQuality, moodAfter } = req.body;
    const userId = req.session.user.userId; // <- Fix here

    const sql = `
      INSERT INTO sleep_logs (userId, sleepDate, sleepTime, wakeTime, notes, sleepQuality, moodAfter)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [userId, sleepDate, sleepTime, wakeTime, notes, sleepQuality, moodAfter], (err) => {
        if (err) {
            console.error('Failed to insert sleep log:', err);
            return res.status(500).send('Error saving log');
        }
        req.flash('success', 'Sleep log added!');
        res.redirect('/dashboard');
    });
});

module.exports = router;
