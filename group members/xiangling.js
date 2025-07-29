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

<<<<<<< HEAD:group members/xiangling.js

module.exports = router;
=======
// Add method-override to handle DELETE requests from forms
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Delete sleep log route
app.delete('/sleep-logs/:id/delete', checkAuthenticated, (req, res) => {
    const sleepLogId = req.params.id;
    const userId = req.session.user.id;
    
    // First verify the log belongs to the user (unless admin)
    db.query(
        'SELECT user_id FROM sleep_logs WHERE id = ?', 
        [sleepLogId], 
        (err, results) => {
            if (err) {
                req.flash('error', 'Error deleting sleep log');
                return res.redirect('/sleep-logs');
            }
            
            if (results.length === 0) {
                req.flash('error', 'Sleep log not found');
                return res.redirect('/sleep-logs');
            }
            
            // Check if user owns the log or is admin
            if (results[0].user_id !== userId && req.session.user.role !== 'admin') {
                req.flash('error', 'Not authorized to delete this log');
                return res.redirect('/sleep-logs');
            }
            
            // Proceed with deletion
            db.query(
                'DELETE FROM sleep_logs WHERE id = ?',
                [sleepLogId],
                (err, results) => {
                    if (err) {
                        req.flash('error', 'Error deleting sleep log');
                        return res.redirect('/sleep-logs');
                    }
                    req.flash('success', 'Sleep log deleted successfully');
                    res.redirect('/sleep-logs');
                }
            );
        }
    );
});

// Admin delete route
app.delete('/admin/sleep-logs/:id/delete', checkAuthenticated, checkAdmin, (req, res) => {
    const sleepLogId = req.params.id;
    
    db.query(
        'DELETE FROM sleep_logs WHERE id = ?',
        [sleepLogId],
        (err, results) => {
            if (err) {
                req.flash('error', 'Error deleting sleep log');
                return res.redirect('/admin/sleep-logs');
            }
            req.flash('success', 'Sleep log deleted successfully');
            res.redirect('/admin/sleep-logs');
        }
    );
});


// Starting the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
>>>>>>> 23e1fe84586dba5168501b0269e69845334ae1a3:xiangling.js
