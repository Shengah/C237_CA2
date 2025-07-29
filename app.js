const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('./db');

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 3 }
}));
app.use(flash());

const lishengRoutes = require('./group members/lisheng');
const chloeRoutes = require('./group members/chloe');
const samanthaRoutes = require('./group members/samantha');
const ShuyuRoutes = require('./group members/Shuyu');
const verrynRoutes = require('./group members/verryn');
const xianglingRoutes = require('./group members/xiangling');



app.use('/', lishengRoutes);
app.use('/', chloeRoutes);
app.use('/', samanthaRoutes);
app.use('/', ShuyuRoutes);
app.use('/', verrynRoutes);
app.use('/', xianglingRoutes);


app.listen(3000, () => {
    console.log('Server started on port 3000');
});