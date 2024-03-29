require("./config/config");

const express = require("express");
const { mongoose } = require("./db/mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const { ObjectID } = require("mongodb");
const path = require("path");
const passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const async = require("async");
const flash = require("express-flash");
const moment = require("moment");
const Podcast = require("podcast");
const fs = require("fs");

const { User } = require("./models/user");
const { Team } = require("./models/team");
const { Member } = require("./models/member");
const { Trip } = require("./models/trip");
const { Association } = require("./models/association");

const port = process.env.PORT || 3000;
var app = express();
var sess = {
  secret: "its-a-very-secret-trip",
  cookie: {},
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
  }),
};

// Ensure requests use 'https'
if (process.env.NODE_ENV === "production") {
  app.use(function (req, res, next) {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(["https://", req.get("Host"), req.url].join(""));
    }
    return next();
  });
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    function (username, password, done) {
      User.findOne({ email: username }, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, { message: "Incorrect username." });
        user.comparePassword(password, function (err, isMatch) {
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password." });
          }
        });
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.set("views", `${__dirname}/views`);
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session(sess));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "../public")));
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.baseUrl = req.headers.host;
  res.locals.user = req.user;
  res.locals.query = req.query;
  next();
});
app.use(function (req, res, next) {
  if (req.method == "POST" && req.url == "/login") {
    if (req.body.remember) {
      req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
    } else {
      req.session.cookie.expires = false;
    }
  }
  next();
});

