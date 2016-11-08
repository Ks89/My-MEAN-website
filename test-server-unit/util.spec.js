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

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var Utils = require('../src/utils/util');
var MockedRes = require('./mocked-res-class');
var mockedRes = new MockedRes();
var jwt = require('jsonwebtoken');

describe('util', () => {

  const NOT_VALID_DATE = 'Not a valid date';
  const NOT_VALID_DECODEDJWT = 'Not a valid decodedJwtToken';
  const NOT_VALID_TOKEN = 'Not a valid token';
  const CORRUPTED_TOKEN = 'Jwt not valid or corrupted';
  const EXPIRE_DATE_NOT_FOUND = 'Expire date not found';
  const NOT_FLOAT_EXP_DATE = 'Not a float expiration date';

  describe('#constructor()', () => {
    it('should create an object calling the constructor', () => {
      var utils = new Utils();
      expect(utils).to.be.not.null;
      expect(utils).to.be.not.undefined;
    });
  });

  describe('#sendJSONres()', () => {

    describe('---YES---', () => {
      it('should send a JSON response with content object and status 200', () => {
        const mockedObjContent = {
          prop1 : 'prop1',
          date1 : new Date(),
          obj1 : {
            message : 'random message'
          }
        };
        Utils.sendJSONres(mockedRes, 200, mockedObjContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(200);
        expect(mockedRes.getJson()).to.be.equals(mockedObjContent);
      });

      it('should send a JSON response with content object and status 200', () => {
        const mockedStringContent = 'string content';
        Utils.sendJSONres(mockedRes, 200, mockedStringContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(200);
        expect(mockedRes.getJson()).to.be.equals(mockedStringContent);
      });

      it('should send a JSON response with content object and status 300', () => {
        const mockedObjContent = {
          prop1 : 'prop1',
          date1 : new Date(),
          obj1 : {
            message : 'random message'
          }
        };
        Utils.sendJSONres(mockedRes, 300, mockedObjContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(300);
        expect(mockedRes.getJson()).to.be.equals(mockedObjContent);
      });

      it('should send a JSON response with content object and status 403', () => {
        const mockedObjContent = {
          prop1 : 'prop1',
          date1 : new Date(),
          obj1 : {
            message : 'random message'
          }
        };
        Utils.sendJSONres(mockedRes, 403, mockedObjContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(403);
        expect(mockedRes.getJson()).to.be.equals(mockedObjContent);
      });

      it('should send a JSON response with content string and status 403', () => {
        const mockedStringContent = 'string content';
        Utils.sendJSONres(mockedRes, 403, mockedStringContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(403);
        expect(mockedRes.getJson().message).to.be.equals(mockedStringContent);
      });

      it('should send a JSON response with content Array and status 403', () => {
        const mockedStringArrayContent = ['string content', 'string content2'];
        Utils.sendJSONres(mockedRes, 403, mockedStringArrayContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(403);
        expect(mockedRes.getJson().message).to.be.equals(mockedStringArrayContent);
      });

      it('should send a JSON response with content string and status 501', () => {
        const mockedStringContent = 'string content';
        Utils.sendJSONres(mockedRes, 501, mockedStringContent);
        expect(mockedRes).to.be.not.null;
        expect(mockedRes).to.be.not.undefined;
        expect(mockedRes.getContentType()).to.be.equals('application/json');
        expect(mockedRes.getStatus()).to.be.equals(501);
        expect(mockedRes.getJson().message).to.be.equals(mockedStringContent);
      });
    });
    describe('---ERROR---', () => {
      it('should catch -status must be a valid and positive number-', () => {
        const mockedStringContent = 'string content';
        const STATUS_NUMBER = 'Status must be a valid http status code  number';
        expect(()=>Utils.sendJSONres(mockedRes, "not a num", mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, undefined, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, null, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, -1, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, 5, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, 99, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, 600, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, " ", mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, function(){}, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, ()=>{}, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, /fooRegex/i, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, [], mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, new RegExp(/fooRegex/,'i'), mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, new RegExp('/fooRegex/','i'), mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, new Error(), mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, true, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, false, mockedStringContent)).to.throw(STATUS_NUMBER);
        expect(()=>Utils.sendJSONres(mockedRes, new Array(), mockedStringContent)).to.throw(STATUS_NUMBER);

      });

      it('should catch -content must be either String, or Array, or Object-', () => {
        const CONTENT_CHECK = 'Content must be either String, or Array, or Object (no Error, RegExp, and so on )';
        expect(()=>Utils.sendJSONres(mockedRes, 200, undefined)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, null)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, -1)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, 5)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, function(){})).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, ()=>{})).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, /fooRegex/i)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, new RegExp(/fooRegex/,'i'))).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, new RegExp('/fooRegex/','i'))).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, new Error())).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, true)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, false)).to.throw(CONTENT_CHECK);
        expect(()=>Utils.sendJSONres(mockedRes, 200, new Date())).to.throw(CONTENT_CHECK);
      });
    });
  });


  describe('#getTextFormattedDate()', () => {
    describe('---YES---', () => {
      it('should return the current formatted date as string', () => {
        const date = new Date();
        const day = date.getDay();
        const month = date.getMonth();
        const year = date.getFullYear();
        const hour = date.getHours();
        const min = date.getMinutes();
        const sec = date.getSeconds();

        const expected = day + "/" + month + "/" + year + " " + hour + ":" + min + ":" + sec;
        expect(Utils.getTextFormattedDate(date)).to.be.equal(expected);
      });

      it('should return the formatted date also for 1970', () => {
        const date = new Date(0);
        const day = date.getDay();
        const month = date.getMonth();
        const year = date.getFullYear();
        const hour = date.getHours();
        const min = date.getMinutes();
        const sec = date.getSeconds();

        const expected = day + "/" + month + "/" + year + " " + hour + ":" + min + ":" + sec;
        expect(Utils.getTextFormattedDate(date)).to.be.equal(expected);
      });
    });

    describe('---ERRORS---', () => {
      it('should catch -not a valid date- exception', () => {

        expect(() => Utils.getTextFormattedDate("not a date")).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(undefined)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(null)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate("undefined")).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate("null")).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(-1)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(1)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(" ")).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(function(){})).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(()=>{})).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(/fooRegex/i)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate([])).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(new Error())).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(new RegExp(/fooRegex/,'i'))).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(new RegExp('/fooRegex/','i'))).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(true)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(false)).to.throw(NOT_VALID_DATE);
        expect(() => Utils.getTextFormattedDate(new Array())).to.throw(NOT_VALID_DATE);
      });
    });
  });

  describe('#isJwtValidDate()', () => {
    var mockJwt, mockJwtNotFloat;
    var mockLocalUser;
    var dateExpire = new Date();

    before(() => {
      mockLocalUser = {
        email: 'fake@fake.com',
        name: 'fakeName',
        hash: 'fakeHash',
      };

      mockJwt = {
        _id : 'd435tergfg',
        user : mockLocalUser,
        exp : dateExpire
      };
    });

    function getJwtMockWithFloatDate (date) {
      mockJwt.exp = parseFloat(date.getTime()); //float date
      return mockJwt;
    }

    function getJwtMockNoFloatDate (date) {
      mockJwt.exp = date; //real date object, not a float
      return mockJwt;
    }

    describe('---YES---', () => {
      it('should return true, because jwt is valid', () => {
        //valid for 10 minutes (10*60*1000)
        dateExpire.setTime(dateExpire.getTime() + 600000);
        expect(Utils.isJwtValidDate(getJwtMockWithFloatDate(dateExpire))).to.equal(true);
      });
    });

    describe('---NO---', () => {
      it('should return false, because jwt is expired', () => {
        //invalid because expired 10 minutes ago (10*60*1000)
        dateExpire.setTime(dateExpire.getTime() - 600000);
        expect(Utils.isJwtValidDate(getJwtMockWithFloatDate(dateExpire))).to.equal(false);
      });

      it('should return false, because jwt is expired exactly in this moment', () => {
        //invalid because expired 0 seconds ago
        dateExpire.setTime(dateExpire.getTime());
        expect(Utils.isJwtValidDate(getJwtMockWithFloatDate(dateExpire))).to.equal(false);
      });
    });

    describe('---ERRORS---', () => {
      it('should catch -not a float expiration date- exception', () => {
        //date must be a float into the jwt token and not a Date's object
        expect(() => Utils.isJwtValidDate(getJwtMockNoFloatDate(dateExpire))).to.throw(NOT_FLOAT_EXP_DATE);
        //TODO FIXME improve adding other test, to be sure that it will work also
        //passing null, undefined and so on :)
        //I know that it won't work :( -> update Utils.js
      });

      it('should catch -not a valid decodedJwtToken- exception', () => {
        //invalid token
        expect(() => Utils.isJwtValidDate(undefined)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(null)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(-5)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(-1)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(-0)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(0)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(1)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(2)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate("")).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate("undefined")).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate("null")).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(" ")).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(function(){})).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(()=>{})).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate([])).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(new Error())).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(/fooRegex/i)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(new RegExp(/fooRegex/,'i'))).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(new RegExp('/fooRegex/','i'))).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(new Array())).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(true)).to.throw(NOT_VALID_DECODEDJWT);
        expect(() => Utils.isJwtValidDate(false)).to.throw(NOT_VALID_DECODEDJWT);
      });

      it('should catch -expire date not found- exceptions', () => {
        //expire date not found into decodedJwtToken
        delete mockJwt.exp;
        expect(() => Utils.isJwtValidDate(mockJwt)).to.throw(EXPIRE_DATE_NOT_FOUND);
      });
    });
  });

  describe('#isJwtValid()', () => {
    var mockLocalUser;
    var getMockJwtString;

    before(() => {
      mockLocalUser = {
        local: {
          hash: "$2a$10$hHCcxNQmzzNCecReX1Rbeu5PJCosbjITXA1x./feykYcI2JW3npTW",
          email: 'fake@fake.com',
          name: 'fake name'
        }
      };

      getMockJwtString = function (expiryDate) {
        return jwt.sign({
          user: mockLocalUser,
          exp: parseFloat(expiryDate.getTime()),
        }, process.env.JWT_SECRET);
      }
    });

    describe('---YES---', () => {
      it('should return the result, because jwt is valid', done => {
        var expiry = new Date();
        expiry.setTime(expiry.getTime() + 600000);
        Utils.isJwtValid(getMockJwtString(expiry))
        .then(function(result) {
          console.log("IsJwtValid result");
          expect(result.user.local.name).to.be.equals(mockLocalUser.local.name);
          expect(result.user.local.email).to.be.equals(mockLocalUser.local.email);
          expect(result.user.local.hash).to.be.equals(mockLocalUser.local.hash);
          done();
        }, function(reason) {
          console.log("IsJwtValid error");
          expect(true).to.be.false; //XD
          done();
        });
      });
    });

    describe('---NO---', () => {
      it('should return an error message, because jwt is expired', done => {
        //invalid because expired 10 minutes ago (10*60*1000)
        var expiry = new Date();
        expiry.setTime(expiry.getTime() - 600000);
        Utils.isJwtValid(getMockJwtString(expiry))
        .then(function(result) {
          expect(true).to.be.false; //XD
          done();
        }, function(reason) {
          console.log("IsJwtValid error");
          expect(reason.status).to.be.equals(401);
          expect(reason.message).to.be.equals("Token Session expired (date).");
          done();
        });
      });

      it('should return an error message, because jwt is expired exactly in this moment', done => {
        //invalid because expired 0 seconds ago
        var expiry = new Date();
        expiry.setTime(expiry.getTime());
        Utils.isJwtValid(getMockJwtString(expiry))
        .then(function(result) {
          expect(true).to.be.false; //XD
          done();
        }, function(reason) {
          console.log("IsJwtValid error");
          expect(reason.status).to.be.equals(401);
          expect(reason.message).to.be.equals("Token Session expired (date).");
          done();
        });
      });

      const mockJwts = ["undefined", "null", " ", "random value"];

      for(let i=0; i<mockJwts.length; i++) {
        console.log("mockJwts[" + i + "]: " + mockJwts[i]);
        it('should return an error message, because jwt is an invalid String. Test i= ' + i, done => {
          Utils.isJwtValid(mockJwts[i])
          .then(function(result) {
            expect(true).to.be.false; //XD
            done();
          }, function(reason) {
            console.log("IsJwtValid error");
            expect(reason.status).to.be.equals(401);
            expect(reason.message).to.be.equals(CORRUPTED_TOKEN);
            done();
          });
        });
      }
    });

    describe('---ERRORS---', () => {

      it('should return an exception, because jwt is not valid', done => {

        expect(() => Utils.isJwtValid(undefined)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(null)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(-2)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(-1)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(-0)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(0)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(1)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(2)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid("")).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(function(){})).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(()=>{})).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(/fooRegex/i)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid([])).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(new Error())).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(new RegExp(/fooRegex/,'i'))).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(new RegExp('/fooRegex/','i'))).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(true)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(false)).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(new Date())).to.throw(NOT_VALID_TOKEN);
        expect(() => Utils.isJwtValid(new Array())).to.throw(NOT_VALID_TOKEN);
        done();
      });
    });
  });

  describe('#isNotAcceptableValue()', () => {
    describe('---YES---', () => {
      it('should return true', () => {
        expect(Utils.isNotAcceptableValue(undefined)).to.be.true;
        expect(Utils.isNotAcceptableValue(null)).to.be.true;
        expect(Utils.isNotAcceptableValue(NaN)).to.be.true;
        expect(Utils.isNotAcceptableValue(function(){})).to.be.true;
        expect(Utils.isNotAcceptableValue(()=>{})).to.be.true;
        expect(Utils.isNotAcceptableValue(/fooRegex/i)).to.be.true;
        expect(Utils.isNotAcceptableValue(new RegExp(/fooRegex/,'i'))).to.be.true;
        expect(Utils.isNotAcceptableValue(new RegExp('/fooRegex/','i'))).to.be.true;
        expect(Utils.isNotAcceptableValue(new Error())).to.be.true;

        expect(Utils.isNotAcceptableValue(-1)).to.be.false;
        expect(Utils.isNotAcceptableValue(-0)).to.be.false;
        expect(Utils.isNotAcceptableValue(0)).to.be.false;
        expect(Utils.isNotAcceptableValue(1)).to.be.false;
        expect(Utils.isNotAcceptableValue("")).to.be.false;
        expect(Utils.isNotAcceptableValue([])).to.be.false;
        expect(Utils.isNotAcceptableValue(true)).to.be.false;
        expect(Utils.isNotAcceptableValue(false)).to.be.false;
        expect(Utils.isNotAcceptableValue(new Date())).to.be.false;
        expect(Utils.isNotAcceptableValue(new Array())).to.be.false;
      });
    });
  });

  describe('#isAcceptableValue()', () => {
    describe('---YES---', () => {
      it('should return true', () => {
        expect(Utils.isAcceptableValue(undefined)).to.be.false;
        expect(Utils.isAcceptableValue(null)).to.be.false;
        expect(Utils.isAcceptableValue(NaN)).to.be.false;
        expect(Utils.isAcceptableValue(function(){})).to.be.false;
        expect(Utils.isAcceptableValue(()=>{})).to.be.false;
        expect(Utils.isAcceptableValue(/fooRegex/i)).to.be.false;
        expect(Utils.isAcceptableValue(new RegExp(/fooRegex/,'i'))).to.be.false;
        expect(Utils.isAcceptableValue(new RegExp('/fooRegex/','i'))).to.be.false;
        expect(Utils.isAcceptableValue(new Error())).to.be.false;

        expect(Utils.isAcceptableValue(-1)).to.be.true;
        expect(Utils.isAcceptableValue(-0)).to.be.true;
        expect(Utils.isAcceptableValue(0)).to.be.true;
        expect(Utils.isAcceptableValue(1)).to.be.true;
        expect(Utils.isAcceptableValue("")).to.be.true;
        expect(Utils.isAcceptableValue([])).to.be.true;
        expect(Utils.isAcceptableValue(true)).to.be.true;
        expect(Utils.isAcceptableValue(false)).to.be.true;
        expect(Utils.isAcceptableValue(new Date())).to.be.true;
        expect(Utils.isAcceptableValue(new Array())).to.be.true;
      });
    });
  });
});
