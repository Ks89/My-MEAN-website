'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

let expect = require('chai').expect;
let app = require('../app');
let agent = require('supertest').agent(app);
let async = require('async');

const TestUtils = require('../test-util/utils');
let testUtils = new TestUtils(agent);

const TestUsersUtils = require('../test-util/users');
let testUsersUtils = new TestUsersUtils(testUtils);

require('../src/models/users');
let mongoose = require('mongoose');
// ------------------------
// as explained here http://mongoosejs.com/docs/promises.html
mongoose.Promise = require('bluebird');
// ------------------------
let User = mongoose.model('User');


const USER_NAME = 'fake user';
const USER_EMAIL = 'fake@email.com';
const USER_PASSWORD = 'fake';

const URL_LOGIN = '/api/login';
const URL_LOGOUT = '/api/logout';

// testing services
const URL_DESTROY_SESSION = '/api/testing/destroySession';
const URL_SET_STRING_SESSION = '/api/testing/setStringSession';
const URL_SET_JSON_WITHOUT_TOKEN_SESSION = '/api/testing/setJsonWithoutTokenSession';
const URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION = '/api/testing/setJsonWithWrongFormatTokenSession';
const URL_SET_JSON_WITH_EXPIRED_DATE_SESSION = '/api/testing/setJsonWithExpiredDateSession';


const loginMock = {
	email : USER_EMAIL,
	password : USER_PASSWORD
};


describe('rest-auth-middleware', () => {

	function insertUserTestDb(done) {
		let user = new User();
		user.local.name = USER_NAME;
		user.local.email = USER_EMAIL;
		user.setPassword(USER_PASSWORD);
		user.save()
			.then(usr => {
        user._id = usr._id;
        testUtils.updateCookiesAndTokens(done); //pass done, it's important!
			})
			.catch(err => {
        done(err);
			});
	}

	describe('#restAuthenticationMiddleware()', () => {
		describe('---YES---', () => {

			beforeEach(done => insertUserTestDb(done));

			it('should login', done => {
  			testUtils.getPartialPostRequest(URL_LOGIN)
  			.set('XSRF-TOKEN', testUtils.csrftoken)
  			.send(loginMock)
  			.expect(200)
  			.end((err, res) => {
          if (err) {
						return done(err);
					} else {
						expect(res.body.token).to.be.not.null;
						expect(res.body.token).to.be.not.undefined;
						done(err);
					}
        });
			});

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});

		describe('---ERRORS---', () => {
      const sessionModifierUrls = [
        {url: URL_DESTROY_SESSION, msg: 'No token provided', status: 403},
        {url: URL_SET_STRING_SESSION, msg: 'No token provided', status: 403},
        {url: URL_SET_JSON_WITHOUT_TOKEN_SESSION, msg: 'Token not found', status: 404},
        {url: URL_SET_JSON_WITH_WRONGFORMAT_TOKEN_SESSION, msg: 'Jwt not valid or corrupted', status: 401},
				{url: URL_SET_JSON_WITH_EXPIRED_DATE_SESSION, msg: 'Data is not valid', status: 404}
      ];
      for(let i=0; i<sessionModifierUrls.length; i++) {
        it(`should get 403 FORBIDDEN while calling a protected service
                (for instance, logout()), because you aren't authenticated.
                Test i=${i} with ${sessionModifierUrls[i]}`, done => {
  				async.waterfall([
  					asyncDone => {
  						testUtils.getPartialGetRequest(sessionModifierUrls[i].url)
  						.send()
  						.expect(200)
  						.end((err, res) => asyncDone(err, res));
  					},
  					(res, asyncDone) => {
  						testUtils.getPartialGetRequest(URL_LOGOUT)
  						.send()
  						.expect(sessionModifierUrls[i].status) // expected status
  						.end((err, res) => {
  							// session data is modified
  							// and the rest-auth-middleware blocks your call
                // returning a specific error message
  							expect(res.body.message).to.be.equals(sessionModifierUrls[i].msg);
  							asyncDone(err);
  						});
  					}], (err, response) => done(err));
  			});
      }

			afterEach(done => testUsersUtils.dropUserTestDbAndLogout(done));
		});
	});

  // after(() => {
  //   mongoose.disconnect();
  // });
});
