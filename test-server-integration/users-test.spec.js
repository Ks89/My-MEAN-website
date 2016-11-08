'use strict';
process.env.NODE_ENV = 'test'; //before every other instruction

var expect = require('chai').expect;
var app = require('../app');
var agent = require('supertest').agent(app);

require('../src/models/users');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var user;

const URL_SINGLE_USER = '/api/users/';

describe('users', () => {

	function dropUserCollectionTestDb(done) {
		User.remove({}, err => done(err));
	}

	function getPartialGetRequest (apiUrl) {
		return agent
			.get(apiUrl)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json');
	}

	describe('---YES---', () => {

		before(done => {
			user = new User();
			user.local.name = 'username';
			user.local.email = 'email@email.it';
			user.setPassword('Password1');
			user.local.activateAccountToken = 'TOKEN';
    		user.local.activateAccountExpires =  new Date(Date.now() + 24*3600*1000); // 1 hour
    		user.local.resetPasswordToken = 'TOKEN';
    		user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    		user.github.id = '1231232';
    		user.github.token = 'TOKEN';
    		user.github.email = 'email@email.it';
    		user.github.name = 'username';
    		user.github.username = 'username';
    		user.github.profileUrl = 'http://fakeprofileurl.com/myprofile';
    		user.profile = {
		      	name : 'username',
		      	surname : 'username',
		      	nickname : 'username',
		      	email : 'email@email.it',
		      	updated : new Date(),
		      	visible : true
    		}

      		user.save((err, prj) => {
		      	user._id = prj._id;
		      	done(err);
		      });
  		});

		it('should correctly get a single user by its id', done => {
			getPartialGetRequest(URL_SINGLE_USER + user._id)
			.expect(200)
			.end((err, res) => {
				if (err) {
					return done(err);
				} else {
					let usr = res.body;
					expect(usr).to.be.not.null;
					expect(usr).to.be.not.undefined;

					expect(usr.local.name).to.be.equals(user.local.name);
					expect(usr.local.email).to.be.equals(user.local.email);
					expect(usr.local.hash).to.be.equals(user.local.hash);
					expect(usr.local.activateAccountToken).to.be.equals(user.local.activateAccountToken);
					//    expect(usr.local.activateAccountExpires).to.be.equals(user.local.activateAccountExpires);
					expect(usr.local.resetPasswordToken).to.be.equals(user.local.resetPasswordToken);
					//    expect(usr.local.resetPasswordExpires).to.be.equals(user.local.resetPasswordExpires);
					expect(usr.github.id).to.be.equals(user.github.id);
					expect(usr.github.token).to.be.equals(user.github.token);
					expect(usr.github.email).to.be.equals(user.github.email);
					expect(usr.github.name).to.be.equals(user.github.name);
					expect(usr.github.username).to.be.equals(user.github.username);
					expect(usr.github.profileUrl).to.be.equals(user.github.profileUrl);
					expect(usr.profile.name).to.be.equals(user.profile.name);
					expect(usr.profile.surname).to.be.equals(user.profile.surname);
					expect(usr.profile.nickname).to.be.equals(user.profile.nickname);
					expect(usr.profile.email).to.be.equals(user.profile.email);
					// expect(usr.profile.updated).to.be.equals(user.profile.updated);
					expect(usr.profile.visible).to.be.equals(user.profile.visible);

					done();
				}
			});
		});

		after(done => dropUserCollectionTestDb(done));
	});


	describe('---ERRORS---', () => {
		//here there are some test with empty user, because I destroyed the db
		//in the afterEach above.

		it('should catch 404 not found and check the error message', done => {
			getPartialGetRequest(URL_SINGLE_USER + 'fakeId')
			.expect(404)
			.end((err, res) => {
				if (err) {
					return done(err);
				} else {
					expect(res.body).to.be.not.null;
					expect(res.body).to.be.not.undefined;
					expect(res.body.message).to.be.equals('User not found');
					done();
				}
			});
		});
	});
});
