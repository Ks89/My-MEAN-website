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
var Promise = require('bluebird');
var mongoose = require('mongoose');
var connectMongoose = Promise.promisify(mongoose.connect, {context: mongoose});
var AuthUtil = require('../src/utils/auth-util');

require('../src/models/users');
var User = mongoose.model('User');

const FAKE = 'fake';
const WRONG_SERVICE_NAME = 'wrong';
const SERVICENAME_NOT_VALID = 'Service name not valid';
const SERVICENAME_MUSTBE_STRING = 'Service name must be a String';
const USER_MUSTBE_OBJECT = 'User must be a valid object';

describe('auth-util', () => {

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

  describe('#constructor()', () => {
    it('should create an object calling the constructor', () => {
      var authUtil = new AuthUtil();
      expect(authUtil).to.be.not.null;
      expect(authUtil).to.be.not.undefined;
    });
  });

	describe('#checkIfLastUnlink()', () => {
		describe('---YES---', () => {

			const userMocks = [
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'local', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} }
			];

			for(let i=0; i<userMocks.length; i++) {
				console.log("userMocks[" + i + "]", userMocks[i]);
				it('should return true, because it\'s a lastUnlink. Test i=' + i, done => {
					var lastUnlink = AuthUtil.checkIfLastUnlink(userMocks[i].serviceName, userMocks[i].user);
					expect(lastUnlink).to.be.true;
					done();
				});
			}
		});

		describe('---NO---', () => {

			const userWrongMocks = [
			{serviceName:'local', user: {local:{email:FAKE},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{id:FAKE},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'local', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },

			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{id:FAKE},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'github', user: {local:{email:FAKE},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'github', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },

			{serviceName:'google', user: {local:{},github:{id:FAKE},google:{id:FAKE},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'google', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'google', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'google', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },

			{serviceName:'facebook', user: {local:{},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'facebook', user: {local:{email:FAKE},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'facebook', user: {local:{email:FAKE},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'facebook', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },

			{serviceName:'twitter', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{id:FAKE}} },
			{serviceName:'twitter', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },
			{serviceName:'twitter', user: {local:{email:FAKE},github:{id:FAKE},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },
			{serviceName:'twitter', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },

			{serviceName:'linkedin', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'linkedin', user: {local:{email:FAKE},github:{id:FAKE},google:{id:FAKE},facebook:{id:FAKE},twitter:{id:FAKE},linkedin:{id:FAKE}} }
			];

			for(let i=0; i<userWrongMocks.length; i++) {
				console.log("userWrongMocks[" + i + "]", userWrongMocks[i]);
				it('should return false, because it\'s not a last unlink. Test i=' + i , done => {
					var lastUnlink = AuthUtil.checkIfLastUnlink(userWrongMocks[i].serviceName, userWrongMocks[i].user);
					expect(lastUnlink).to.be.false;
					done();
				});
			}

			it('should return false, because this serviceName is not recognized', done => {
				var lastUnlink = AuthUtil.checkIfLastUnlink(WRONG_SERVICE_NAME, {});
				expect(lastUnlink).to.be.false;
				done();
			});
		});

    describe('---ERRORS---', () => {
      it('should throw an exception, because user is not valid', () => {
        expect(()=>AuthUtil.checkIfLastUnlink('', null)).to.throw(USER_MUSTBE_OBJECT);
        expect(()=>AuthUtil.checkIfLastUnlink('', undefined)).to.throw(USER_MUSTBE_OBJECT);
			});

      it('should throw an exception, because serviceName must be a string', () => {
        expect(()=>AuthUtil.checkIfLastUnlink(null, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(undefined, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(-1, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(5, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(99, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(600, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(function(){}, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(()=>{}, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(/fooRegex/i, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink([], {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(new RegExp(/fooRegex/,'i'), {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(new RegExp('/fooRegex/','i'), {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(new Error(), {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(true, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(false, {})).to.throw(SERVICENAME_MUSTBE_STRING);
        expect(()=>AuthUtil.checkIfLastUnlink(new Array(), {})).to.throw(SERVICENAME_MUSTBE_STRING);
			});
    });
	});


	describe('#removeServiceFromUserDb()', () => {
		describe('---YES---', () => {

			const userMocks = [
			{serviceName:'local', user: {local:{email:FAKE},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{id:FAKE},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{id:FAKE},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{id:FAKE},twitter:{},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{},twitter:{id:FAKE},linkedin:{}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{id:FAKE}} },
			{serviceName:'local', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'google', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'facebook', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'twitter', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'linkedin', user: {local:{},github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'local', user: {github:{},google:{},facebook:{},twitter:{},linkedin:{}} },
			{serviceName:'github', user: {twitter:{},linkedin:{}} },
			{serviceName:'google', user: {linkedin:{}} },
			{serviceName:'local', user: {}}
			];

			for(let i=0; i<userMocks.length; i++) {
				console.log("userMocks[" + i + "]", userMocks[i]);
				it('should return true, because it removes the specified service. Test i=' + i, done => {
					var removed = AuthUtil.removeServiceFromUserDb(userMocks[i].serviceName, userMocks[i].user);
					console.log(removed);

					if(userMocks[i].serviceName !== 'local') expect(removed.local).to.be.equals(userMocks[i].user.local);
					if(userMocks[i].serviceName !== 'facebook') expect(removed.facebook).to.be.equals(userMocks[i].user.facebook);
					if(userMocks[i].serviceName !== 'google') expect(removed.google).to.be.equals(userMocks[i].user.google);
					if(userMocks[i].serviceName !== 'github') expect(removed.github).to.be.equals(userMocks[i].user.github);
					if(userMocks[i].serviceName !== 'twitter') expect(removed.twitter).to.be.equals(userMocks[i].user.twitter);
					if(userMocks[i].serviceName !== 'linkedin') expect(removed.linkedin).to.be.equals(userMocks[i].user.linkedin);

					expect(removed[userMocks[i].serviceName]).to.be.undefined;

					done();
				});
			}
		});


		describe('---ERRORS---', () => {

			it('should catch an exception, because serviceName is not valid', done => {
				expect(()=>AuthUtil.removeServiceFromUserDb("not_whitelisted", {})).to.throw(SERVICENAME_NOT_VALID);
				done();
			});

			it('should catch an exception, because user must be a valid object', done => {
				expect(()=>AuthUtil.removeServiceFromUserDb("github", "")).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", -2)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", -1)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", -0)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", 0)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", 1)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", 2)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", null)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", undefined)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", function(){})).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", ()=>{})).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", /fooRegex/i)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", [])).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", new Error())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", new RegExp(/fooRegex/,'i'))).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", new RegExp('/fooRegex/','i'))).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", new Date())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", new Array())).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", true)).to.throw(USER_MUSTBE_OBJECT);
				expect(()=>AuthUtil.removeServiceFromUserDb("github", false)).to.throw(USER_MUSTBE_OBJECT);
				done();
			});

			it('should catch an exception, because serviceName must be a string', done => {
				expect(()=>AuthUtil.removeServiceFromUserDb({}, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(-2, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(-1, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(-0, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(0, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(1, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(2, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(null, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(undefined, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(function(){}, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(()=>{}, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(/fooRegex/i, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb([], {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(new Error(), {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(new RegExp(/fooRegex/,'i'), {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(new RegExp('/fooRegex/','i'), {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(new Date(), {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(new Array(), {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(true, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				expect(()=>AuthUtil.removeServiceFromUserDb(false, {})).to.throw(SERVICENAME_MUSTBE_STRING);
				done();
			});
		});
	});

  after(done => {
    console.info("Disconnecting");
    mongoose.disconnect(() => {
      console.info(`Disconnected - test finished - connection size: ${mongoose.connections.length}`);
      done();
    });
  });
});