// Podcast RSS Feed
app.get("/podcast/feed", async (req, res) => {
  try {
    const feed = new Podcast({
      title: "From The Nish",
      description:
        "Curtis Colbary and Devin McArthur dive into the world of podcasting. From stories only heard in a small University town on the outskirts of the Canadian Maritimes, to discussions of Business, Technology and everything in between. Theses are the Stories from the Nish.",
      feed_url: "http://www.triproster.com/podcast/feed",
      site_url: "http://instagram.com/fromthenish",
      image_url: "http://www.triproster.com/podcast/img/thumbnail.jpg",
      // docs: 'http://example.com/rss/docs.html',
      // author: 'Devin McArthur & Curtis Colbary',
      // managingEditor: 'Curtis Colbary',
      // webMaster: 'Devin McArthur',
      copyright: "From The Nish 2018",
      language: "en",
      categories: [
        "Conversation",
        "University",
        "Business",
        "Tech",
        "Technology",
        "Society & Culture",
        "Entrepreneur",
      ],
      pubDate: "Nov 4, 2018 2:00:00 GMT",
      ttl: "60",
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Curtis Colbary and Devin McArthur dive into the world of podcasting. From stories only heard in a small University town on the outskirts of the Canadian Maritimes, to discussions of Business, Technology and everything in between. Theses are the Stories from the Nish.",
      itunesOwner: { name: "Curtis Colbary", email: "colbary88@gmail.com" },
      itunesExplicit: true,
      itunesCategory: {
        text: "Society & Culture",
        subcats: [
          {
            text: "Personal Journals",
          },
        ],
      },
      itunesImage: "http://www.triproster.com/podcast/img/thumbnail.jpg",
    });

    /* loop over data and add to feed */
    // Add Introduction Podcast
    feed.addItem({
      title: "000 // Introduction",
      description:
        "Curtis Colbary and Devin McArthur introduce themselves into the world of podcasting. What is this podcast? Who are we? Why are we doing this? The answers to these questions and more can be found in this Introductory Podcast" +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url: "http://www.triproster.com/podcast/Introduction.mp3", // link to the item
      guid:
        "The only audio at http://www.triproster.com/podcast/Introduction.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Business", "Tech"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: new Date("Nov 5, 2018"), // any format that js Date can parse.
      date: new Date("Nov 5, 2018"), // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url: "http://www.triproster.com/podcast/Introduction.mp3",
        file: __dirname + "/podcasts/Introduction.mp3",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: false,
      itunesSubtitle: "Conversations, stories, and opinions from the Nish",
      itunesSummary:
        "Curtis Colbary and Devin McArthur introduce themselves into the world of podcasting. What is this podcast? Who are we? Why are we doing this? The answers to these questions and more can be found in this Introductory Podcast",
      itunesDuration: 661,
      itunesKeywords: [
        "business",
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "introduction",
        "entrepreneurship",
      ],
    });

    // Add First Conversation Podcast
    feed.addItem({
      title: "001 // Conversation: First",
      description:
        "What is this podcast? Who are we? Why are we still doing this? Well... we still don't know, but here we are again talking about some stuff." +
        "Tonights primary topic of choice, was education and its different styles inlcuding an open ended conversation about the liberal and technical domains of the education system." +
        "And we may have talked about who our first guest could be." +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+1.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+1.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Business", "Tech"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: new Date("Nov 7, 2018"), // any format that js Date can parse.
      date: new Date("Nov 7, 2018"), // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+1.mp3",
        size: "215142742",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "What is this podcast? Who are we? Why are we still doing this? Well... we still don't know, but here we are again talking about some stuff. " +
        "Tonights primary topic of choice, was education and its different styles including an open ended conversation about the liberal and technical domains of the education system. " +
        "And we may have talked about who our first guest could be.",
      itunesDuration: 6723,
      itunesKeywords: [
        "business",
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
      ],
    });

    // Add First Conversation Podcast
    feed.addItem({
      title: "002 // Guest: Brandon Hope",
      description:
        "Today we interviewed our first guest on From the Nish, Brandon Hope <a href='http://www.instagram.com/brandonhope/'>(@brandonhope)</a>, a former X-Men goalie on a championship contending team, and St.FX accounting student. Brandon talks about his experience transitioning from goalie to working professional, his experience running a business, and his general life philosphy, wrapped up with some great stories from the nish." +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest001.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest001.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Business", "Tech"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: new Date("Nov 10, 2018"), // any format that js Date can parse.
      date: new Date("Nov 10, 2018"), // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest001.mp3",
        size: "123694941",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Today we interviewed our first guest on From the Nish, Brandon Hope, a former X-Men goalie on a championship contending team, and St.FX accounting student. Brandon talks about his experience transitioning from goalie to working professional, his experience running a business, and his general life philosphy, wrapped up with some great stories from the nish.",
      itunesDuration: 3865,
      itunesKeywords: [
        "business",
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
        "hockey",
      ],
    });

    // Add Second Guest Podcast: Ty & Ras
    feed.addItem({
      title: "003 // Guest: Ty Allen & Brendan Laframboise",
      description:
        "Today we talk to Ty Allen <a href='http://www.instagram.com/tallen1389/'>(@tallen1389)</a> & Brendan Laframboise <a href='http://www.instagram.com/brendanlaframboise/'>(@brendanlaframboise)</a> about life in Toronto and Gatineau (Buckingham), their experiences at St.FX, the tales of playing XHL hockey, all brought together with some juicy stories from the Nish." +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest002.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest002.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Business", "Tech"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Nov 15, 2018", // any format that js Date can parse.
      date: "Nov 15, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest002.mp3",
        size: "211766468",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Today we talk to Ty Allen & Brendan Laframboise about life in Toronto and Gatineau (Buckingham), their experiences at St.FX, the tales of playing XHL hockey, all brought together with some juicy stories from the Nish.",
      itunesDuration: 6619,
      itunesKeywords: [
        "business",
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
        "hockey",
      ],
    });

    // Add Third Guest Podcast: Sean Brophy
    feed.addItem({
      title: "004 // Guest: Sean Brophy",
      description:
        "Tonight we had a conversation with Sean Brophy <a href='http://www.instagram.com/seancbrophy/'>(@seancbrophy)</a>, a father, retired paramadic, radio personality, former race car driver, and talented Tattoo artist working out of Antigonish." +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest003.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest003.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Business", "Tech"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Nov 17, 2018", // any format that js Date can parse.
      date: "Nov 17, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest003.mp3",
        size: "217852790",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we had a conversation with Sean Brophy, a father, retired paramadic, radio personality, former race car driver, and talented Tattoo artist working out of Antigonish.",
      itunesDuration: 6780 + 27,
      itunesKeywords: [
        "nish",
        "tattoo",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
      ],
    });

    // Add Fourth Guest Podcast: Nic Latulippe
    feed.addItem({
      title: "005 // Guest: Nic Latulippe",
      description:
        "Today we talked with <b>Nic Latulippe</b> <a href='http://www.instagram.com/nic_latulippe/'>(@nic_latulippe)</a>, a third year Philosophy student and photographer here at St.FX. We start this conversation with a dive into our collective love of St.FX culture and our opinions on the current state of this culture. Nic also gets into his love and experience with photography and his philosophy on creative expression, as well as his experience being involved in the New York Model UN event last year. We finish the conversation off - big surprise - with a classic story from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest004.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest004.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Business",
        "Tech",
        "Photography",
        "Art",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Nov 20, 2018", // any format that js Date can parse.
      date: "Nov 20, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest004.mp3",
        size: "134680581",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Today we talked with <b>Nic Latulippe</b> <a href='http://www.instagram.com/nic_latulippe/'>(@nic_latulippe)</a>, a third year Philosophy student and photographer here at St.FX. We start this conversation with a dive into our collective love of St.FX culture and our opinions on the current state of this culture. Nic also gets into his love and experience with photography and his philosophy on creative expression, as well as his experience being involved in the New York Model UN event last year. We finish the conversation off - big surprise - with a classic story from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: 4200 + 10,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
        "photography",
        "art",
        "artist",
        "un",
      ],
    });

    // Add Fifth Guest Podcast: Nathan Pancel & Marcus Cuomo
    feed.addItem({
      title: "006 // Guest: Nathan Pancel & Marcus Cuomo",
      description:
        "Tonight we talked with <b>Nathan Pancel</b> <a href='http://www.instagram.com/nathanpancel/'>(@nathanpancel)</a> and <b>Marcus Cuomo</b> <a href='http://www.instagram.com/cuomo61/'>(@cuomo61)</a>, who have both been members of the X-Men hockey team here at St.FX. This entertaining conversation covers a wide range of topics: including their time playing Junior hockey, Cuomo 2020 (a promising campaign for student office), the underground market of super-sub tickets, finished off with some hilarious stories from the nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>" +
        "<p><b>Link from tonights podcast:</b></p><a href='http//www.youtube.com/watch?v=0bnpNF32Zm4'> Pancel Trade Interview</a>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest005.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest005.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Business",
        "Tech",
        "Hockey",
        "Athletics",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Nov 22, 2018", // any format that js Date can parse.
      date: "Nov 22, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest005.mp3",
        size: "216188476",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we talked with <b>Nathan Pancel</b> <a href='http://www.instagram.com/nathanpancel/'>(@nathanpancel)</a> and <b>Marcus Cuomo</b> <a href='http://www.instagram.com/cuomo61/'>(@cuomo61)</a>, who have both been members of the X-Men hockey team here at St.FX. This entertaining conversation covers a wide range of topics: including their time playing Junior hockey, Cuomo 2020 (a promising campaign for student office), the underground market of super-sub tickets, finished off with some hilarious stories from the nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>" +
        "<p><b>Link from tonights podcast:</b></p><a href='http//www.youtube.com/watch?v=0bnpNF32Zm4'> Pancel Trade Interview</a>",
      itunesDuration: 6720 + 35,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "entrepreneurship",
        "university",
        "hockey",
        "athletics",
        "entertainment",
      ],
    });

    // Add Sixth Guest Podcast Seventh Episode: Michael Near & Jamison Sampson
    feed.addItem({
      title: "007 // Guest: Michael Near & Jamison Sampson",
      description:
        "Tonight we talked with <b>Michael Near</b> <a href='http://www.instagram.com/michaelnear/'>(@michaelnear)</a> and <b>Jamison Sampson</b> <a href='http://www.instagram.com/jamisonsampson/'>(@jamisonsampson)</a>, two St.FX veterans. We chatted with them about X sports, school life, and the journey of our years at the school, all wrapped up with some unique party stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest006.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest006.mp3", // optional - defaults to url
      categories: ["Conversation", "University", "Hockey", "Culture"], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Nov 27, 2018", // any format that js Date can parse.
      date: "Nov 27, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest006.mp3",
        size: "160597395",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we talked with <b>Michael Near</b> <a href='http://www.instagram.com/michaelnear/'>(@michaelnear)</a> and <b>Jamison Sampson</b> <a href='http://www.instagram.com/jamisonsampson/'>(@jamisonsampson)</a>, two X veterans. We talked with them about St.FX sports, school life, the journey of our years at the school, all wrapped up with some unique party stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (60 + 23) * 60 + 38,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "hockey",
        "athletics",
        "culture",
      ],
    });

    // Add Seventh Guest Podcast Eighth Episode: Emma Logan
    feed.addItem({
      title: "008 // Guest: Emma Logan",
      description:
        "Tonight we talked with <b>Emma Logan</b> <a href='http://www.instagram.com/emmaalogan/'>(@emmaalogan)</a>, a 4th year St.FX student and brain child behind Hearing For All. Hearing For All is a non-profit organization with the goal of collecting used hearing aids and distributing them to those in need. On top of this, we chatted about her experience with hearing loss, and how it has influenced her life. </br> If you wish to hear more about her endeavour all links to Emmas projects can be found bellow: " +
        "<ul><li><a href='http://www.hearingforall.ca/'>Website (hearingforall.ca) </a></li><li><a href='http://www.facebook.com/Hearing-for-All-258279188199608/'>Facebook ()</a></li></ul>" +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest007.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest007.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Hearing",
        "Culture",
        "Hearing Aids",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Dec 7, 2018", // any format that js Date can parse.
      date: "Dec 7, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest007.mp3",
        size: "147092297",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we talked with <b>Emma Logan</b> <a href='http://www.instagram.com/emmaalogan/'>(@emmaalogan)</a>, a 4th year St.FX student and brain child behind Hearing For All. Hearing For All is a non-profit organization with the goal of collecting used hearing aids and distributing them to those in need. On top of this, we chatted about her experience with hearing loss, and how it has influenced her life. </br> If you wish to hear more about her endeavour all links to Emmas projects can be found bellow: " +
        "<ul><li><a href='http://www.hearingforall.ca/'>Website</a></li><li><a href='http://www.facebook.com/Hearing-for-All-258279188199608/'>Facebook (bit.ly/2zNalbt) </a></li></ul>" +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (60 + 16) * 60 + 36,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "hearingaids",
        "hearing",
      ],
    });

    // Add Eighth Guest Podcast Ninth Episode: Delia Boulton & Jill Clarke
    feed.addItem({
      title: "009 // Guest: Delia Boulton & Jill Clarke",
      description:
        "Tonight we talked with <b>Delia Boulton</b> <a href='http://www.instagram.com/deliaboulton/'>(@deliaboulton)</a> & <b>Jill Clarke</b>, two 4th year St.FX Nursing students. We talked with them about their experience in the St.FX nursing program and their thoughts on the demanding schedules that come with Nursing. On top of this, we of course chatted about our time at St.FX, as well as nutrition, relationships, training, and the management of a work-life balance, all topped off with some great stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest008.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest008.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Nursing",
        "Culture",
        "Medical",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Dec 8, 2018", // any format that js Date can parse.
      date: "Dec 8, 2018", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest008.mp3",
        size: "248145636",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we talked with <b>Delia Boulton</b> <a href='http://www.instagram.com/deliaboulton/'>(@deliaboulton)</a> & <b>Jill Clarke</b>, two 4th year St.FX Nursing students. We talked with them about their experience in the St.FX nursing program and their thoughts on the demanding schedules that come with Nursing. On top of this, we of course chatted about our time at St.FX, as well as nutrition, relationships, training, and the management of a work-life balance, all topped off with some great stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (2 * 60 + 9) * 60 + 14,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "nursing",
        "medical",
        "hospital",
      ],
    });

    // Add Ninth Guest Podcast Tenth Episode: Dylan Thompson-Mackay
    feed.addItem({
      title: "010 // Guest: Dylan Thompson-Mackay",
      description:
        "Today we had the pleasure of talking with <b>Dylan Thompson-Mackay</b> <a href='http://www.instagram.com/dylanthompsonmackay/'>(@dylanthompsonmackay)</a> owner of Elwood Pens <a href='http://www.instagram.com/elwoodpens/'>(@elwoodpens)</a>. We got to chat with Dylan about his life story, how he came to get involved in the business of making handcrafted wooden pens, as well as his vision for the future. Elwood Pens is located on Argyle street in Halifax, you can check out his products on his Instagram page, and on his website (once is it up and running again) at elwoodpens.ca. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest009.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest009.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Handcrafted",
        "Artisan",
        "Business",
        "Pens",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Jan 11, 2019", // any format that js Date can parse.
      date: "Jan 11, 2019", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest009.mp3",
        size: "227702000",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Today we had the pleasure of talking with <b>Dylan Thompson-Mackay</b> <a href='http://www.instagram.com/dylanthompsonmackay/'>(@dylanthompsonmackay)</a> owner of Elwood Pens <a href='http://www.instagram.com/elwoodpens/'>(@elwoodpens)</a>. We got to chat with Dylan about his life story, how he came to get involved in the business of making handcrafted wooden pens, as well as his vision for the future. Elwood Pens is located on Argyle street in Halifax, you can check out his products on his Instagram page, and on his website (once is it up and running again) at elwoodpens.ca. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (2 * 60 + 1) * 60 + 26,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "handcrafted",
        "elwood",
        "pens",
      ],
    });

    // Add Second Conversation Podcast Eleventh Episode
    feed.addItem({
      title: "011 // Conversation: 2",
      description:
        "Tonight Curtis and I are back with our second Conversation podcast, and it has obviously been a while as we only had a single mic recoring the whole time... whoops. Nonetheless, we got a chance to chat about our time getting our X-Rings last semester, our plans with this upcoming semester in regards to the podcast, and finally got a chance to go on a tangent about Social Media and the effects that these platforms have on people generally and on society as a whole. Really enjoyed this conversation and I hope you enjoy! " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+2.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+2.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Social Media",
        "Marketing",
        "Politics",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Jan 22, 2019", // any format that js Date can parse.
      date: "Jan 22, 2019", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Conversation+2.mp3",
        size: "181200000",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight Curtis and I are back with our second Conversation podcast, and it has obviously been a while as we only had a single mic recoring the whole time... whoops. Nonetheless, we got a chance to chat about our time getting our X-Rings last semester, our plans with this upcoming semester in regards to the podcast, and finally got a chance to go on a tangent about Social Media and the effects that these platforms have on people generally and on society as a whole. Really enjoyed this conversation and I hope you enjoy! " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (1 * 60 + 38) * 60 + 58,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "socialmedia",
        "marketing",
        "politics",
      ],
    });

    // Add Tenth Guest: Sean Hopkins and Jack Johnson
    feed.addItem({
      title: "012 // Guest: Sean Hopkins & Jack Johnson",
      description:
        "Tonight we talked with <b>Sean Hopkins</b> <a href='http://www.instagram.com/sean_hopkins/'>(@sean_hopkins)</a> and <b>Jack Johnson</b> <a href='http://www.instagram.com/jjohnson.93/'>(@jjohnson.93)</a>, two St.FX vets who are heavily involved in the X bar and event scene. We talk with Jack and Sean about their roles here at X, as Golden X Inn Manager and VP of Events and Activities respectively. We also get the chance to chat with them about their time here at X, play some Valley vs City, and all topped off with some unique stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest010.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest010.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Social Media",
        "Marketing",
        "Music",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Feb 6, 2019", // any format that js Date can parse.
      date: "Feb 6, 2019", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest010.mp3",
        size: "182100000",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we talked with <b>Sean Hopkins</b> <a href='http://www.instagram.com/sean_hopkins/'>(@sean_hopkins)</a> and <b>Jack Johnson</b> <a href='http://www.instagram.com/jjohnson.93/'>(@jjohnson.93)</a>, two St.FX vets who are heavily involved in the X bar and event scene. We talk with Jack and Sean about their roles here at X, as Golden X Inn Manager and VP of Events and Activities respectively. We also get the chance to chat with them about their time here at X, play some Valley vs City, and all topped off with some unique stories from the Nish. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (1 * 60 + 39) * 60 + 28,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "socialmedia",
        "marketing",
        "music",
        "bar",
      ],
    });

    // Add Eleventh Guest: Cecil VanBuskirk
    feed.addItem({
      title: "013 // Guest: Cecil VanBuskirk",
      description:
        "We have a treat for all St.FX students in tonights podcast as we have the pleasure of chatting with the beautiful <b>Cecil VanBuskirk</b> <a href='http://www.instagram.com/cecilvanbuskirk/'>(@cecilvanbuskirk)</a>, our recently elected future President of the Students Union. We chatted with Cecil about a wide range of topics - including his background before St.FX, his experience in the campaign, and our amazing community here at St.FX. Finally we picked Cecils brain about his platform, and the improvements that he is aiming to make while running the Student Union, be sure to tune in to hear what's in store for the 2019-2020 year at St.FX. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest011.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest011.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Social Media",
        "Marketing",
        "Politics",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Feb 26, 2019", // any format that js Date can parse.
      date: "Feb 26, 2019", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest011.mp3",
        size: "158000000",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "We have a treat for all St.FX students in tonights podcast as we have the pleasure of chatting with the beautiful <b>Cecil VanBuskirk</b> <a href='http://www.instagram.com/cecilvanbuskirk/'>(@cecilvanbuskirk)</a>, our recently elected future President of the Students Union. We chatted with Cecil about a wide range of topics - including his background before St.FX, his experience in the campaign, and our amazing community here at St.FX. Finally we picked Cecils brain about his platform, and the improvements that he is aiming to make while running the Student Union, be sure to tune in to hear what's in store for the 2019-2020 year at St.FX. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (1 * 60 + 26) * 60 + 16,
      itunesKeywords: [
        "nish",
        "antigonish",
        "stories",
        "from",
        "podcast",
        "university",
        "socialmedia",
        "marketing",
        "politics",
        "progressive",
      ],
    });

    // Add Twelfth Guest: Cole McIsaac
    feed.addItem({
      title: "014 // Guest: Cole McIsaac",
      description:
        "Tonight we chatted with <b>Cole McIsaac</b> <a href='http://www.instagram.com/cole_mcisaac/'>(@cole_mcisaac)</a>, Inn Bartender, movie buff, and an all around great dude. Cole talked about the story of how he came to St.FX, his time in MacIsaac hall, and a harrowing story of why you shouldn't slip on ice. Was a great conversation about nothing in particular. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      url:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest012.mp3", // link to the item
      guid:
        "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest012.mp3", // optional - defaults to url
      categories: [
        "Conversation",
        "University",
        "Social Media",
        "Marketing",
        "Politics",
      ], // optional - array of item categories
      author: "Devin McArthur & Curtis Colbary", // optional - defaults to feed author property
      pubDate: "Mar 6, 2019", // any format that js Date can parse.
      date: "Mar 6, 2019", // any format that js Date can parse.
      lat: 45.622459, //optional latitude field for GeoRSS
      long: -61.991421, //optional longitude field for GeoRSS
      enclosure: {
        url:
          "http://s3.us-east-2.amazonaws.com/from-the-nish-podcast-episodes/Guest012.mp3",
        size: "154900000",
        type: "audio/mpeg",
      }, // optional enclosure
      itunesAuthor: "Devin McArthur & Curtis Colbary",
      itunesExplicit: true,
      itunesSubtitle: "Stories From The Nish",
      itunesSummary:
        "Tonight we chatted with <b>Cole McIsaac</b> <a href='http://www.instagram.com/cole_mcisaac/'>(@cole_mcisaac)</a>, Inn Bartender, movie buff, and an all around great dude. Cole talked about the story of how he came to St.FX, his time in MacIsaac hall, and a harrowing story of why you shouldn't slip on ice. Was a great conversation about nothing in particular. " +
        "<p>Follow <b>From The Nish</b> on Instagram <a href='http://www.instagram.com/fromthenish/'>@fromthenish</a>. </p>" +
        "<p>Hosted by: <a href='http://www.instagram.com/devin_mcarthur/'>@devin_mcarthur</a> & <a href='http://www.instagram.com/curtiscolbary/'>@curtiscolbary </a></p>",
      itunesDuration: (1 * 60 + 24) * 60 + 35,
      itunesKeywords: [
        "from",
        "the",
        "nish",
        "antigonish",
        "stories",
        "podcast",
        "university",
        "socialmedia",
        "marketing",
        "politics",
        "winter",
      ],
    });

    // cache the xml to send to clients
    const xml = feed.buildXml();

    fs.writeFile(__dirname + "/podcasts/feed.xml", xml, function (err) {
      err && console.log(err);
    });

    var options = {
      root: __dirname + "/podcasts/",
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };

    var fileName = "feed.xml";

    res.set("Content-Type", "text/xml");
    res.end(xml);
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("/");
  }
});

