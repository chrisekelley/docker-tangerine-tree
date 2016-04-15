#!/usr/bin/env node

/** Downloads documents from a CouchDB server and puts them into json "pack" files.
 * This script is used by the Tree, which is in a different repo than the client.
 * Please only make changes to this file and Settings.js for the proper working of the Tree.
 * Change group to the group your Tangerine will connect to and download from.
 * There are three levels of settings:
 * `Conf` should only change between breaking versions.
 * `Settings` should only change for different server/directory environments.
 * T_ADMIN, T_PASS, T_COUCH_HOST, T_LOG_LEVEL
 * `argv` can change each time this script is run.
 * group
 */

'use strict';

// for Path.join
let Path = require('path');

// for joining urls
let urljoin = require('url-join');

// for writeFile
let fs = require('fs');

// for mkdirp
let fse = require('fs-extra');

// a REST client
let unirest = require('unirest');

// for deleting files
let del = require('del');

// for logging
let winston = require('winston');

/** Configuration. */
let Conf = {};

// how many documents will be put into a pack at most.
Object.defineProperty(Conf, "PACK_DOC_SIZE", {value: 50, writeable: false, configurable: false, enumerable: true});

// Where the json docs will go
Object.defineProperty(Conf, "PACK_PATH", {value: `${__dirname}/../src/js/init`, writeable: false, configurable: false, enumerable: true})

/** Handle environment variables. */
let Settings = require('./Settings.js');

/** Parse arguments. */
let argv = {};

let rawrgv = JSON.parse(process.env.npm_config_argv).original;
rawrgv.forEach(function(el, i){
  if (~el.indexOf('--') && ~el.indexOf('=')) {
    let clean = el.substr(2);
    let split = clean.split('=');
    argv[split[0]] = split[1];
  } else if (~el.indexOf('-')) {
    let key = el.replace(/\-/g, '');
    let nextArgIsAnotherKey = ~(rawrgv[i+1] || '').indexOf('-');
    let noMoreKeys = rawrgv[i+1] === undefined;
    if (nextArgIsAnotherKey || noMoreKeys) {
      argv[key] = true;
    } else {
      argv[key] = rawrgv[i+1];
    }
  }
});

const SOURCE_GROUP = `http://${argv.hostname}:${Settings.T_COUCH_PORT}/group-${argv.group}`;

logger.debug("SOURCE_GROUP: " + SOURCE_GROUP);

let JSON_HEADERS = {
  'Accept'       : 'application/json',
  'Content-Type' : 'application/json'
}

// make sure the json pack directory is there
fse.ensureDirSync(Conf.PACK_PATH);


// Helper method for gets
let get = function(url){
  logger.debug(`GET ${url}`);
  return new Promise(function(resolve, reject){
    console.log('username: ' +  argv.username);
    unirest.get(url)
      .auth({
        user: argv.username,
        pass: argv.password,
        sendImmediately: true
      })
      .headers(JSON_HEADERS)
      .end(function(res){
        if ( res.code >= 400 ) {
          return reject({code: res.code, msg: `${url} ${res.raw_body}`});
        }
        resolve(res);
      }); // get
  })
};

// Helper method for posts
let post = function(url, data){
  if (!data) {data= {}}
  return new Promise(function(resolve, reject){
    logger.debug(`POST ${url} data: ${JSON.stringify(data)}`);
    unirest.post(url)
      .auth({
        user: Settings.T_ADMIN,
        pass: Settings.T_PASS,
        sendImmediately: true
      })
      .headers(JSON_HEADERS)
      .send(JSON.stringify(data))
      .end(function(res){
        if ( res.code >= 400 ) {
          return reject({code: res.code, msg: `${url} ${res.raw_body}`});
        }
        resolve(res);
      }); // post
  })
};

// Set up the logger
var logger = new winston.Logger({
  level: Settings.T_LOG_LEVEL,
  transports: [
    new (winston.transports.Console)()
  ]
});

// Summarize this job
logger.info(argv.group)

// delete any old packs if they're there
del([ Path.join(Conf.PACK_PATH, 'pack*.json') ])
  .then( function (paths) {
    if ( paths.length !== 0 ) {
      logger.debug(`Old json packs deleted: ${paths.map((p)=>p.substring(Conf.PACK_PATH.length)).join(', ')}`);
    }
  })
  .then(function checkGroupExistence() {
    console.log("checking group")
    return get(SOURCE_GROUP);
  })
  .then(function writeDocs(res) {

    let fileName = Path.join(Conf.PACK_PATH, `/packAllDocs0.json`);
    let docs = argv.docs;
    console.log("fileName: " + fileName + " docs: " + JSON.stringify(docs));

    fs.writeFile(fileName, body, function(err) {
      if (err) {
        console.log(err.stack)
        logger.error(err);
        return process.exit(1);
      }
    })

  })
  .catch(function noGroup(err) {
    console.log(err.stack)
    logger.error(err.msg);
  });

