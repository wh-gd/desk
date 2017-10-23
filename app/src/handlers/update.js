/**
 * Created by Zhongyi on 3/25/16.
 */
"use strict";
const {shell, app, nativeImage} = require('electron');
const https = require('https');
const path = require('path');
const os = require('os');

const common = require('../common');
const Common = new common();
const SassDialog = require('./saas_dialog');
const Base64 = require('./base64.js').Base64;

const osIsDrawin = (process.platform === "darwin");

class UpdateHandler {
  constructor(online) {
    this.online = online;
  }

  checkForUpdate(version, silent, latestSilet) {
    // let deviceInfo = Base64.encode('abc');
    // console.log(deviceInfo);
    // console.log(Base64.decode(deviceInfo))
    // let netInfo = JSON.parse(os.networkInterfaces());
    // console.log(netInfo)
    let promise = new Promise((res, rej) => {
      var options = {
        hostname: this.online ? Common.SAAS_API_HOST : Common.SAAS_DEV_API_HOST,
        port: Common.SAAS_PORT,
        method: 'GET',
        headers: {
          'x-app-id': Common.X_APP_ID,
          'x-device-info': Common.X_DEVICE_INFO
        },
        path: Common.SAAS_API_RELEASE_LATEST_PATH,
      };
      let req = https.request(options, (response) => {
        let body = '';
        response.on('data', (d) => {
          body += d;
        });
        response.on('end', () => {
          this._parseUpdateData(body, version, res, rej);
        });
      });
      req.on('error', (err) => {
        rej(Common.UPDATE_ERROR_NETWORK);
      });
      req.end();
    }).then((fetched) => {
      if (fetched.latestSilet) {
        if (!latestSilet) {
            SassDialog.showLatestDialog();
        }
      } else {
        SassDialog.showMsgDialog(fetched.name, fetched.description, "更新", (response) => {
        if (!response) return;
        shell.openExternal(fetched.url);
        });
      }
    }).catch((message) => {
      if (silent) return;
      if (!message) {
        message = Common.UPDATE_ERROR_UNKNOWN;
      }
      SassDialog.showMsgDialog(Common.UPDATE_NA_TITLE, message, "确定");
    });
  }

  needUpdate(currVer,promoteVer){
      currVer = currVer?currVer.replace(/[vV]/,""):"0.0.0";
      promoteVer = promoteVer?promoteVer.replace(/[vV]/,""):"0.0.0";
      if(currVer==promoteVer) return 0;
      var currVerArr = currVer.split(".");
      var promoteVerArr = promoteVer.split(".");
      var len = Math.max(currVerArr.length,promoteVerArr.length);
      for(var i=0;i<len;i++){
          var proVal = ~~promoteVerArr[i],
              curVal = ~~currVerArr[i];
          if(proVal<curVal){
              return -1;
          }else if(proVal>curVal){
              return 1;
          }
      }
      return -1;
  };

  _parseUpdateData(body, version, res, rej) {
    // console.log(body);
    let data = JSON.parse(body);
    // console.log(data);
    if (!data || !data.result || !(osIsDrawin ? data.result.mac_version : data.result.win_version)) {
      SassDialog.showDialog('info','获取升级信息失败！');
      console.log(Common.UPDATE_ERROR_EMPTY_RESPONSE);
      return;
    }

    let fetched = {
      name: app.getName(),
      version: osIsDrawin ? data.result.mac_version : data.result.win_version,
      url: osIsDrawin ? data.result.mac_url : data.result.win_url
    };
    // console.log(fetched.version);
    // console.log(fetched.url);
    let version_regex = /^v[0-9]+\.[0-9]+\.*[0-9]*$/;
    if (version_regex.test(fetched.version)) {
      switch (this.needUpdate(version, fetched.version)) {
        case 0:
        case -1:
          // local version >= server version
          fetched.latestSilet = true;
          res(fetched);
          break;
        case 1:
          fetched.description = '检测到新版本' + fetched.version;
          res(fetched);
          break;
      }
    } else {
      SassDialog.showDialog('info','获取升级信息错误！');
      rej(Common.UPDATE_ERROR_LATEST(version));
    }
  };
}

module.exports = UpdateHandler;