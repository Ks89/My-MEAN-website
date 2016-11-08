#!/bin/bash

#ONLY FOR Windows
#DON'T EXECUTE THIS - BUT USE install-windows.sh

read -p "Would you install npm global packages? Press y or n: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo installing npm global packages (also windows-build-tools and node-gyp)
  npm install -g --production windows-build-tools
  npm install -g node-gyp
  npm install -g mocha
  npm install -g nodemon
  npm install -g gulp@github:gulpjs/gulp#4.0
  npm install -g remap-istanbul
  npm install -g codeclimate-test-reporter
  npm install -g istanbul
  npm install -g snyk
fi
