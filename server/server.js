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

const {User} = require('./models/user');
const {Team} = require('./models/team');
const {Member} = require('./models/member');

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

// GET /forgot
app.get('/forgot', (req, res) => {
  res.render('user/forgot');
});

// POST /forgot
app.post('/forgot', (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'app103061027@heroku.com',
          pass: 'escr2egr4574'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@trip-roster.ca',
        subject: 'Trip Roster Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

// GET /reset/:token
app.get('/reset/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('users/reset', {
      token: req.params.token
    });
  });
});

// POST /reset/:token
app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'app103061027@heroku.com',
          pass: 'escr2egr4574'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@trip-roster.ca',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

// GET /user/:id
app.get('/user/:id', async (req, res) => {
  try {
    var id = req.params.id;
    if(!ObjectID.isValid(id)) {throw new Error('Not a valid User ID');}
    var user = await User.findById(id);
    var teamArray = await Team.getAll();
    res.render('user/user', {user, teamArray});
  } catch (e) {
    console.log(e);
    req.flash('error', e.message);
    res.redirect('back');
  }
});

// GET /teams
app.get('/teams', async (req, res) => {
  try {
    var teamArray = await Team.getAll();
    var userArray = await User.getAll();
    res.render('team/teamIndex', {teamArray, userArray});
  } catch (e) {
    try {
      var userArray = await User.getAll();
      console.log(e);
      req.flash('error', e);
      res.render('team/teamIndex', {userArray});
    } catch (e) {
      console.log(e);
      req.flash('error', e);
      res.render('team/teamIndex');
    }
  }
});

// POST /team
app.post('/team', async (req, res) => {
  try {
    var team = new Team({
      name: req.body.name,
      age: req.body.age,
      league: req.body.league,
      managers: req.body.managers.split(',')
    });
    await team.save();
    for (var i in req.body.managers.split(',')) {
      var user = await User.findById(req.body.managers.split(',')[i]);
      await user.teams.push(team._id);
      await user.save();
    } 
    res.redirect('back');
  } catch (e) {
    console.log(e);
    req.flash('error', e);
    res.redirect('back');
  }
});

// GET /team/:id
app.get('/team/:id', async (req, res) => {
  try {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {throw new Error('Not a valid Team ID')}
    var team = await Team.findById(id);
    var userArray = await User.getAll();
    var array = await Member.getAll();
    var memberArray = [];
    for (var i in array) {
      if (array[i].teams.indexOf(team._id) != -1) {
        memberArray[i] = array[i];
      }
    }
    res.render('team/team', {team, userArray, memberArray});
  } catch (e) {
    console.log(e);
    try {
      var id = req.params.id;
      if (!ObjectID.isValid(id)) {throw new Error('Not a valid Team ID')}
      var team = await Team.findById(id);
      var userArray = await User.getAll();
      res.render('team/team', {team, userArray});
    } catch (e) {
      console.log(e);
      req.flash('error', e.message);
      res.redirect('back');
    }
  }
});

// GET /team/:id/update
app.post('/team/:id/update', async (req, res) => {
  try {
    if (req.body.managers != undefined && req.body.managers.length != 0) {
      req.body.managers = (req.body.managers.split(','));
    } else {
      req.body.managers = [];
    }
    var teamId = req.params.id;
    if (!ObjectID.isValid(teamId)) {throw new Error('Team ID is not valid');}
    var team = await Team.findOneAndUpdate({_id: teamId}, req.body, {new: true});
    res.redirect('back');
  } catch (e) {
    console.log(e);
    req.flash('error', e.message);
    res.redirect('back');
  } 
});

// POST /member
app.post('/member', async (req, res) => {
  try {
    if (req.body.player == 'on') {
      req.body.player = true;
    }
    if (req.body.relationships != undefined && req.body.relationships.length != 0) {
      req.body.relationships = (req.body.relationships.split(','));
    } else {
      req.body.relationships = [];
    }
    var member = new Member(req.body);
    await member.save();
    for (var i in req.body.relationships) {
      var tempMember = await Member.findById(req.body.relationships[i]);
      tempMember.relationships.push(member._id);
      await tempMember.save();
    }
    var team = await Team.findById(req.body.teams);
    team.members.push(member);
    await team.save();
    res.redirect('back');
  } catch (e) {
    console.log(e);
    req.flash('error', e.message);
    res.redirect('back');
  }
});

// POST /member/:id/update
app.post('/member/:id/update', async (req, res) => {
  try {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {throw new Error('Member ID is not valid');}
    var oldMember = await Member.findById(id);
    if (req.body.relationships != undefined && req.body.relationships.length != 0) {
      req.body.relationships = (req.body.relationships.split(','));
      if (req.body.relationships.includes(id)) {
        var index = req.body.relationships.indexOf(id);
        req.body.relationships.splice(index, 1);
      }
      for (var i in req.body.relationships) {
        // Add relationship to other member if it doesn't already exist
        var tempMember = await Member.findById(req.body.relationships[i]);
        if (tempMember.relationships.indexOf(oldMember._id) == -1) {
          tempMember.relationships.push(oldMember._id);
          await tempMember.save();
        }
      }
    } else {
      req.body.relationships = [];
    }
    oldMember.relationships.forEach(async (rel) => {
      if (!req.body.relationships.includes(rel.toString())) {
        var otherMember = await Member.findByIdAndUpdate(rel, {$pull: {relationships: oldMember._id}}, {new: true});
      }
    });
    if (req.body.player == 'on') {req.body.player = true;}
    var member = await Member.findOneAndUpdate({_id: id}, {$set: req.body}, {new: true});
    res.redirect('back');
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