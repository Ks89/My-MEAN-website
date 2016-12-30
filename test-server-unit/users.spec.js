'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

console.log("Starting with NODE_ENV=" + process.env.NODE_ENV);
console.log("process.env.CI is " + process.env.CI);

if(!process.env.CI || process.env.CI !== 'yes') {
  console.log("Initializing dotenv (requires .env file)")
	//to be able to use generateJwt I must import
	//dotenv (otherwise I cannot read process.env with the encryption key)
	require('dotenv').config();
}

var expect = require('chai').expect;
var jwt = require('jsonwebtoken');
var Promise = require('bluebird');
var mongoose = require('mongoose');
var connectMongoose = Promise.promisify(mongoose.connect, {context: mongoose});

require('../src/models/users');
var User = mongoose.model('User');

describe('users model', () => {

  before(done => {
    //Connection ready state: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connections[0] && mongoose.connections[0]._readyState !== 0) {
      console.log("readyState: " + mongoose.connections[0]._readyState);
      console.log("----------------- already connected");
      done();
    } else {
      connectMongoose('mongodb://localhost/test-db', mongoose)
      .then(() => {
        console.log(`----------------- connection created - connections size: ${mongoose.connections.length}`);
        done();
      });
    }
  });

	const USERNAME = 'username';
	const EMAIL = 'email@email.it';
	const PASSWORD = 'Password1';

	function getCorrectNewUser() {
		var newUser = new User();
		newUser.local.name = USERNAME;
		newUser.local.email = EMAIL;
		newUser.setPassword(PASSWORD);
		return newUser;
	}

	describe('#setPassword()', () => {

		const NOT_VALID_PASSWORD_FORMAT = 'not a valid password format';

		describe('---YES---', () => {
			it('should create a user and verify it with a correct password', done => {
				var newUser = new User();
				newUser.setPassword(PASSWORD);
				newUser.save((err, savedUser) => {
					expect(err).to.be.null;
					expect(savedUser.validPassword(PASSWORD)).to.be.true;
					done(err);
				});
			});
		});

		describe('---ERRORS---', () => {
			it('should catch -not a valid password format- exception', done => {
				var newUser = new User();
				expect(() => newUser.setPassword(new Date())).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(undefined)).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(null)).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(-1)).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(1)).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(function(){})).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(()=>{})).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(/fooRegex/i)).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(new RegExp(/fooRegex/,'i'))).to.throw(NOT_VALID_PASSWORD_FORMAT);
				expect(() => newUser.setPassword(new RegExp('/fooRegex/','i'))).to.throw(NOT_VALID_PASSWORD_FORMAT);
				done();
			});
		});

	});

	describe('#validPassword()', () => {
		describe('---YES---', () => {
			it('should create a user and verify it with a correct password', done => {
				var newUser = getCorrectNewUser();
				newUser.save((err, savedUser) => {
					expect(err).to.be.null;
					expect(savedUser.local.name).to.be.equals(USERNAME);
					expect(savedUser.local.email).to.be.equals(EMAIL);
					expect(savedUser.validPassword(PASSWORD)).to.be.true;
					done(err);
				});
			});
		});

		describe('---NO---', () => {
			it('should create a user and verify it with a wrong password', done => {
				var newUser = getCorrectNewUser();
				newUser.save((err, savedUser) => {
					expect(err).to.be.null;
					expect(savedUser.local.name).to.be.equals(USERNAME);
					expect(savedUser.local.email).to.be.equals(EMAIL);
					expect(savedUser.validPassword('wrong password')).to.be.false;
					done(err);
				});
			});
		});
	});


	describe('#generateJwt()', () => {
		describe('---YES---', () => {
			it('should generate a valid JWT', done => {
				let newUser = getCorrectNewUser();
				const jasonWebToken = newUser.generateJwt();
				expect(jasonWebToken).is.not.null;
				jwt.verify(jasonWebToken, process.env.JWT_SECRET, (err, decoded) => {
					expect(err).is.null;
					expect(decoded).is.not.null;
					expect(decoded.user).is.not.null;
					expect(decoded.user.local).is.not.null;
					expect(decoded.user.local.name).to.be.equals(USERNAME);
					expect(decoded.user.local.email).to.be.equals(EMAIL);
					done(err);
				});
			});

			it('should generate a valid JWT with the correct filtered user', done => {
				var newUser = getCompleteUser();
				const jsonWebToken = newUser.generateJwt();
				expect(jsonWebToken).to.be.not.null;
				jwt.verify(jsonWebToken, process.env.JWT_SECRET, (err, decoded) => {
					expectValidCompleteUserJwt(err, decoded, newUser._id+'');
					done(err);
				});
			});
		});
	});

	describe('#generateSessionJwtToken()', () => {
		describe('---YES---', () => {
			it('should generate a valid session\'s JWT token stored on Redis Server', done => {
				let newUser = getCorrectNewUser();
				const jasonWebToken = newUser.generateSessionJwtToken();
				expect(jasonWebToken).is.not.null;
				jwt.verify(jasonWebToken, process.env.JWT_SECRET, (err, decoded) => {
					expectValidUserJwt(err, decoded);
					done(err);
				});
			});

			it('should generate a valid JWT with the correct filtered user', done => {
				var newUser = getCompleteUser();
				const jsonWebToken = newUser.generateSessionJwtToken();
				expect(jsonWebToken).to.be.not.null;
				jwt.verify(jsonWebToken, process.env.JWT_SECRET, (err, decoded) => {
					expectValidCompleteUserJwt(err, decoded, newUser._id+'');
					done(err);
				});
			});
		});
	});

	function getCompleteUser() {
		var newUser = new User();
		newUser.local.name = USERNAME;
		newUser.local.email = EMAIL;
		newUser.setPassword(PASSWORD);
		newUser.local.activateAccountToken = 'TOKEN';
		newUser.local.activateAccountExpires =  new Date(Date.now() + 24*3600*1000); // 1 hour
		newUser.local.resetPasswordToken = 'TOKEN';
		newUser.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
		newUser.github.id = '1231232';
		newUser.github.token = 'TOKEN';
		newUser.github.email = EMAIL;
		newUser.github.name = USERNAME;
		newUser.github.username = USERNAME;
		newUser.github.profileUrl = 'http://fakeprofileurl.com/myprofile';
		newUser.profile = {
			name : USERNAME,
			surname : USERNAME,
			nickname : USERNAME,
			email : EMAIL,
			updated : new Date(),
			visible : true
		}
		return newUser;
	}

	function expectValidUserJwt(err, decoded) {
		expect(err).is.null;
		expect(decoded).is.not.null;
		expect(decoded.user).is.not.null;
		expect(decoded.user.local).is.not.null;
		expect(decoded.user.local.name).to.be.equals(USERNAME);
		expect(decoded.user.local.email).to.be.equals(EMAIL);
	}

	function expectValidCompleteUserJwt(err, decoded, newUserId) {
		expect(err).to.be.null;
		expect(decoded).to.be.not.null;
		expect(decoded.user).to.be.not.null;
		expect(decoded.user._id).to.be.equals(newUserId);
		expect(decoded.user.__v).to.be.undefined;
		expect(decoded.user.local).to.be.not.null;
		expect(decoded.user.local.name).to.be.equals(USERNAME);
		expect(decoded.user.local.email).to.be.equals(EMAIL);
		expect(decoded.user.local.hash).to.be.undefined;
		expect(decoded.user.local.activateAccountToken).to.be.undefined;
		expect(decoded.user.local.activateAccountExpires).to.be.undefined;
		expect(decoded.user.local.resetPasswordToken).to.be.undefined;
		expect(decoded.user.local.resetPasswordExpires).to.be.undefined;

		expect(decoded.user.github.id).to.be.equals('1231232');
		expect(decoded.user.github.token).to.be.undefined;
		expect(decoded.user.github.email).to.be.equals(EMAIL);
		expect(decoded.user.github.name).to.be.equals(USERNAME);
		expect(decoded.user.github.username).to.be.undefined;
		expect(decoded.user.github.profileUrl).to.be.undefined;

		expect(decoded.user.profile.name).to.be.equals(USERNAME);
		expect(decoded.user.profile.surname).to.be.equals(USERNAME);
		expect(decoded.user.profile.nickname).to.be.equals(USERNAME);
		expect(decoded.user.profile.email).to.be.equals(EMAIL);
		expect(decoded.user.profile.updated).to.be.undefined;
		expect(decoded.user.profile.visible).to.be.true;
	}

  after(done => {
    console.info("Disconnecting");
    mongoose.disconnect(() => {
      console.info(`Disconnected - test finished - connection size: ${mongoose.connections.length}`);
      done();
    });
  });

});