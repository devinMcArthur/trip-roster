require('./config/config');

const express = require('express');
const {mongoose} = require('./db/mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const {ObjectID} = require('mongodb');
const path = require('path');
const passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const async = require('async');
const flash = require('express-flash');

const {User} = require('./models/user')

const port = process.env.PORT || 3000;
var app = express();
var sess = {
  secret: "its-a-very-secret-trip",
  cookie: {},
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
};

passport.use(new LocalStrategy({
  usernameField: 'email'
},function(username, password, done) {
  User.findOne({ email: username }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    });
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session(sess));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.baseUrl = req.headers.host;
  res.locals.user = req.user;
  res.locals.query = req.query;
  next();
});
app.use( function (req, res, next) {
  if ( req.method == 'POST' && req.url == '/login' ) {
    if ( req.body.remember ) {
      req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
    } else {
      req.session.cookie.expires = false;
    }
  }
  next();
});

// GET root
app.get('/', (req, res) => {
  res.render('index');
});

// GET /login
app.get('/login', (req, res) => {
  if (!req.user) {
    res.render('user/login');
  } else {
    res.redirect('back');
  }
});

// POST /login
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (info) {
      console.log(info);
      req.flash('error', info.message);
      res.redirect('back');
      return;
    }
    if (err) {
      console.log(err)
      req.flash('error', err.message);
      res.redirect('back');
      return;
    };
    if (!user) {
      req.flash('error', 'Email or password was incorrect');
      res.redirect('/login');
      return;
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/');
    });
  })(req, res, next);
});

// GET /logout
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Successfully logged out!');
  res.redirect('/');
});

// GET /signup
app.get('/signup', (req, res) => {
  if (!req.user) {
    res.render('user/signup');
  } else {
    req.flash('error', 'You cannot do this while logged in');
    res.redirect('back');
  }
});

// POST /signup
app.post('/signup', async (req, res) => {
  console.log('hi');
  try {
    const user = new User(req.body);
    await user.save();
    req.logIn(user, (err) => {
      res.redirect('/');
    }); 
  } catch (e) {
    console.log(e);
    req.flash('error', e.message);
    res.redirect('back');
  }
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app}