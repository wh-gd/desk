/**
 * Created by Zhongyi on 5/1/16.
 */
"use strict";

const path = require('path');
const {app, BrowserWindow} = require('electron');
const common = require('../../common');
const Common = new common();

class Splash {
  constructor(osIsDrawin) {
    this.osIsDrawin = osIsDrawin;
    this.splashWindow = new BrowserWindow({
      width: Common.WINDOW_SIZE_LOADING.width,
      height: Common.WINDOW_SIZE_LOADING.height,
      title: Common.ELECTRONIC_SAAS,
      resizable: false,
      center: true,
      show: true,
      frame: true,
      autoHideMenuBar: true,
      alwaysOnTop: true,
      icon: path.join(__dirname, '../../../assets/icon.png')
      // titleBarStyle: 'hidden'
    });

    this.splashWindow.loadURL('file://' + path.join(__dirname, '/../views/splash.html'));

    this.splashWindow.on('close', (e) => {
      // console.log('splashWindow close');
      if (this.osIsDrawin) {
        e.preventDefault();
        this.splashWindow.hide();
      } else {
        app.exit(0);
      }
    });
  }

  toggleWindow () {
    if (this.splashWindow.isVisible()){
      this.splashWindow.hide();
      // console.log('hide');
    } else {
      this.splashWindow.show();
      // console.log('show');
    }
  }

  show() {
    this.splashWindow.show();
  }

  hide() {
    this.splashWindow.hide();
  }

  setTitle(title) {
    this.splashWindow.setTitle(title);
  }
}

module.exports = Splash;
