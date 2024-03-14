const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require("method-override");
const ejsMate =require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');
const user = require('./routes/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');

mongoose.connect('mongodb+srv://sriram:camps@cluster0.88kqnqd.mongodb.net/yelpcamp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app =express();
app.use(express.json());


app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname , 'views/campgroundscrud'))
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', user);
app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)

app.get('/',(req,res)=>{
    res.render('../home')
});

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not Found',404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('../error', { err })
})

app.listen(3000, ()=>{
    console.log('Server on port 3000')
})