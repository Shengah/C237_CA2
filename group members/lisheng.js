//main app.js, shared

const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');

const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const router = express.Router();
const db = require('../db');

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

router.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success') });
});

router.get('/login', (req, res) => {
    res.render('login', {
        messages: req.flash('success'),
        errors: req.flash('error')
    });
});

//******** TODO: Insert code for login routes for form submission below ********//
router.post('/login', (req, res) => {
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
router.get('/forgot', (req, res) => {
    res.render('forgot', { errors: req.flash('error'), messages: req.flash('success') });
});

router.post('/forgot', (req, res) => {
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

router.get('/reset', (req, res) => {
    if (!req.session.resetEmail) return res.redirect('/login');
    res.render('reset', { errors: req.flash('error') });
});

// reset password 
router.post('/reset', (req, res) => {
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

router.get('/register', (req, res) => {
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
router.post('/register', upload.single('profilepic'), validateRegistration, (req, res) => {
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



router.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile', { user: req.session.user });
});

//editprofile
router.get('/editprofile', checkAuthenticated, (req, res) => {
    res.render('editprofile', {
        user: req.session.user,
        errors: req.flash('error'),
        success: req.flash('profileSuccess')
    });
});

//edit profile
router.post('/editprofile', checkAuthenticated, upload.single('profilepic'), (req, res) => {
    const { username, password, confirmPassword } = req.body;
    const profilepic = req.file ? req.file.filename : req.session.user.profilepic;

    if (!username) {
        req.flash('error', 'Username cannot be empty.');
        return res.redirect('/editprofile');
    }

    // CASE: user wants to update password
    if (password) {
        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters.');
            return res.redirect('/editprofile');
        }

        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('/editprofile');
        }

        // valid password + confirmation: update all
        const sql = 'UPDATE users SET username = ?, profilepic = ?, password = SHA1(?) WHERE userId = ?';
        const params = [username, profilepic, password, req.session.user.userId];

        db.query(sql, params, (err, result) => {
            if (err) throw err;
            req.session.user.username = username;
            req.session.user.profilepic = profilepic;
            req.flash('profileSuccess', 'Profile updated successfully!');
            return res.redirect('/editprofile');
        });
    } else {
        // CASE: no password change — only update username and profilepic
        const sql = 'UPDATE users SET username = ?, profilepic = ? WHERE userId = ?';
        const params = [username, profilepic, req.session.user.userId];

        db.query(sql, params, (err, result) => {
            if (err) throw err;
            req.session.user.username = username;
            req.session.user.profilepic = profilepic;
            req.flash('profileSuccess', 'Profile updated successfully!');
            return res.redirect('/editprofile');
        });
    }
});

router.post('/deleteaccount', checkAuthenticated, (req, res) => {
    const userId = req.session.user.userId;

    const sql = 'DELETE FROM users WHERE userId = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) throw err;

        // Destroy session after deletion
        req.session.destroy((err) => {
            if (err) throw err;
            res.redirect('/'); // Redirect wherever you want after deletion
        });
    });
});


// logout 
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
