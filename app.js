console.log("Starting with NODE_ENV=" + process.env.NODE_ENV);
console.log("process.env.CI is " + process.env.CI);

if(!(process.env.CI && process.env.CI === 'yes')) {
  console.log("Initializing dotenv (requires .env file)")
  require('dotenv').config(); //to read info from .env file
  //attention: i'm using "dotenv" 2.0 and for this reason I must call "config()".
}

var path = require('path');

// --------------------------------------------------------
// --------------------------------------------------------
// See this issue here https://github.com/Ks89/My-MEAN-website/issues/30
//  to understand this piece of code.
var pathFrontEndFolder, pathFrontEndIndex;
var pathFrontEndAdminIndex;
if((process.env.CI && process.env.CI === 'yes') || process.env.NODE_ENV === 'test') {
  console.log("Executed in CI or TEST - providing fake '../My-MEAN-Website-client' and index.html");
  //provides fake directories and files to be able to run this files
  //also with mocha in both testing and ci environments.
  //Otherwise, you are forced to run `npm run build` into ../My-MEAN-Website-client's folder
  pathFrontEndFolder = path.join(__dirname);
  pathFrontEndIndex = path.join(__dirname, 'app.js');
} else {
  console.log("Providing real '../My-MEAN-Website-client' and index.html");
  pathFrontEndFolder = path.join(__dirname, '../', 'My-MEAN-Website-client', 'dist');
  pathFrontEndIndex = path.join(__dirname, '../', 'My-MEAN-Website-client', 'dist', 'index.html');
  pathFrontEndAdminIndex = path.join(__dirname, '../', 'My-MEAN-Website-client', 'dist', 'admin.html');
}
// --------------------------------------------------------
// --------------------------------------------------------

var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
//logger created with winston
var logger = require("./src/utils/logger");

var redis   = require("redis"); //it's really useful?
var RedisStore = require('connect-redis')(session);
var client  = redis.createClient(); //it's really useful?

// --------------------------------------------------------------------------
// ----------------------------security packages-----------------------------
// --------------------------------------------------------------------------
// All security features are prefixed with `--SEC--`
// --SEC-- - github analog-nico/hpp [NOT helmet]
//    [http params pollution] security package to prevent http params pollution
var hpp = require('hpp');
// --SEC-- - [CSRF] github.com/expressjs/csurf [NOT helmet]
var csrf = require('csurf');
// --SEC-- - authentication local/3dparty (OAuth)
var passport = require('passport');
// --SEC-- - github ericmdantas/express-content-length-validator [NOT helmet]
//    large payload attacks - Make sure this application is
//    not vulnerable to large payload attacks
var contentLength = require('express-content-length-validator');
const MAX_CONTENT_LENGTH_ACCEPTED = 9999; // constants used with `contentLength`
// --SEC-- - Helmet
var helmet = require('helmet');
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------

console.log("Initializing mongodb");
//require for mongo
require('./src/models/db');
require('./src/controllers/authentication/passport')(passport);

console.log("Initializing expressjs");
var app = express();

console.log("Initializing helmet");
// --SEC-- - [helmet] enable helmet
// this automatically add 9 of 11 security features
/*
  -dnsPrefetchControl controls browser DNS prefetching
  -frameguard to prevent clickjacking
  -hidePoweredBy to remove the X-Powered-By header
  -hpkp for HTTP Public Key Pinning
  -hsts for HTTP Strict Transport Security
  -ieNoOpen sets X-Download-Options for IE8+
  -noSniff to keep clients from sniffing the MIME type
  -xssFilter adds some small XSS protections
*/
// The other features NOT included by default are:
/*
  -contentSecurityPolicy for setting Content Security Policy
  -noCache to disable client-side caching => I don't want this for better performances
  -referrerPolicy to hide the Referer header
*/
app.use(helmet());

// --SEC-- - noCache to disable client-side caching [helmet]
// I don't want this for better performances (leave commented :))
// app.use(helmet.noCache())

// --SEC-- - referrer-policy to hide the Referer header [helmet]
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))

// --SEC-- - Public Key Pinning (hpkp): HTTPS certificates can be forged,
//    allowing man-in-the middle attacks.
//    HTTP Public Key Pinning aims to help that. [helmet]
const ninetyDaysInSeconds = 7776000;
app.use(helmet.hpkp({
  maxAge: ninetyDaysInSeconds,
  sha256s: ['AbCdEf123=', 'ZyXwVu456='],
  includeSubdomains: true,         // optional
  reportUri: 'https://example.com/hpkp-report', // optional
  reportOnly: false,               // optional
  // Set the header based on a condition.
  setIf: (req, res)  => req.secure //optional ()
}));

