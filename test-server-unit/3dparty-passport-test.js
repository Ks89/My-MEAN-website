'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

//to be able to use generateJwt I must import
//dotenv (otherwise I cannot read process.env with the encryption key)
require('dotenv').config();

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var _und = require('underscore');
var rewire = require('rewire');

var User;
var mongoose = require('mongoose');
require('../app_server/models/users');

mongoose.connect('mongodb://localhost/test-db');
User = mongoose.model('User');

var userDb;

var util = require('../app_server/utils/util');
var serviceNames = require('../app_server/controllers/authentication/serviceNames');

var MockedRes = require('./mocked-res-class');
var mockedRes = new MockedRes();
//add session property to the mocked object
mockedRes.session = {
	authToken : null
};

//rewire to call functions using _get_
var thirdParty = rewire('../app_server/controllers/authentication/3dparty/3dparty-passport');

const USERNAME = 'username';
const EMAIL = 'email@email.it';
const PASSWORD = 'Password1';
const TOKEN = 'random_fake_token';
const ID_POSTFIX = ' id';
const NAME = 'name';
const URL = 'http//fakeprofileurl.com/myprofile';
const PROFILENAME1 = 'name 1';
const PROFILESURNAME1 = 'surname 1';
const PROFILENICKNAME1 = 'nickname 1';
const PROFILEEMAIL1 = 'email 1';
const PROFILEVISIBLE1 = true;
const PROFILENAME2 = 'name 2';
const PROFILESURNAME2 = 'surname 2';
const PROFILENICKNAME2 = 'nickname 2';
const PROFILEEMAIL2 = 'email 2';
const PROFILEVISIBLE2 = true;
const PROFILEDATE = new Date();

const profileMock = {
  id: 'id',
  displayName: NAME,
  username: USERNAME,
  name : {
    familyName : NAME,
    givenName : NAME
  },
  profileUrl: URL,
  emails: [ { value: EMAIL } ],
  provider: 'random value',
};

const USER_NOT_AN_OBJECT = "impossible to update because user must be an object";
const PROFILE_NOT_AN_OBJECT = "impossible to update because profile must be an object";
const MUST_BE_STRINGS = "impossible to update because both serviceName and accessToken must be strings";
const SERVICENAME_NOT_RECOGNIZED = "impossible to update because serviceName is not recognized";