app.get("/podcast/:name", async (req, res) => {
  try {
    var options = {
      root: __dirname + "/podcasts/",
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };

    var fileName = req.params.name;
    res.set("Content-Type", "audio/mpeg");
    res.sendFile(fileName, options, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Sent:", fileName);
      }
    });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("/");
  }
});

app.get("/podcast/img/thumbnail.jpg", async (req, res) => {
  try {
    var options = {
      root: __dirname + "/podcasts/",
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };

    var fileName = "thumbnail.jpg";
    res.sendFile(fileName, options, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Sent:", fileName);
      }
    });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("/");
  }
});

app.get("/olttpusadt-1", async (req, res) => {
  res.sendFile(path.join(__dirname, "./images/olttpusadt-1.jpg"));
});

app.get("/olttpusadt-2", async (req, res) => {
  res.sendFile(path.join(__dirname, "./images/olttpusadt-2.jpg"));
});

app.get("/olttpusadt-3", async (req, res) => {
  res.sendFile(path.join(__dirname, "./images/olttpusadt-3.jpg"));
});

app.get("/olttpusadt-4", async (req, res) => {
  res.sendFile(path.join(__dirname, "./images/olttpusadt-4.jpg"));
});

// GET root
app.get("/", async (req, res) => {
  try {
    if (req.user) {
      var teamArray = [];
      var fullTeamArray = await Team.getAll();
      var tripArray = await Trip.getAll();
      var associationArray = await Association.getAll();
      var array = [];
      if (req.user.admin == true) {
        for (var i in tripArray) {
          if (!tripArray[i].stringifiedDate) {
            await Trip.findByIdAndUpdate(
              tripArray[i]._id,
              {
                $set: {
                  stringifiedDate: moment(tripArray[i].date).format("LLL"),
                },
              },
              { new: true }
            );
          }
          if (
            Math.abs(moment(tripArray[i].date).diff(moment(), "days") < 7) &&
            moment(tripArray[i].date).diff(moment(), "days") > -1
          ) {
            array[i] = tripArray[i];
          }
        }
        tripArray = array;
        res.render("index", {
          teamArray: fullTeamArray,
          tripArray,
          associationArray,
        });
      } else if (req.user.director) {
        var currentTripArray = [];
        for (var i in fullTeamArray) {
          if (
            fullTeamArray[i].association &&
            fullTeamArray[i].association.equals(req.user.director)
          ) {
            array[i] = fullTeamArray[i];
          }
        }
        teamArray = array;
        array = [];
        if (Object.keys(teamArray).length > 0) {
          for (var i in tripArray) {
            if (!tripArray[i].stringifiedDate) {
              await Trip.findByIdAndUpdate(
                tripArray[i]._id,
                {
                  $set: {
                    stringifiedDate: moment(tripArray[i].date).format("LLL"),
                  },
                },
                { new: true }
              );
            }
            if (
              fullTeamArray[tripArray[i].team].association &&
              fullTeamArray[tripArray[i].team].association ==
                `${req.user.director}` &&
              Math.abs(moment(tripArray[i].date).diff(moment(), "days") < 7) &&
              moment(tripArray[i].date).diff(moment(), "days") > -1
            ) {
              array[i] = tripArray[i];
            }
            if (
              !tripArray[i].homeArrivalTime &&
              Math.abs(moment(tripArray[i].date).diff(moment(), "days") < 1) &&
              moment(tripArray[i].date).diff(moment(), "days") > -1
            ) {
              currentTripArray[i] = array[i];
            }
          }
          tripArray = array;
        } else {
          tripArray = [];
        }
        res.render("index", {
          teamArray,
          tripArray,
          currentTripArray,
          associationArray,
        });
      } else {
        var currentTripArray = [];
        for (var i in fullTeamArray) {
          if (
            fullTeamArray[i].managers &&
            fullTeamArray[i].managers.toString().includes(req.user._id)
          ) {
            array[i] = fullTeamArray[i];
          }
        }
        teamArray = array;
        array = [];
        if (Object.keys(teamArray).length > 0) {
          for (var i in tripArray) {
            if (!tripArray[i].stringifiedDate) {
              await Trip.findByIdAndUpdate(
                tripArray[i]._id,
                {
                  $set: {
                    stringifiedDate: moment(tripArray[i].date).format("LLL"),
                  },
                },
                { new: true }
              );
            }
            if (
              Math.abs(moment(tripArray[i].date).diff(moment(), "days") < 7) &&
              moment(tripArray[i].date).diff(moment(), "days") > -1 &&
              Object.keys(teamArray).indexOf(tripArray[i].team.toString()) != -1
            ) {
              array[i] = tripArray[i];
            }
            if (
              !tripArray[i].homeArrivalTime &&
              Math.abs(moment(tripArray[i].date).diff(moment(), "days") < 1) &&
              moment(tripArray[i].date).diff(moment(), "days") > -1 &&
              teamArray[tripArray[i].team] &&
              teamArray[tripArray[i].team].managers.indexOf(req.user._id) !==
                -1 &&
              ((tripArray[i].members && tripArray[i].members.length > 0) ||
                tripArray[i].homeDepartTime ||
                tripArray[i].destinationArrivalTime ||
                tripArray[i].destinationDepartTime)
            ) {
              currentTripArray[i] = tripArray[i];
            }
          }
          tripArray = array;
        } else {
          tripArray = [];
        }
        res.render("index", {
          teamArray,
          tripArray,
          currentTripArray,
          associationArray,
        });
      }
    } else {
      res.render("index");
    }
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("/");
  }
});