// --SEC-- - Content Security Policy (CSP): Trying to prevent Injecting anything
//    unintended into our page. That could cause XSS vulnerabilities,
//    unintended tracking, malicious frames, and more. [helmet]
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'localhost:3000', 'localhost:3001', 'www.google.com', 'www.youtube.com'],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'maxcdn.bootstrapcdn.com',
                'ajax.googleapis.com', 'cdnjs.cloudflare.com',
                'code.jquery.com', 'www.google.com',
                'www.gstatic.com'],
    styleSrc: ["'self'", 'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com', 'cdnjs.cloudflare.com', "'unsafe-inline'"],
    fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
    imgSrc: ["'self'", 'localhost:3000', 'localhost:3001',
              'placehold.it', 'placeholdit.imgix.net', 'camo.githubusercontent.com',
              's3.amazonaws.com', 'cdnjs.cloudflare.com'],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin', 'allow-popups'],
    frameSrc : ["'self'", 'www.google.com', 'www.youtube.com'], //frame-src is deprecated
    childSrc : ["'self'", 'www.google.com', 'www.youtube.com'],
    connectSrc: [
        "'self'", "cdnjs.cloudflare.com", "ajax.googleapis.com",
        "ws://localhost:3000", "ws://localhost:3001", "ws://localhost:3100",
        "ws://localhost:3300"
    ],
    reportUri: '/report-violation',
    objectSrc: ["'none'"]
  },
  // Set to true if you only want browsers to report errors, not block them
  reportOnly: false,
  // Set to true if you want to blindly set all headers: Content-Security-Policy,
  // X-WebKit-CSP, and X-Content-Security-Policy.
  setAllHeaders: false,
  // Set to true if you want to disable CSP on Android where it can be buggy.
  disableAndroid: false,
  // Set to false if you want to completely disable any user-agent sniffing.
  // This may make the headers less compatible but it will be much faster.
  // This defaults to 'true'.
  browserSniff: true
}));

// --SEC-- - large payload attacks:
//   this line enables the middleware for all routes [NOT helmet]
app.use(contentLength.validateMax({max: MAX_CONTENT_LENGTH_ACCEPTED,
  status: 400, message: "stop it!"})); // max size accepted for the content-length


console.log("Initializing morgan (logger)");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan({ "stream": logger.stream }));

console.log("Initializing static resources");
app.use(express.static(pathFrontEndFolder));

console.log("Initializing bodyparser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

console.log("Initializing hpp");
// --SEC-- - http params pollution: activate http parameters pollution
// use this ALWAYS AFTER app.use(bodyParser.urlencoded()) [NOT helmet]
app.use(hpp());

console.log("Initializing Express session");
// Express Session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: new RedisStore({ host: 'localhost', port: 6379, client: client,ttl :  260}),
    // cookie: {
    //   httpOnly: false,
    //     secure: false, //to use true, you must use https. If you'll use true with http it won't work.
    //     //maxAge: 2160000000
    // }
}));

console.log("Initializing passportjs");

app.use(passport.initialize());
app.use(passport.session());

// compress all requests using gzip
app.use(compression());

console.log("Initializing REST apis and CSRF");

// --------------------------------------- ROUTES ---------------------------------------
// dedicated routes for angular logging with stacktracejs
// these router aren't protected with csrf, because declared before app.use(csrf()).
var loggerApi = require('./src/routes/log-api')(express);
app.use('/api/log', loggerApi);

// enable middleware CSRF by csurf package [NOT helmet]
// before app.use('/api', routesApi); to protect their,
// but after session and/or cookie initialization
app.use(csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.csrftoken = req.csrfToken();
  next();
});

// APIs for all route protected with CSRF (all routes except for angular log's service)
var routesApi = require('./src/routes/index')(express);
app.use('/api', routesApi);
// --------------------------------------------------------------------------------------

console.log("Initializing static path for index.html");

app.use('/', function(req, res) {
  res.sendFile(pathFrontEndIndex);
});

app.use('/admin', function(req, res) {
  res.sendFile(pathFrontEndAdminIndex);
});

// catch bad csrf token
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  // handle CSRF token errors here
  res.status(403);
  res.json({"message" : 'session has expired or form tampered with'});
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
