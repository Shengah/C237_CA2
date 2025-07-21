//main app.js, shared

const express = require('express');
const mysql = require('mysql2');


const session = require('express-session');
const flash = require('connect-flash');
const app = express();

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Republic_C237',
    database: 'sleeptracker'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    // Session expires after 1 week of inactivity
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));

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

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

// Starting the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});