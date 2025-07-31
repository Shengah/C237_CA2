//main app.js, shared

const express = require('express');
const mysql = require('mysql2');


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




// GET: load edit form for the specific log (with id)
router.get('/editlog/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id; // Get the log id from the URL parameter

    // Fetch the log from the database using the log_id
    db.query('SELECT * FROM sleep_logs WHERE logId = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Could not load sleep log');
            return res.redirect('/sleeplogs');  // Redirect to all logs in case of error
        }
        if (results.length === 0) {
            req.flash('error', 'Sleep log not found');
            return res.redirect('/sleeplogs');  // Redirect to all logs if not found
        }

        res.render('editlog', {
            user: req.session.user,  // Pass the user object
            log: results[0],
            isAdmin: !!req.session.admin,
            messages: req.flash()
        });
    });
});

// POST route to update the sleep log
router.post('/editlog/:id', checkAuthenticated, (req, res) => {
    const id = req.params.id;  // Get the 'id' from the URL parameter
    const { date, sleepTime, wakeTime, sleepQuality, moodAfter, notes } = req.body;

    // Check for missing fields (you can add validation here)
    if (!date || !sleepTime || !wakeTime || !sleepQuality) {
        req.flash('error', 'All fields are required!');
        return res.redirect(`/editlog/${id}`);  // Redirect to the edit page if any required fields are missing
    }

    // Update the log in the database using the provided id
    db.query(
        'UPDATE sleep_logs SET sleepDate = ?, sleepTime = ?, wakeTime = ?, sleepQuality = ?, moodAfter = ?, notes = ? WHERE logId = ?',
        [date, sleepTime, wakeTime, sleepQuality, moodAfter, notes, id],
        (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Update failed');
                return res.redirect(`/editlog/${id}`); // Redirect if update fails
            }

            req.flash('success', 'Sleep log updated successfully');
            res.redirect('/sleeplogs');  // Redirect to the list of all logs (or user-specific logs)
        }
    );
});

module.exports = router;