// GET /login
app.get("/login", (req, res) => {
  if (!req.user) {
    res.render("user/login");
  } else {
    res.redirect("back");
  }
});

// POST /login
app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (info) {
      console.log(info);
      req.flash("error", info.message);
      res.redirect("back");
      return;
    }
    if (err) {
      console.log(err);
      req.flash("error", err.message);
      res.redirect("back");
      return;
    }
    if (!user) {
      req.flash("error", "Email or password was incorrect");
      res.redirect("/login");
      return;
    }
    req.logIn(user, function (err) {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});

// GET /logout
app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Successfully logged out!");
  res.redirect("/");
});

// GET /signup
app.get("/signup", async (req, res) => {
  try {
    if (!req.user) {
      var associationArray = await Association.getAll();
      res.render("user/signup", { associationArray });
    } else {
      req.flash("error", "You cannot do this while logged in");
      res.redirect("back");
    }
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /signup
app.post("/signup", async (req, res) => {
  try {
    if (req.body.association == "") {
      req.body.association = null;
    }
    const user = new User(req.body);
    await user.save();
    if (!req.user) {
      req.logIn(user, (err) => {
        res.redirect("/");
      });
    } else {
      // Allows team account creation
      res.redirect("back");
    }
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /forgot
app.get("/forgot", (req, res) => {
  res.render("user/forgot");
});

// POST /forgot
app.post("/forgot", (req, res, next) => {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "triproster@gmail.com",
            pass: process.env.GMAIL_PASSWORD,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "Devin at Trip Roster <triproster@gmail.com>",
          subject: "Trip Roster Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash(
            "info",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
    }
  );
});

// GET /reset/:token
app.get("/reset/:token", (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot");
      }
      res.render("user/reset", {
        token: req.params.token,
      });
    }
  );
});

// POST /reset/:token
app.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "triproster@gmail.com",
            pass: process.env.GMAIL_PASSWORD,
          },
        });
        var mailOptions = {
          to: user.email,
          from: "Devin at Trip Roster <triproster@gmmail.com>",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("info", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/");
    }
  );
});

