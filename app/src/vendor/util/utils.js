'use strict'
var fs = require('fs');
var jsonFile = require('./jsonfile');

function checkFileExistsSync (filepath) {
  let flag = true;
  try{
    fs.accessSync(filepath, fs.F_OK);
  }catch(e){
    // console.log(e);
    flag = false;
    // return flag;
  }
  return flag;
}

function mkdirSyncInfo (path) {
  let flagPathExist = false;
  try {
    fs.accessSync(path, fs.F_OK);
    flagPathExist = true;
    fs.unlinkSync(path);
    fs.mkdirSync(path);
  } catch (e) {
    if (!flagPathExist)
      fs.mkdirSync(path);
    // console.log(e);
  }
}

function readFileSync (filepath) {
  try {
    return jsonFile.readFileSync(filepath);
  } catch (e) {
    console.log(e);
  }
}

function writeFileSync (filepath,info) {
  try {
    jsonFile.writeFileSync(filepath,info);
  } catch (e) {
    console.log(e);
  }
}

var utils = {
  checkFileExistsSync: checkFileExistsSync,
  mkdirSyncInfo: mkdirSyncInfo,
  readFileSync: readFileSync,
  writeFileSync: writeFileSync
};

module.exports = utils