'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);
let async = require('async');

require('../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');

let user;
let csrftoken;
let connectionSid;

const USER_NAME = 'username';
const USER_EMAIL = 'email@email.it';
const USER_PASSWORD = 'Password1';

const LOGIN_WRONG_EMAIL = 'WRONG@email.it';
const LOGIN_WRONG_PASSWORD = 'Password2';

const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};

const wrongLoginMock = {
	email : LOGIN_WRONG_EMAIL,
	password : LOGIN_WRONG_PASSWORD
};

const URL_CLIENT_LOGIN_PAGE = '/login';
const URL_LOGIN = '/api/login';
const URL_UNLINK_LOCAL = '/api/unlink/local';
const URL_LOGOUT = '/api/logout';

describe('auth-local', () => {

	function updateCookiesAndTokens(done) {
		agent
		.get(URL_CLIENT_LOGIN_PAGE)
		.end((err, res) => {
			if(err) {
				done(err);
			} else {
				csrftoken = (res.headers['set-cookie']).filter(value => value.includes('XSRF-TOKEN'))[0];
				connectionSid = (res.headers['set-cookie']).filter(value => value.includes('connect.sid'))[0];
				csrftoken = csrftoken ? csrftoken.split(';')[0].replace('XSRF-TOKEN=','') : '';
				connectionSid = connectionSid ? connectionSid.split(';')[0].replace('connect.sid=','') : '';
				done();
			}
		});
	}

	function insertUserTestDb(done) {
		user = new User();
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
    user.save()
      .then(usr2 => {
        user._id = usr2._id;
        updateCookiesAndTokens(done); //pass done, it's important!
      })
      .catch(err => {
        done(err);
      });
	}

	//useful function that prevent to copy and paste the same code
	function getPartialPostRequest (apiUrl) {
		return agent
			.post(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('set-cookie', 'connect.sid=' + connectionSid)
			.set('set-cookie', 'XSRF-TOKEN=' + csrftoken);
	}

	function getPartialGetRequest (apiUrl) {
		return agent
			.get(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json');
	}

	function dropUserTestDbAndLogout(done) {
    User.remove({})
      .then(() => {
        //I want to try to logout to be able to run all tests in a clean state
        //If this call returns 4xx or 2xx it's not important here
        getPartialGetRequest(URL_LOGOUT)
          .send()
          .end((err, res) => done(err));
      }).catch(err => {
        fail('should not throw an error');
        done(err);
      });
	}

	describe('#unlinkLocal()', () => {

		describe('---YES---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should correctly unlink local user (last unlink)', done => {

				async.waterfall([
					asyncDone => {
						getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;

						getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(200)
						.end((err, res) => {
							if (err) {
								return asyncDone(err);
							} else {
								console.log(res.body);
								expect(res.body).to.be.equals("User unlinked correctly!");

								asyncDone();
							}
						});
					}
				], (err, response) => done(err));
			});

			it('should correctly unlink local user (not last unlink)', done => {
				async.waterfall([
					asyncDone => {
            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                usr.github.id = '1231232';
                usr.github.token = 'TOKEN';
                usr.github.email = 'email@email.it';
                usr.github.name = 'username';
                usr.github.username = 'username';
                usr.github.profileUrl = 'http://fakeprofileurl.com/myprofile';
                return usr.save();
              })
              .then(usr2 => {
                user = usr2;
                updateCookiesAndTokens(asyncDone); //pass done, it's important!
              })
              .catch(err1 => {
                return asyncDone(err1);
              });
					},
					asyncDone => {
            User.findOne({ 'local.email': USER_EMAIL })
              .then(usr => {
                updateCookiesAndTokens(asyncDone);
              }).catch(err => {
                return asyncDone(err1);
              });
					},
					asyncDone => {
						getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err, res));
					},
					(res, asyncDone) => {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;

						getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(200)
						.end((err, res) => {
							if (err) {
								asyncDone(err);
							} else {
								console.log(res.body);
								expect(res.body).to.be.equals("User unlinked correctly!");
								asyncDone();
							}
						});
					},
					asyncDone => {
						User.findOne({ 'github.id': user.github.id })
              .then(usr => {
                expect(usr.local.name).to.be.undefined;
                expect(usr.local.email).to.be.undefined;
                expect(usr.local.hash).to.be.undefined;
                expect(usr.github.id).to.be.equals(user.github.id);
                expect(usr.github.token).to.be.equals(user.github.token);
                expect(usr.github.email).to.be.equals(user.github.email);
                expect(usr.github.name).to.be.equals(user.github.name);
                expect(usr.github.username).to.be.equals(user.github.username);
                expect(usr.github.profileUrl).to.be.equals(user.github.profileUrl);
                asyncDone();
              }).catch(err1 => {
                return asyncDone(err1);
              });
					}
				], (err, response) => done(err));
			});

			afterEach(done => dropUserTestDbAndLogout(done));
		});

		describe('---ERRORS---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should catch 403 FORBIDDEN, because you are logged, but without your user into the db', done => {
				//I'm logged in, but for some reasons my record inside the db is missing.
				async.waterfall([
					asyncDone => {
						getPartialPostRequest(URL_LOGIN)
						.set('XSRF-TOKEN', csrftoken)
						.send(loginMock)
						.expect(200)
						.end((err, res) => asyncDone(err));
					},
					asyncDone => {
            User.remove({})
              .then(() => {
                asyncDone();
              }).catch(err => {
              	asyncDone(err);
            });
					},
					asyncDone => {
						getPartialGetRequest(URL_UNLINK_LOCAL)
						.send()
						.expect(403)
						.end((err, res) => {
							expect(res.body.message).to.be.equals('User not found - cannot unlink');
							asyncDone();
						});
					}
				], (err, response) => done(err));

			});

			it('should catch 403 FORBIDDEN, because this API is available only for ' +
					'logged users. rest-auth-middleware will responde with -no token provided- message', done => {
				getPartialGetRequest(URL_LOGOUT)
				.send()
				.expect(200)
				.end((err, res) => {
					getPartialGetRequest(URL_UNLINK_LOCAL)
					.send()
					.expect(403)
					.end((err, res) => {
						expect(res.body.message).to.be.equals('No token provided');
						done();
					});
				});
			});

			afterEach(done => dropUserTestDbAndLogout(done));
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
