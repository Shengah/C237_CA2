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
        let latestLog = { sleepDate: 'No logs' };

        if (results.length > 0) {
            const total = results.reduce((sum, log) => {
                let duration = 0;

                // Calculate duration based on sleepTime and wakeTime if duration is missing
                if (log.sleepTime && log.wakeTime) {
                    const sleepTime = new Date(`1970-01-01T${log.sleepTime}Z`);
                    const wakeTime = new Date(`1970-01-01T${log.wakeTime}Z`);
                    duration = (wakeTime - sleepTime) / (1000 * 60 * 60); // Duration in hours
                    duration = duration.toFixed(1);
                } else {
                    duration = parseFloat(log.duration) || 0; // Use the stored duration if available
                }
                log.duration = duration; // Store the calculated duration back to log
                return sum + duration;
            }, 0);

            averageDuration = (results.length > 0) ? (total / results.length).toFixed(2) : 'N/A'; // Average in hours
            latestLog = results[0]; // Most recent entry
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
    // Modify SQL query to join 'users' table and get 'username' alongside 'sleep_logs' data
    const sql = 'SELECT sleep_logs.*, users.username FROM sleep_logs INNER JOIN users ON users.userId = sleep_logs.userId ORDER BY sleep_logs.sleepDate DESC';

    db.query(sql, (err, results) => {
        if (err) throw err;

        // Process the results and calculate the duration if not already present
        results.forEach(log => {
            if (log.sleepTime && log.wakeTime) {
                const sleepTime = new Date(`1970-01-01T${log.sleepTime}Z`);
                const wakeTime = new Date(`1970-01-01T${log.wakeTime}Z`);
                let duration = (wakeTime - sleepTime) / (1000 * 60 * 60); // Duration in hours
                log.duration = duration.toFixed(1); // Round to 1 decimal place
            } else {
                log.duration = log.duration || 'N/A'; // Use the stored duration if available or 'N/A'
            }
        });

        // Render the dashboard with user and sleepLogs data
        res.render('admin/dashboard', {
            user: req.session.user,
            sleepLogs: results // send all logs along with the username
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
