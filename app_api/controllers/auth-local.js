var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var Utils = require('../utils/util.js');
var utils = new Utils();

module.exports.register = function(req, res) {
  if(!req.body.name || !req.body.email || !req.body.password) {
    utils.sendJSONresponse(res, 400, "All fields required");
    return;
  }

  User.findOne({ 'local.email': req.body.email }, function (err, user) {
    if (err || user) { 
      utils.sendJSONresponse(res, 400, "User already exists. Try to login.");
      return;
    }

    var user = new User();
    user.local.name = req.body.name;
    user.local.email = req.body.email;
    user.setPassword(req.body.password);

    user.save(function(err, savedUser) {
      var token;
      if (err) {
        utils.sendJSONresponse(res, 404, err);
      } else {
        token = user.generateJwt();

        var myCookie = JSON.stringify(user);

        res.cookie('localCookie', myCookie /*, { maxAge: 900000, httpOnly: true }*/);


        utils.sendJSONresponse(res, 200, 
          JSON.stringify({ 
            'token' : token,
            'id' : savedUser._id
          })
          );
      }
    });
  });

  
};

module.exports.login = function(req, res) {
  if(!req.body.email || !req.body.password) {
    utils.sendJSONresponse(res, 400, {
      "message": "All fields required"
    });
    return;
  }
  
  passport.authenticate('local', function(err, user, info){
    var token;
    if (err) {
      utils.sendJSONresponse(res, 404, err);
      return;
    }
    if(user){
      token = user.generateJwt();
      utils.sendJSONresponse(res, 200, 
        JSON.stringify({ 
          'token' : token,
          'id' : user._id
        })
        );
    } else {
      utils.sendJSONresponse(res, 401, info);
    }
  })(req, res);
};

module.exports.unlinkLocal = function(req, res) {
  console.log("User found to unlink: ");
  console.log(req.cookies);
  console.log(req.cookies.localCookie);
  var localUser = JSON.parse(req.cookies.localCookie);
  if(localUser) {
    User.findOne({ '_id': localUser._id }, function (err, user) {
      user.local = undefined;
      user.save(function(err) {
        res.clearCookie('localCookie');
        res.redirect('/profile');
      });
    });
  }
};