#!/usr/bin/env bash

echo "Before install - OS is $TRAVIS_OS_NAME"

echo "Updating both homebrew, mongodb and redis-server"
if [[ $TRAVIS_OS_NAME = 'osx' ]]; then
    echo "Updating homebrew"
	brew update
	echo "Installing and starting mongodb"
    brew install mongodb
    # create a folder for mongodb to prevent an error on mac osx
    sudo mkdir -p /data/db
    brew services start mongodb
    echo "Installing and starting redis-server"
    brew install redis
    brew services start redis
fi

echo "Exporting env variables dependencies"
# in this project, all env variables are the same for both linux and osx
echo "Exporting env variables - OS is $TRAVIS_OS_NAME"
export NODE_ENV=test
export CI=yes
export MONGODB_URI=mongodb://localhost/KS
export MONGODB_TESTING_URI=mongodb://localhost/test-db
export JWT_SECRET=faketestjwt
export TWITTER_CONSUMER_KEY=consumerkey
export TWITTER_CONSUMER_SECRET=consumersecret
export TWITTER_CALLBACK_URL=http://127.0.0.1:3000/api/auth/twitter/callback
export TWITTER_PROFILE_URL=https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true
export FACEBOOK_APP_ID=appid
export FACEBOOK_APP_SECRET=appsecret
export FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
export GOOGLE_CLIENT_ID=clientid
export GOOGLE_CLIENT_SECRET=clientsecret
export GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
export GITHUB_CLIENT_ID=clientid
export GITHUB_CLIENT_SECRET=clientsecret
export GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
export LINKEDIN_CLIENT_ID=clientid
export LINKEDIN_CLIENT_SECRET=clientsecret
export LINKEDIN_CALLBACK_URL=http://localhost:3000/api/auth/linkedin/callback
export USER_EMAIL=fake@fake.it
export PASS_EMAIL=fakepasswordemail
export RECAPTCHA_PUBLIC=recaptchapublic
export RECAPTCHA_SECRET=recaptchasecret
echo "NODE_ENV = $NODE_ENV"
echo "CI = $CI"
echo "MONGODB_URI = $MONGODB_URI"
echo "MONGODB_TESTING_URI = $MONGODB_TESTING_URI"
echo "JWT_SECRET = $JWT_SECRET"
echo "TWITTER_CONSUMER_KEY = $TWITTER_CONSUMER_KEY"
echo "TWITTER_CONSUMER_SECRET = $TWITTER_CONSUMER_SECRET"
echo "TWITTER_CALLBACK_URL = $TWITTER_CALLBACK_URL"
echo "TWITTER_PROFILE_URL = $TWITTER_PROFILE_URL"
echo "FACEBOOK_APP_ID = $FACEBOOK_APP_ID"
echo "FACEBOOK_APP_SECRET = $FACEBOOK_APP_SECRET"
echo "FACEBOOK_CALLBACK_URL = $FACEBOOK_CALLBACK_URL"
echo "GOOGLE_CLIENT_ID = $GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET = $GOOGLE_CLIENT_SECRET"
echo "GOOGLE_CALLBACK_URL = $GOOGLE_CALLBACK_URL"
echo "GITHUB_CLIENT_ID = $GITHUB_CLIENT_ID"
echo "GITHUB_CLIENT_SECRET = $GITHUB_CLIENT_SECRET"
echo "GITHUB_CALLBACK_URL = $GITHUB_CALLBACK_URL"
echo "LINKEDIN_CLIENT_ID = $LINKEDIN_CLIENT_ID"
echo "LINKEDIN_CLIENT_SECRET = $LINKEDIN_CLIENT_SECRET"
echo "LINKEDIN_CALLBACK_URL = $LINKEDIN_CALLBACK_URL"
echo "USER_EMAIL = $USER_EMAIL"
echo "PASS_EMAIL = $PASS_EMAIL"
echo "RECAPTCHA_PUBLIC = $RECAPTCHA_PUBLIC"
echo "RECAPTCHA_SECRET = $RECAPTCHA_SECRET"


echo "Installing global dependencies"
# install global dependencies
if [[ $TRAVIS_OS_NAME = 'osx' ]]; then
    echo "Installing $TRAVIS_OS_NAME global dependencies"
    sudo npm install -g codeclimate-test-reporter
    sudo npm install -g pm2
else
    echo "Installing $TRAVIS_OS_NAME global dependencies"
    npm install -g codeclimate-test-reporter
    npm install -g pm2
fi