describe('3dparty-passport', () => {

	describe('#updateUser()', () => {

		function addUserByServiceName(newUser, serviceName) {
			newUser[serviceName].id = serviceName + ID_POSTFIX;
	    newUser[serviceName].token = TOKEN;
	    newUser[serviceName].email = EMAIL;
	    newUser[serviceName].name  = NAME;
	    // other cases
	    switch(serviceName) {
	      case 'facebook':
	        newUser[serviceName].profileUrl = URL;
					break;
	      case 'github':
	        newUser[serviceName].username = USERNAME;
	        newUser[serviceName].profileUrl = URL;
					break;
	      case 'twitter':
	        newUser[serviceName].username  = USERNAME;
					break;
	    }
		}

		function addProfile(newUser, profileType) {
			//if profileType === 0 => don't add anything
			if(profileType === 1) {
				newUser.profile = {
					name : PROFILENAME1,
					surname : PROFILESURNAME1,
					nickname : PROFILENICKNAME1,
					email : PROFILEEMAIL1,
					updated : PROFILEDATE,
					visible : PROFILEVISIBLE1
				};
			} else if(profileType === 2) {
				newUser.profile = {
					name : PROFILENAME2,
					surname : PROFILESURNAME2,
					nickname : PROFILENICKNAME2,
					email : PROFILEEMAIL2,
					updated : PROFILEDATE,
					visible : PROFILEVISIBLE2
				};
			}
		}

		function getUser(profileType) {
			var newUser = new User();
			//if profileType === 0 => don't add anything
			if(profileType !== 0) {
				addProfile(newUser, profileType);
			}
			return newUser;
		}

		describe('---YES---', () => {

			beforeEach(done => User.remove({}, err => done(err)));

			it('should update an empty object with profile infos after the 3dparty login.', done => {
        // Overwrite the private a1 function with the mock.
        var updateFunct = thirdParty.__get__('updateUser');

        let userGithub = updateFunct(getUser(1), TOKEN, profileMock, 'github');
        let userGoogle = updateFunct(getUser(1), TOKEN, profileMock, 'google');
        let userFacebook = updateFunct(getUser(1), TOKEN, profileMock, 'facebook');
        let userTwitter = updateFunct(getUser(1), TOKEN, profileMock, 'twitter');
        let userLinkedin = updateFunct(getUser(1), TOKEN, profileMock, 'linkedin');

        expect(userGithub.github.email).to.be.equals(EMAIL);
        expect(userGithub.github.profileUrl).to.be.equals(URL);
        expect(userGithub.github.username).to.be.equals(USERNAME);
        expect(userGithub.github.name).to.be.equals(NAME);
        expect(userGithub.github.token).to.be.equals(TOKEN);
        expect(userGithub.github.id).to.be.equals('id');

        expect(userGoogle.google.email).to.be.equals(EMAIL);
        expect(userGoogle.google.name).to.be.equals(NAME);
        expect(userGoogle.google.token).to.be.equals(TOKEN);
        expect(userGoogle.google.id).to.be.equals('id');

        expect(userFacebook.facebook.email).to.be.equals(EMAIL);
        expect(userFacebook.facebook.profileUrl).to.be.equals(URL);
        expect(userFacebook.facebook.name).to.be.equals(NAME + ' ' + NAME);
        expect(userFacebook.facebook.token).to.be.equals(TOKEN);
        expect(userFacebook.facebook.id).to.be.equals('id');

        expect(userTwitter.twitter.email).to.be.equals(EMAIL);
        expect(userTwitter.twitter.username).to.be.equals(USERNAME);
        expect(userTwitter.twitter.name).to.be.equals(NAME);
        expect(userTwitter.twitter.token).to.be.equals(TOKEN);
        expect(userTwitter.twitter.id).to.be.equals('id');

        expect(userLinkedin.linkedin.email).to.be.equals(EMAIL);
        expect(userLinkedin.linkedin.name).to.be.equals(NAME + ' ' + NAME);
        expect(userLinkedin.linkedin.token).to.be.equals(TOKEN);
        expect(userLinkedin.linkedin.id).to.be.equals('id');

        done();
			});

      it('should update an empty object with twitter profile without email after the 3dparty login.', done => {
        // Overwrite the private a1 function with the mock.
        var updateFunct = thirdParty.__get__('updateUser');
        //remove profileMock's email
        profileMock.emails = undefined;

        let userTwitter = updateFunct(getUser(0), TOKEN, profileMock, 'twitter');

        expect(userTwitter.twitter.email).to.be.undefined;
        expect(userTwitter.twitter.username).to.be.equals(USERNAME);
        expect(userTwitter.twitter.name).to.be.equals(NAME);
        expect(userTwitter.twitter.token).to.be.equals(TOKEN);
        expect(userTwitter.twitter.id).to.be.equals('id');

        done();
			});
		});

    describe('---ERRORS---', () => {
      var updateFunct = thirdParty.__get__('updateUser')

			it('should catch an exception, because user must be an object.', done => {
        expect(()=>updateFunct(null, TOKEN, profileMock, 'any_string')).to.throw(USER_NOT_AN_OBJECT);
        done();
			});

      it('should catch an exception, because profile must be an object.', done => {
        expect(()=>updateFunct(getUser(0), TOKEN, null, 'any_string')).to.throw(PROFILE_NOT_AN_OBJECT);
        done();
			});

      it('should catch an exception, because both accessToken and serviceName must be strings.', done => {
        expect(()=>updateFunct(getUser(0), null, profileMock, null)).to.throw(MUST_BE_STRINGS);
        expect(()=>updateFunct(getUser(0), null, profileMock, 'any_string')).to.throw(MUST_BE_STRINGS);
        expect(()=>updateFunct(getUser(0), TOKEN, profileMock, null)).to.throw(MUST_BE_STRINGS);
        done();
      });

      it('should catch an exception, because serviceName isn\'t recogized.', done => {
        expect(()=>updateFunct(getUser(0), TOKEN, profileMock, 'fake_not_recognized')).to.throw(SERVICENAME_NOT_RECOGNIZED);
        done();
      });
		});
	});
});

after(done => User.remove({}, err => done(err)));