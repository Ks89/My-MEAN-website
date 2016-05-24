var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var logger = require('../utils/logger.js');

var Utils = require('../utils/util.js');
var async = require('async');


module.exports.collapseDb = (loggedUser, serviceName) => {

	if(!loggedUser || !serviceName) {
		console.err("impossibile to collapseDb becase either loggedUser or serviceName are null or undefined.");
	}

	console.log("--------------------------******----");
	console.log("INPUT loggedUser");
	console.log(loggedUser);
	console.log("serviceName: " + serviceName);

	const inputEmail = loggedUser[serviceName] ? loggedUser[serviceName].email : null;
	
	console.log("inputEmail " + inputEmail);

	if(!inputEmail) {
		console.err("inputEmail is not valid");
		return;
	}

	const key =  serviceName + '.email';
	const query = {};
	
	query[key] = inputEmail;

	// query._id = {
	// 	'$ne' : loggedUser._id
	// };

	User.find(query, (err, users) => {

		if(err) {
			console.err("--------------------------******---- Error - users not found!!!");
			throw err;
		}

		console.log("--------------------------******---- users found");
		console.log(users);

		var user = users.find(function (el) { 
			if(el && el._id) {
				return el._id + '' === loggedUser._id + '';
			}	
		});

		if(!user) {
			console.err("--------------------------******---- Error - user not found!!!");	
			return;		
		}

		console.log("2*****************************************");
		console.log(user);
		console.log("2*****************************************");

		let duplicatedUser = users.filter(dbUser => {
			if (dbUser && dbUser[serviceName] && dbUser[serviceName].email === inputEmail && (dbUser._id + '') !== (user._id + '') ) {
				return dbUser;
			}
		});

		if(!duplicatedUser || !duplicatedUser[0]) {
			console.log("No duplicated user found");
			return;
		}

		duplicatedUser = duplicatedUser[0];

		console.log("**--------------------------******----preparing to collapse duplicated db's users");
		console.log(user);
		console.log("**--------------------------******----");

		let updated = false;

		for(let s of ['google', 'github', 'facebook', 'local', 'linkedin', 'twitter']) {
			console.log('**--------------------------******----cycle s: ' + s + ', serviceName: ' + serviceName);
			if(s !== serviceName && (!user[s] || !user[s].email) && duplicatedUser[s]) {
				console.log("**--------------------------******---- merging service: " + s);
				user[s] = duplicatedUser[s];
				updated = true;
			}
		}

		console.log("**--------------------------******---- modified user");
		console.log(user);
		console.log("**--------------------------******---- saving this modified user");

		if(duplicatedUser && updated) {
			user.save((err, savedUser) => {
				if (err) {
					console.log("Error while saving collapsed users");
					throw err;
				}
				console.log("Saved modified user: " + savedUser); 
			});

			console.log("--------------------------******---- removing duplicated user [OK]");

			User.findByIdAndRemove(duplicatedUser._id, err => {
				if (err) {
					throw err;
				}
			  // we have deleted the user
			  console.log('--------------------------******---- duplicated User deleted! [OK]');
			});
		} else {
			console.log("I can't do anything because there isn't a duplicated users! [OK]");
		}
		console.log("--------------------------******---- collapse function finished");
	});
};