// GET /users
app.get("/users", async (req, res) => {
  try {
    var userArray = await User.getAll();
    var teamArray = await Team.getAll();
    var associationArray = await Association.getAll();
    res.render("user/userIndex", { userArray, teamArray, associationArray });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /user/:id
app.get("/user/:id", async (req, res) => {
  try {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
      throw new Error("Not a valid User ID");
    }
    var user = await User.findById(id);
    var teamArray = await Team.getAll();
    var associationArray = await Association.getAll();
    if (user.director) {
      var director = await Association.findById(user.director);
      res.render("user/user", { user, teamArray, director, associationArray });
      return;
    }
    res.render("user/user", { user, teamArray, associationArray });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /user/:id/update
app.post("/user/:id/update", async (req, res) => {
  try {
    var userId = req.params.id;
    if (!ObjectID.isValid(userId)) {
      throw new Error("User ID is not valid");
    }
    if (req.body.association == "") {
      req.body.association = null;
    }
    if (req.body.password || req.body.email) {
      User.findById(userId, (err, user) => {
        if (!user) {
          req.flash("error", "There was an error in updating this account.");
          return res.redirect("back");
        }
        if (req.body.password) {
          user.password = req.body.password;
        }
        if (req.body.email && req.body.email != user.email) {
          user.email = req.body.email;
        }
        user.save();
      });
      return res.redirect("back");
    }
    await User.findOneAndUpdate({ _id: userId }, req.body, { new: true });
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /user
app.post("/user", async (req, res) => {
  try {
    if (req.body.association == "") {
      req.body.association = null;
      req.flash(
        "info",
        "You have created an account without linking to an association, you can link later by going to your User page"
      );
    }
    const user = new User(req.body);
    await user.save();
    if (typeof req.body.teams != "object") {
      var team = await Team.findById(req.body.teams);
      if (team.managers) {
        await Team.findByIdAndUpdate(
          req.body.teams,
          { $push: { managers: user._id } },
          { new: true }
        );
      } else {
        team.managers = new Array(user._id);
      }
    }
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /teams
app.get("/teams", async (req, res) => {
  try {
    var teamArray = await Team.getAll();
    var userArray = await User.getAll();
    var associationArray = await Association.getAll();
    var array = [];
    if (!req.user) {
      res.redirect("/login");
    }
    if (req.user.admin == true) {
      res.render("team/teamIndex", { teamArray, userArray, associationArray });
    } else if (req.user.director) {
      for (var i in teamArray) {
        if (
          teamArray[i].association &&
          teamArray[i].association.equals(req.user.director)
        ) {
          array[i] = teamArray[i];
        }
      }
      res.render("team/teamIndex", {
        teamArray: array,
        userArray,
        associationArray,
      });
    } else {
      for (var i in teamArray) {
        if (teamArray[i].managers.toString().includes(req.user._id)) {
          array[i] = teamArray[i];
        }
      }
      res.render("team/teamIndex", {
        teamArray: array,
        userArray,
        associationArray,
      });
    }
  } catch (e) {
    try {
      var userArray = await User.getAll();
      var associationArray = await Association.getAll();
      console.log(e);
      req.flash("error", e);
      res.render("team/teamIndex", { userArray, associationArray });
    } catch (e) {
      console.log(e);
      req.flash("error", e);
      res.render("team/teamIndex");
    }
  }
});

// POST /team
app.post("/team", async (req, res) => {
  try {
    var managers;
    if (req.body.managers == "") {
      managers = null;
    } else {
      managers = req.body.managers.split(",");
    }
    var team = new Team({
      name: req.body.name,
      age: req.body.age,
      league: req.body.league,
      association: req.body.association,
      busCompany: req.body.busCompany,
      managers,
    });
    team = await team.save();
    if (team.association) {
      await Association.findByIdAndUpdate(
        team.association,
        { $push: { teams: team._id } },
        { new: true }
      );
    }
    if (managers) {
      for (var i in managers) {
        var user = await User.findById(managers[i]);
        await user.teams.push(team._id);
        await user.save();
      }
    }
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /team/:id
app.delete("/team/:id", async (req, res) => {
  try {
    var team = await Team.findByIdAndRemove(req.params.id);
    if (team.members) {
      team.members.forEach(async (member) => {
        await Member.findByIdAndUpdate(
          member,
          { $pull: { teams: team._id } },
          { new: true }
        );
      });
    }
    if (team.managers) {
      team.managers.forEach(async (manager) => {
        await User.findByIdAndUpdate(
          manager,
          { $pull: { teams: team._id } },
          { new: true }
        );
      });
    }
    if (team.association) {
      await Association.findByIdAndUpdate(
        team.association,
        { $pull: { teams: team._id } },
        { new: true }
      );
    }
    if (team.trips.length > 0) {
      team.trips.forEach(async (trip) => {
        await Trip.findByIdAndRemove(trip);
      });
    }
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /team/:id
app.get("/team/:id", async (req, res) => {
  try {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
      throw new Error("Not a valid Team ID");
    }
    var team = await Team.findById(id);
    var teamArray = await Team.getAll();
    var userArray = await User.getAll();
    var array = await Member.getAll();
    var tripArray = await Trip.getAll();
    var associationArray = await Association.getAll();
    var memberArray = [],
      associationMembers = [];
    // Find Team Account
    var teamAccount = await User.findOne({ name: `${team.name} Account` });
    var index = 0;
    for (var i in array) {
      if (array[i].teams.indexOf(team._id) != -1) {
        memberArray[i] = array[i];
      }
      if (team.association) {
        array[i].teams.forEach((t) => {
          if (
            teamArray[t].association.equals(team.association) &&
            team.members.indexOf(i.toString()) == -1
          ) {
            associationMembers[index] = array[i];
            index++;
          }
        });
      }
    }
    var inputDateArray = [];
    team.trips.forEach((trip) => {
      if (tripArray[trip]) {
        inputDateArray[trip] = moment(tripArray[trip].date)
          .add(1, "days")
          .format("YYYY-MM-DD");
      }
    });
    res.render("team/team", {
      team,
      userArray,
      memberArray,
      tripArray,
      associationArray,
      inputDateArray,
      teamAccount,
      associationMembers,
    });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /team/:id/update
app.post("/team/:id/update", async (req, res) => {
  try {
    var team = await Team.findById(req.params.id);
    if (req.body.association == "") {
      req.body.association = null;
      if (team.association) {
        await Association.findByIdAndUpdate(
          team.association,
          { $pull: { teams: team._id } },
          { new: true }
        );
      }
    } else {
      await Association.findByIdAndUpdate(
        req.body.association,
        { $push: { teams: team._id } },
        { new: true }
      );
      if (team.association) {
        await Association.findByIdAndUpdate(
          team.association,
          { $pull: { teams: team._id } },
          { new: true }
        );
      }
    }
    if (req.body.busCompanies && !req.body.prevCompanyName) {
      team.busCompanies.push(req.body.busCompanies);
      req.body.busCompanies = team.busCompanies;
    }
    if (req.body.busCompanies && req.body.prevCompanyName) {
      team = await Team.findByIdAndUpdate(
        team._id,
        { $pull: { busCompanies: req.body.prevCompanyName } },
        { new: true }
      );
      team.busCompanies.push(req.body.busCompanies);
      req.body.busCompanies = team.busCompanies;
    }
    if (typeof req.body.managers != "undefined") {
      if (req.body.managers != undefined && req.body.managers.length != 0) {
        req.body.managers = req.body.managers.split(",");
      } else {
        req.body.managers = [];
      }
      team.managers.forEach(async (i) => {
        // Remove team from User model
        if (!req.body.managers.toString().includes(i)) {
          await User.findByIdAndUpdate(
            i,
            { $pull: { teams: team._id } },
            { new: true }
          );
        }
      });
      req.body.managers.forEach(async (manager) => {
        // Add team to User model
        if (!team.managers.toString().includes(manager)) {
          await User.findByIdAndUpdate(
            manager,
            { $push: { teams: team._id } },
            { new: true }
          );
        }
      });
    }
    var teamId = req.params.id;
    if (!ObjectID.isValid(teamId)) {
      throw new Error("Team ID is not valid");
    }
    await Team.findOneAndUpdate({ _id: teamId }, req.body, { new: true });
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /team/:id/company/:companyName
app.delete("/team/:id/company/:companyName", async (req, res) => {
  try {
    var name = decodeURI(req.params.companyName);
    await Team.findByIdAndUpdate(
      req.params.id,
      { $pull: { busCompanies: name } },
      { new: true }
    );
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /team/:teamId/member/:memberId
app.delete("/team/:teamId/member/:memberId", async (req, res) => {
  try {
    var teamId = req.params.teamId,
      memberId = req.params.memberId;
    if (!ObjectID.isValid(teamId)) {
      throw new Error("Team ID is not valid");
    }
    if (!ObjectID.isValid(memberId)) {
      throw new Error("Member ID is not valid");
    }
    await Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: memberId } },
      { new: true }
    );
    await Member.findByIdAndUpdate(
      memberId,
      { $pull: { teams: teamId } },
      { new: true }
    );
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /member
app.post("/member", async (req, res) => {
  try {
    if (req.body.player == "on") {
      req.body.player = true;
    }
    if (
      req.body.relationships != undefined &&
      req.body.relationships.length != 0
    ) {
      req.body.relationships = req.body.relationships.split(",");
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
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /member/:id/update
app.post("/member/:id/update", async (req, res) => {
  try {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
      throw new Error("Member ID is not valid");
    }
    var oldMember = await Member.findById(id);
    if (
      req.body.relationships != undefined &&
      req.body.relationships.length != 0
    ) {
      req.body.relationships = req.body.relationships.split(",");
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
        var otherMember = await Member.findByIdAndUpdate(
          rel,
          { $pull: { relationships: oldMember._id } },
          { new: true }
        );
      }
    });
    if (req.body.player == "on") {
      req.body.player = true;
    }
    var member = await Member.findOneAndUpdate(
      { _id: id },
      { $set: req.body },
      { new: true }
    );
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /trip
app.post("/trip", async (req, res) => {
  try {
    req.body.stringifiedDate = moment(req.body.date).format("LLL");
    var trip = await new Trip(req.body);
    var team = await Team.findById(trip.team);
    if (req.body.busCompany == "") {
      req.body.busCompany = null;
    }
    if (team.trips) {
      team.trips.push(trip._id);
    } else {
      team.trips = new Array(trip._id);
    }
    await team.save();
    await trip.save();
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /trip/:id
app.delete("/trip/:id", async (req, res) => {
  try {
    var trip = await Trip.findById(req.params.id);
    await Team.findByIdAndUpdate(
      trip.team,
      { $pull: { trips: trip._id } },
      { new: true }
    );
    trip.members.forEach(async (member) => {
      await Member.findByIdAndUpdate(
        member,
        { $pull: { trips: trip._id } },
        { new: true }
      );
    });
    await Trip.findByIdAndRemove(trip._id);
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /trip/:id
app.get("/trip/:id", async (req, res) => {
  try {
    var trip = await Trip.findById(req.params.id);
    var team = await Team.findById(trip.team);
    var memberArray = await Member.getAll();
    var array = [];
    for (var i in memberArray) {
      if (team.members.toString().includes(memberArray[i]._id)) {
        array[i] = memberArray[i];
      }
    }
    memberArray = array;
    res.render("trip/trip", { trip, team, memberArray });
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /trip/:tripId/member/:memberId
app.post("/trip/:tripId/member/:memberId", async (req, res) => {
  try {
    var tripId = req.params.tripId;
    var memberId = req.params.memberId;
    if (!ObjectID.isValid(tripId) || !ObjectID.isValid(memberId)) {
      throw new Error("Trip or Member ID is not valid");
    }
    var trip = await Trip.findById(tripId);
    var member = await Member.findById(memberId);
    if (!trip.members) {
      trip.members = new Array(memberId);
    } else {
      trip.members.push(memberId);
    }
    if (!member.trips) {
      member.trips = new Array(tripId);
    } else {
      member.trips.push(tripId);
    }
    await member.save();
    await trip.save();
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /trip/:tripId/member/:memberId
app.delete("/trip/:tripId/member/:memberId", async (req, res) => {
  try {
    var tripId = req.params.tripId;
    var memberId = req.params.memberId;
    if (!ObjectID.isValid(tripId) || !ObjectID.isValid(memberId)) {
      throw new Error("Trip or Member ID is not valid");
    }
    await Trip.findByIdAndUpdate(
      tripId,
      { $pull: { members: memberId } },
      { new: true }
    );
    await Member.findByIdAndUpdate(
      memberId,
      { $pull: { trips: tripId } },
      { new: true }
    );
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /trip/:id/time
app.post("/trip/:id/time", async (req, res) => {
  try {
    // CHANGE THIS FOR DAYLIGHT SAVINGS TIME (-6 When in Daylight savings, -5 when not)
    var date = await getTime(-5);
    if (!ObjectID.isValid(req.params.id)) {
      throw new Error("Trip ID is invalid!");
    }
    if (req.body.type == "homeDepartTime") {
      await Trip.findByIdAndUpdate(
        req.params.id,
        { $set: { homeDepartTime: date } },
        { new: true }
      );
    } else if (req.body.type == "destinationArrivalTime") {
      await Trip.findByIdAndUpdate(
        req.params.id,
        { $set: { destinationArrivalTime: date } },
        { new: true }
      );
    } else if (req.body.type == "destinationDepartTime") {
      await Trip.findByIdAndUpdate(
        req.params.id,
        { $set: { destinationDepartTime: date } },
        { new: true }
      );
    } else if (req.body.type == "homeArrivalTime") {
      await Trip.findByIdAndUpdate(
        req.params.id,
        { $set: { homeArrivalTime: date } },
        { new: true }
      );
    }
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /trip/:id/update
app.post("/trip/:id/update", async (req, res) => {
  try {
    var trip = await Trip.findById(req.params.id);
    var today = new Date(trip.date);
    if (req.body.homeDepartTime) {
      today = today.setHours(req.body.homeDepartTime.split(":")[0]);
      today = new Date(today);
      today = today.setMinutes(req.body.homeDepartTime.split(":")[1]);
      req.body.homeDepartTime = today;
    }
    if (req.body.destinationArrivalTime) {
      today = today.setHours(req.body.destinationArrivalTime.split(":")[0]);
      today = new Date(today);
      today = today.setMinutes(req.body.destinationArrivalTime.split(":")[1]);
      req.body.destinationArrivalTime = today;
    }
    if (req.body.destinationDepartTime) {
      today = today.setHours(req.body.destinationDepartTime.split(":")[0]);
      today = new Date(today);
      today = today.setMinutes(req.body.destinationDepartTime.split(":")[1]);
      req.body.destinationDepartTime = today;
    }
    if (req.body.homeArrivalTime) {
      today = today.setHours(req.body.homeArrivalTime.split(":")[0]);
      today = new Date(today);
      today = today.setMinutes(req.body.homeArrivalTime.split(":")[1]);
      req.body.homeArrivalTime = today;
    }
    if (req.body.date) {
      req.body.stringifiedDate = moment(req.body.date).format("LLL");
    }
    Object.keys(req.body).forEach((item) => {
      if (req.body[item] == "") {
        throw new Error("Must enter a time");
      }
    });
    await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /associations
app.get("/associations", async (req, res) => {
  try {
    if (req.user.admin == true) {
      var userArray = await User.getAll();
      var teamArray = await Team.getAll();
      var associationArray = await Association.getAll();
      res.render("association/associationIndex", {
        userArray,
        teamArray,
        associationArray,
      });
    } else {
      req.flash("error", "Must be an admin to access this page");
      res.redirect("/");
    }
  } catch (e) {
    try {
      var userArray = await User.getAll();
      res.render("association/associationIndex", { userArray });
    } catch (e) {
      console.log(e);
      req.flash("error", e.message);
      res.redirect("back");
    }
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// GET /association/:id
app.get("/association/:id", async (req, res) => {
  try {
    if (req.user.admin == true || req.user.director == req.params.id) {
      var association = await Association.findById(req.params.id);
      var userArray = await User.getAll();
      var teamArray = await Team.getAll();
      res.render("association/association", {
        association,
        userArray,
        teamArray,
      });
    } else {
      req.flash("error", "You are not authorized to access this page");
      res.redirect("/");
    }
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /association
app.post("/association", async (req, res) => {
  try {
    if (req.body.directors == "") {
      req.body.directors = null;
    } else {
      req.body.directors = req.body.directors.split(",");
    }
    var association = new Association(req.body);
    await association.save();
    req.body.directors.forEach(async (dir) => {
      var user = await User.findById(dir);
      if (user.admin == false) {
        user.director = association._id;
        await user.save();
      }
    });
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// POST /association/:id/update
app.post("/association/:id/update", async (req, res) => {
  try {
    var associationId = req.params.id;
    if (!ObjectID.isValid(associationId)) {
      throw new Error("Association ID is not valid");
    }
    var association = await Association.findById(associationId);
    if (req.body.busCompanies && !req.body.prevCompanyName) {
      association.busCompanies.push(req.body.busCompanies);
      req.body.busCompanies = association.busCompanies;
    }
    if (req.body.busCompanies && req.body.prevCompanyName) {
      association = await Association.findByIdAndUpdate(
        association._id,
        { $pull: { busCompanies: req.body.prevCompanyName } },
        { new: true }
      );
      association.busCompanies.push(req.body.busCompanies);
      req.body.busCompanies = association.busCompanies;
    }
    if (typeof req.body.directors != "undefined") {
      if (req.body.directors != undefined && req.body.directors.length != 0) {
        req.body.directors = req.body.directors.split(",");
      } else {
        req.body.directors = [];
      }
      if (
        association.directors != undefined &&
        association.directors.length > 0
      ) {
        association.directors.forEach(async (i) => {
          // Remove association director from User model
          if (!req.body.directors.toString().includes(i)) {
            await User.findByIdAndUpdate(
              i,
              { $set: { director: null } },
              { new: true }
            );
          }
        });
      }
      await req.body.directors.forEach(async (director) => {
        // Add association director to User model
        if (!association.directors.toString().includes(director)) {
          await User.findByIdAndUpdate(
            director,
            { $set: { director: association._id } },
            { new: true }
          );
        }
        // Remove user from director of other associations
        var associationArray = await Association.getAll();
        for (var i in associationArray) {
          if (
            associationArray[i].directors.toString().includes(director) &&
            i != associationId
          ) {
            association = await Association.findByIdAndUpdate(
              i,
              { $pull: { directors: director } },
              { new: true }
            );
          }
        }
      });
    }
    await Association.findOneAndUpdate({ _id: associationId }, req.body, {
      new: true,
    });
    res.redirect("back");
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

// DELETE /association/:id/company/:companyName
app.delete("/association/:id/company/:companyName", async (req, res) => {
  try {
    var name = decodeURI(req.params.companyName);
    await Association.findByIdAndUpdate(
      req.params.id,
      { $pull: { busCompanies: name } },
      { new: true }
    );
    res.end();
  } catch (e) {
    console.log(e);
    req.flash("error", e.message);
    res.redirect("back");
  }
});

async function getTime(offset) {
  try {
    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + 3600000 * offset);

    // return time as a string
    return nd.toLocaleString();
  } catch (e) {
    throw Error(e);
  }
}

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = { app };
