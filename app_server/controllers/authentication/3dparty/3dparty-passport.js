module.exports = function (userRef, passportRef) {
  var thirdpartyConfig = require('./3dpartyconfig');
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GitHubStrategy = require('passport-github').Strategy;
  var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
  var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
  var TwitterStrategy = require('passport-twitter').Strategy;

  var MockStrategy = require('passport-mocked').Strategy;

  var logger = require('../../../utils/logger.js');

  //----------experimental---
  var authExperimentalFeatures = require('../common/auth-experimental-collapse-db.js');
  //-------------------------

  function updateUser (user, accessToken, profile, serviceName) {    
    // warning: if you are not able to set a value in user[serviceName]
    // go to models/users.js and add the missing property there.
    // common
    user[serviceName].id = profile.id;
    user[serviceName].token = accessToken;
    // other cases
    switch(serviceName) {
      case 'facebook':
        user[serviceName].name  = profile.name.givenName + ' ' + profile.name.familyName;
        user[serviceName].profileUrl = profile.profileUrl;
        user[serviceName].email = profile.emails[0].value; //get the first email
        return user;
      case 'github':
        user[serviceName].name  = profile.displayName;
        user[serviceName].username = profile.username;
        user[serviceName].profileUrl = profile.profileUrl;
        user[serviceName].email = profile.emails[0].value; //get the first email
        return user;
      case 'google':
        user[serviceName].name  = profile.displayName;
        user[serviceName].email = profile.emails[0].value; //get the first email
        return user;
      case 'linkedin':
        user[serviceName].name  = profile.name.givenName + ' ' + profile.name.familyName;
        user[serviceName].email = profile.emails[0].value; //get the first email
        return user;
      case 'twitter':
        user[serviceName].name  = profile.displayName ? profile.displayName : profile.username;
        user[serviceName].username  = profile.username;
        if(profile.emails && profile.emails[0] && profile.emails[0].value) {
          //twitter doesn't provide profile.email's field by default. You must 
          //request the permission to twitter to ask email to users.
          //To be sure, I decided to check if email's field is available.
          user[serviceName].email = profile.emails[0].value; //get the first email
        }
        return user;
    }    
    return user;
  }

  function authenticate(req, accessToken, refreshToken, profile, done, serviceName) {
    console.log(serviceName + ' authentication called');
    
    console.log("accessToken: " + accessToken);

    console.log(profile);

    process.nextTick(() => {
      var sessionLocalUserId = req.session.localUserId;
      //check if the user is already logged in using the LOCAL authentication
      if(sessionLocalUserId) {
        console.log("sessionLocalUserId found - managing 3dauth + local");
        //the user is already logged in
        userRef.findOne({ '_id': sessionLocalUserId }, (err, user) => {
          if (err) { 
            throw err; 
          }
          console.log("User found - saving");
          var userUpdated = updateUser(user, accessToken, profile, serviceName);
          console.log("updated localuser with 3dpartyauth");
          userUpdated.save(err => {
            if (err) { 
              throw err; 
            }

            //----------------- experimental ---------------
            authExperimentalFeatures.collapseDb(user, serviceName, req)
            .then(result => {
              console.log("collapseDb localuser with 3dpartyauth promise: " + result);
              return done(null, result);
            }, reason => {
              console.log("ERROR collapseDb localuser with 3dpartyauth promise");
              return done(null, user);
            });
            //----------------------------------------------
          });
        });
      } else {
        console.log("Only 3dauth");
        if (!req.user) { //if the user is NOT already logged in
          console.log("User not already logged in");
          const serviceNameId = serviceName + '.id';    

          const query = {};
          query[serviceNameId] = profile.id;

          userRef.findOne(query, (err, user) => {
            console.log("User.findOne...");
            if (err) { 
              return done(err); 
            }

            if (user) { // if the user is found, then log them in
              console.log("User found");
              // if there is already a user id but no token (user was linked at one point and then removed)
              // just add our token and profile informations
              var userUpdated = '';
              if (!user[serviceName].token) {
                console.log("Id is ok, but not token, updating...");
                userUpdated = updateUser(user, accessToken, profile, serviceName);
                userUpdated.save( err => {
                  if (err) { 
                    throw err; 
                  }
                  return done(null, userUpdated);
                });
              }
              return done(null, user);
            } else { 
              //otherwise, if there is no user found with that id, create them
              console.log("User not found with that id, creating a new one...");
              var newUser = updateUser(new userRef(), accessToken, profile, serviceName);
              console.log("New user created: " + newUser);
              newUser.save( err => {
                if (err) { 
                  throw err; 
                }
                return done(null, newUser);
              });
            }
          });
        } else { 
          // user already exists and is logged in, we have to link accounts    
          // req.user pull the user out of the session
          // and finally update the user with the currecnt users credentials
          console.log("User already exists but I'm not previously logged in");
          var user = updateUser(req.user, accessToken, profile, serviceName);        
          user.save( (err, savedUser) => {
            if (err) { 
              throw err; 
            }

            console.log("Saving already existing user.");

            //----------------- experimental ---------------
            authExperimentalFeatures.collapseDb(savedUser, serviceName, req)
            .then(result => {
              console.log("collapseDb promise: " + result);
              return done(null, result);
            }, reason => {
              console.log("ERROR collapseDb promise");
              return done(null, savedUser);
            });
            //----------------------------------------------
            
          });
        }
      }
    });
  }


  function buildStrategy(serviceName) {
    console.log("service: " + serviceName + " env: " + process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'test' ) {
      console.log("building strategy in test env");
      let config = thirdpartyConfig[serviceName];
      config.name = serviceName;
      console.log(config);
      return new MockStrategy( config, 
        function(accessToken, refreshToken, profile, cb) {
          var newUser = updateUser(new userRef(), accessToken, profile, serviceName);
          console.log("New user created: " + newUser);
          newUser.save( err => {
            if (err) { 
              throw err; 
            }
            return done(null, newUser);
          });
      });
    } else {
      switch(serviceName) {
        case 'facebook':
          return new FacebookStrategy( thirdpartyConfig[serviceName],
            (req, accessToken, refreshToken, profile, done) => { authenticate(req, accessToken, refreshToken, profile, done, serviceName);});
        case 'github': 
          return new GitHubStrategy( thirdpartyConfig[serviceName],
            (req, accessToken, refreshToken, profile, done) => { authenticate(req, accessToken, refreshToken, profile, done, serviceName);});
        case 'google':
          return new GoogleStrategy( thirdpartyConfig[serviceName],
            (req, accessToken, refreshToken, profile, done) => { authenticate(req, accessToken, refreshToken, profile, done, serviceName);});
        case 'linkedin':
          return new LinkedInStrategy( thirdpartyConfig[serviceName],
            (req, accessToken, refreshToken, profile, done) => { authenticate(req, accessToken, refreshToken, profile, done, serviceName);});
        case 'twitter':
          return new TwitterStrategy( thirdpartyConfig[serviceName],
            (req, accessToken, refreshToken, profile, done) => { authenticate(req, accessToken, refreshToken, profile, done, serviceName);});
      }
    }
  }

  passportRef.use(buildStrategy('facebook'));
  passportRef.use(buildStrategy('github'));
  passportRef.use(buildStrategy('google'));
  passportRef.use(buildStrategy('linkedin'));
  passportRef.use(buildStrategy('twitter'));

  return module;
};