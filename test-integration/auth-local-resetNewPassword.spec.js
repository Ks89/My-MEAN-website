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

const resetMock = {
	email : USER_EMAIL
};

const NEW_PASSWORD = 'NewPassword2';

describe('auth-local', () => {

	function updateCookiesAndTokens(done) {
		agent
		.get('/login')
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

	function registerUserTestDb(done) {
		async.waterfall([
			asyncDone => {
				user = new User();
				user.local.name = USER_NAME;
				user.local.email = USER_EMAIL;
				user.setPassword(USER_PASSWORD);
				user.save()
          .then(usr => {
            updateCookiesAndTokens(asyncDone);
          }).catch(err => {
            asyncDone(err);
          });
			},
			asyncDone => {
				getPartialPostRequest('/api/reset')
				.set('XSRF-TOKEN', csrftoken)
				.send(resetMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return asyncDone(err);
					} else {
						expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');
						User.findOne({ 'local.email': resetMock.email })
              .then(usr => {
                expect(usr.local.name).to.be.equals(USER_NAME);
                expect(usr.local.email).to.be.equals(USER_EMAIL);
                expect(usr.validPassword(USER_PASSWORD));
                expect(usr.local.resetPasswordExpires).to.be.not.undefined;
                expect(usr.local.resetPasswordToken).to.be.not.undefined;

                user.local.resetPasswordToken = usr.local.resetPasswordToken;
                user.local.resetPasswordExpires = usr.local.resetPasswordExpires;

                asyncDone();
              }).catch(err1 => {
                asyncDone(err1);
              });
					}
				});
			}
		], (err, response) => {
			if (err) {
				done(err);
			} else {
				done();
			}
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

	function dropUserCollectionTestDb(done) {
    User.remove({})
      .then(() => {
        done();
      }).catch(err => {
      fail('should not throw an error');
      done(err);
    });
	}

	describe('#resetPasswordFromEmail()', () => {
		describe('---YES---', () => {

			beforeEach(done => registerUserTestDb(done));

			it('should correctly update the password after the reset', done => {
				const updateResetPwdMock = {
					newPassword : NEW_PASSWORD,
					emailToken : user.local.resetPasswordToken
				};

				getPartialPostRequest('/api/resetNewPassword')
				.set('XSRF-TOKEN', csrftoken)
				.send(updateResetPwdMock)
				.expect(200)
				.end((err, res) => {
					if (err) {
						return done(err);
					} else {
						console.log(res.body.message);
						expect(res.body.message).to.be.equals('An e-mail has been sent to ' + USER_EMAIL + ' with further instructions.');
						User.findOne({ 'local.email': resetMock.email })
              .then(usr => {
                expect(usr.local.name).to.be.equals(USER_NAME);
                expect(usr.local.email).to.be.equals(USER_EMAIL);
                expect(usr.local.resetPasswordExpires).to.be.undefined;
                expect(usr.local.resetPasswordToken).to.be.undefined;

                expect(usr.validPassword(NEW_PASSWORD)).to.be.true;
                expect(usr.validPassword(USER_PASSWORD)).to.be.false;

                done();
              })
              .catch(err1 => {
                done(err1);
              });
					}
				});
			});

			afterEach(done => dropUserCollectionTestDb(done));
		});


		describe('---NO - token expired or not valid---', () => {
			beforeEach(done => registerUserTestDb(done));

			it('should catch 404 NOT FOUND, because the token is exprired', done => {
				const updateResetPwdMock = {
					newPassword : NEW_PASSWORD,
					emailToken : user.local.resetPasswordToken
				};

				User.findOne({ 'local.email': resetMock.email })
          .then(usr => {
            expect(usr.local.resetPasswordToken).to.be.not.undefined;
            usr.local.resetPasswordExpires =  Date.now() - 3600000; // - 1 hour
            return usr.save();
          })
          .then(savedUser => {
            getPartialPostRequest('/api/resetNewPassword')
              .set('XSRF-TOKEN', csrftoken)
              .send(updateResetPwdMock)
              .expect(404)
              .end((err, res) => {
                if (err) {
                  return done(err);
                } else {
                  expect(res.body.message).to.be.equals('No account with that token exists.');
                  done();
                }
              });
          })
          .catch(err => {
             done(err);
          });
			});


			it('should catch 404 NOT FOUND, because token is not valid', done => {
				const updateResetPwdMock = {
					newPassword : NEW_PASSWORD,
					emailToken : user.local.resetPasswordToken
				};

				User.findOne({ 'local.email': resetMock.email })
          .then(usr => {
            expect(usr.local.resetPasswordToken).to.be.not.undefined;
            usr.local.resetPasswordToken = 'random_wrong_token';
            return usr.save();
          })
          .then(savedUser => {
            getPartialPostRequest('/api/resetNewPassword')
              .set('XSRF-TOKEN', csrftoken)
              .send(updateResetPwdMock)
              .expect(404)
              .end((err, res) => {
                if (err) {
                  return done(err);
                } else {
                  expect(res.body.message).to.be.equals('No account with that token exists.');
                  done();
                }
              });
          })
          .catch(err => {
            done(err);
          });
			});

			afterEach(done => dropUserCollectionTestDb(done));
		});

		describe('---NO - Missing params---', () => {
			beforeEach(done => registerUserTestDb(done));

			const missingUpdatePwdMocks = [
				{newPassword : NEW_PASSWORD},
				{emailToken : 'random email token - valid or nor is not important here'},
				{}
			];

			//these are multiple tests that I'm expecting for all combinations
			//of wrong params
			for(let i = 0; i<missingUpdatePwdMocks.length; i++) {
				console.log(missingUpdatePwdMocks[i]);
				it('should get 400 BAD REQUEST, because password and emailToken are mandatory. Test i=' + i, done => {
					getPartialPostRequest('/api/resetNewPassword')
					.set('XSRF-TOKEN', csrftoken)
					.send(missingUpdatePwdMocks[i])
					.expect(400)
					.end((err, res) => {
						if (err) {
							return done(err);
						} else {
							expect(res.body.message).to.be.equals("Password and emailToken fields are required.");
							done(err);
						}
					});
				});
			}

			afterEach(done => dropUserCollectionTestDb(done));
		});

		describe('---ERRORS---', () => {
			it('should get 403 FORBIDDEN, because XSRF-TOKEN is not available', done => {
				getPartialPostRequest('/api/resetNewPassword')
				//XSRF-TOKEN NOT SETTED!!!!
				.send(resetMock)
				.expect(403)
				.end(() => done());
			});
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
