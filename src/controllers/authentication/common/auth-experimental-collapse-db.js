var mongoose = require('mongoose');
var User = mongoose.model('User');
var logger = require('../../../utils/logger.js');
var authCommon = require('./auth-common.js');
var Utils = require('../../../utils/util.js');
var serviceNames = require('../serviceNames');
var _ = require('lodash');

module.exports.collapseDb = (loggedUser, serviceName, req) => {
	return new Promise((resolve, reject) => {
		if(Utils.isNotSimpleCustomObject(loggedUser)) {
			console.error("impossible to collapseDb because loggedUser is not an object");
			reject('impossible to collapseDb because loggedUser is not an object');
			return;
		}

		if(!_.isString(serviceName)) {
			console.error("impossible to collapseDb because serviceName must be a string");
			reject('impossible to collapseDb because serviceName must be a string');
			return;
		}

		if(serviceNames.indexOf(serviceName) === -1) {
			console.error("impossible to collapseDb because serviceName is not recognized");
			reject('impossible to collapseDb because serviceName is not recognized');
			return;
		}

		console.log("--------------------------******----");
		console.log("INPUT loggedUser");
		console.log(loggedUser);
		console.log("serviceName: " + serviceName);

		let inputId;
		let query = {};
		var keyProperty = serviceName === 'local' ? 'email' : 'id';

		if(loggedUser[serviceName] && !_.isNil(loggedUser[serviceName][keyProperty])) {
			inputId = loggedUser[serviceName][keyProperty];
			console.log("inputId " + inputId);
			const key =  serviceName + '.' + keyProperty;
			query[key] = inputId;
		}

		if(_.isNil(inputId)) {
			console.error('inputId is not valid (null OR undefined)');
			reject('input id not valid while collapsing');
		}

		User.find(query, (err, users) => {
			if(!users || err) {
				console.error("--------------------------******---- Error - users not found!!!");
				reject('User  not found while collapsing');
			}

			console.log("--------------------------******---- users found");
			console.log(users);

			//retrive the logged user from the db using his _id (id of mongodb's object)
			var user = users.find(el => {
				if(el && el._id) {
					return el._id + '' === loggedUser._id + '';
				}
			});

			if(!user) {
				console.error("--------------------------******---- Error - user not found!!!");
				reject('User not found while collapsing db');
				return;
			}

			let duplicatedUser = users.filter(dbUser => {
				let idOrEmail = dbUser[serviceName][keyProperty];
				if (dbUser && dbUser[serviceName] && idOrEmail === inputId &&
					 (dbUser._id + '') !== (user._id + '') ) {
					return dbUser;
				}
			});

			if(!duplicatedUser || !duplicatedUser[0]) {
				console.error("No duplicated user found");
				reject('No duplicated user found while collapsing');
				return;
			}

			duplicatedUser = duplicatedUser[0];

			console.log("--------------------------******----preparing to collapse duplicated db's users");
			console.log(user);
			console.log("--------------------------******----");
			console.log(duplicatedUser);
			console.log("--------------------------******----");

			let updated = false;

			//ATTENTION: at the moment I decided to manage profile infos as services.
			//TODO I'll remove this logic splitting profile logic from authentication logic.
			for(let s of serviceNames) {
				console.log('cycle s: ' + s + ', serviceName: ' + serviceName);
				if(s !== serviceName && (!user[s] || !user[s].id) &&
					duplicatedUser[s] && (duplicatedUser[s].id || duplicatedUser[s].email)) {
					user[s] = duplicatedUser[s];
					updated = true;
				}
			}

			console.log("--------------------------******---- modified user");
			console.log(user);
			console.log("--------------------------******---- saving this modified user");

			if(duplicatedUser && updated) {
				user.save((err, savedUser) => {
					if (!savedUser || err) {
						console.error("Error while saving collapsed users");
						reject('Error while saving collapsed users');
					}

					console.log("Saved modified user: " + savedUser);
					console.log("updating auth token with user infos");
					try {
						req.session.authToken = authCommon.generateSessionJwtToken(savedUser);
					} catch(e) {
						logger.error(e);
						reject("Impossible to generateSessionJwtToken due to an internal server error");
						return;
					}
					console.log('req.session.authToken finished collapse with: ' + req.session.authToken);

					console.log('savedUser is: ');
					console.log(savedUser);

					console.log("--------------------------******---- removing duplicated user [OK]");
					User.findByIdAndRemove(duplicatedUser._id, err => {
						if (err) {
							reject('Impossible to remove duplicated user while collapsing');
						}
						// we have deleted the user
						console.log('--------------------------******---- duplicated User deleted! [OK]');
						console.log("savedUser: " + savedUser);
						resolve(savedUser);
					});
				});
			} else {
				console.log("I can't do anything because there isn't a duplicated users! [OK]");
				reject("I can't do anything because there isn't a duplicated users! [OK]");
			}
		});
	});
};