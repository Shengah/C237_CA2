//main app.js, shared

const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');

const session = require('express-session');
const flash = require('connect-flash');
const app = express();


// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save upload file
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

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
    // Session expires after 3 days of inactivity
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 3 }
}));

app.use(flash());


app.set('view engine', 'ejs');

//******** TODO: Create a Middleware to check if user is logged in. ********//
const checkAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'Please log in to view this resource');
        res.redirect('/login');
    }
};

// check if its admin // 
const checkAdmin = (req, res, next) => {
    if (req.session.user.role === 'admin') {
        return next();
    } else {
        req.flash('error', 'Access denied');
        res.redirect('/admin/dashboard');
    }
};

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success') });
});

app.get('/login', (req, res) => {
    res.render('login', {
        messages: req.flash('success'),
        errors: req.flash('error')
    });
});

//******** TODO: Insert code for login routes for form submission below ********//
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            // Successful login
            req.session.user = results[0]; // store user in session
            req.flash('success', 'Login successful!');
            //******** TO DO: Update to redirect users to /dashboard route upon successful log in ********//
            // Redirect based on role
            if (results[0].role === 'admin') {
                res.redirect('/admin/dashboard');
            } else {
                res.redirect('/dashboard');
            }
        } else {
            // Invalid credentials
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
});

// forgot password page
app.get('/forgot', (req, res) => {
    res.render('forgot', { errors: req.flash('error'), messages: req.flash('success') });
});

app.post('/forgot', (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            req.flash('error', 'Email not found.');
            return res.redirect('/forgot');
        }

        // Save email to session temporarily for resetting password
        req.session.resetEmail = email;
        res.redirect('/reset');
    });
});

app.get('/reset', (req, res) => {
    if (!req.session.resetEmail) return res.redirect('/login');
    res.render('reset', { errors: req.flash('error') });
});

// reset password 
app.post('/reset', (req, res) => {
    const email = req.session.resetEmail;
    const { password } = req.body;

    if (!email) return res.redirect('/login');
    if (!password || password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters.');
        return res.redirect('/reset');
    }

    // save password to database
    const sql = 'UPDATE users SET password = SHA1(?) WHERE email = ?';
    db.query(sql, [password, email], (err, result) => {
        if (err) throw err;
        req.session.resetEmail = null;
        req.flash('success', 'Password reset successful! You may now log in.');
        res.redirect('/login');
    });
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});


//******** TODO: Create a middleware function validateRegistration ********//
const validateRegistration = (req, res, next) => {
    const { username, email, password, } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 or more characters long');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};


//******** TODO: Integrate validateRegistration into the register route. ********//
app.post('/register', upload.single('profilepic'), validateRegistration, (req, res) => {
    //******** TODO: Update register route to include role. ********//
    const profilepic = req.file ? req.file.filename : null;
    const { username, email, password, role } = req.body;

    const sql = 'INSERT INTO users (profilepic, username, email, password, role) VALUES (?,?, ?, SHA1(?), ?)';
    db.query(sql, [profilepic, username, email, password, role], (err, result) => {
        if (err) throw err;
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

//******** TODO: Insert code for dashboard route to render dashboard page for users. ********//
app.get('/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
app.get('/admin/dashboard', checkAuthenticated, checkAdmin, (req, res) => {
    res.render('admin/dashboard', { user: req.session.user });
});

// logout 
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Starting the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});