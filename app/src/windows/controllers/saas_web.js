/**
 * Created by Zhongyi on 5/2/16.
 */
"use strict";

const path = require('path');
const {app, shell, BrowserWindow} = require('electron');
const common = require('../../common');
const Common = new common();
const UpdateHandler = require('../../handlers/update');
const SassDialog = require('../../handlers/saas_dialog')
class SaasWeb {
  constructor(url,osIsDrawin,title) {
    this.url = url;
    this.osIsDrawin = osIsDrawin;
    this.connected = false;
    this.inervals = null;
    this.title = title;
    this.createWindow();
    this.dom_ready = false;
  }

  SetOnlineFlag (flag) {
    this.onlineFlag = flag;
  }

  setLoggerUrl(url) {
    this.url = url;
  }

  userLogged() {
    // console.log('userLogged');
    clearInterval(this.inervals);
    this.inervals = null;
    this.connected = true;
    this.saasWebWindow.show();
    this.saasWebWindow.center();
  }

  newChildWindows(isShow) {
    return new BrowserWindow({
      title: this.title,
      width: Common.WINDOW_SIZE.width,
      height: Common.WINDOW_SIZE.height,
      resizable: true,
      center: true,
      show: isShow,
      frame: true,
      autoHideMenuBar: true,
      icon: path.join(__dirname, '../../../assets/icon.png'),
      // titleBarStyle: 'hidden-inset',
      webPreferences: {
        javascript: true,
        plugins: true,
        nodeIntegration: true,
        webSecurity: false
      }
    });
  }

  newDefalteWindows(isShow) {
    return new BrowserWindow({
      title: this.title,
      width: Common.WINDOW_SIZE.width,
      height: Common.WINDOW_SIZE.height,
      minWidth: Common.WINDOW_SIZE.width,
      minHeight: Common.WINDOW_SIZE.height,
      resizable: true,
      center: true,
      show: isShow,
      frame: true,
      autoHideMenuBar: true,
      icon: path.join(__dirname, '../../../assets/icon.png'),
      // titleBarStyle: 'hidden-inset',
      webPreferences: {
        javascript: true,
        plugins: true,
        nodeIntegration: true,
        webSecurity: false,
        preload: path.join(__dirname, '../../vendor/audio/media.js')
      }
    });
  }

  getWindow() {
    return this.saasWebWindow;
  }

  createWindow() {
    this.saasWebWindow = this.newDefalteWindows(true);

    this.saasWebWindow.webContents.setUserAgent(Common.USER_AGENT);

    this.connect();
    // this.saasWebWindow.toggleDevTools();
    this.saasWebWindow.on('close', (e) => {
      // console.log('saasWebWindow close:' + e)
      if (this.saasWebWindow.isVisible()) {
        e.preventDefault();
        this.saasWebWindow.hide();
      }
    });

    this.saasWebWindow.webContents.on('new-window', (event,url) => {
      var newWindow = this.newChildWindows(false);
      newWindow.webContents.executeJavaScript(`window.saas_electron = true`)
      newWindow.setPosition(newWindow.getBounds().x + 50,newWindow.getBounds().y + 50)
      newWindow.loadURL(url);
      newWindow.show();
      event.preventDefault();
      newWindow.on('close', (e) => {
        e.preventDefault();
        SassDialog.showWriterDialog(newWindow,newWindow.webContents.getTitle(),
          '是否确定离开写作平台！',(res) => {
            if (!res) return;
            newWindow.destroy();
        })
      });
    });

    this.saasWebWindow.webContents.on('dom-ready', () => {
      // console.log('dom-ready');
      this.saasWebWindow.setTitle(this.title);
      new UpdateHandler(this.onlineFlag).checkForUpdate(`v${app.getVersion()}`, true, true);
    });
  }

  changeUrl(url,title) {
    this.title = title;
    this.saasWebWindow.hide();
    this.setLoggerUrl(url);
    this.connect();
  }

  urlLoaded() {
    return this.connected;
  }

  reload() {
    this.saasWebWindow.reload();
  }

  loadURL(url) {
    this.saasWebWindow.loadURL(url);
    // console.log('after loadurl');
    this.saasWebWindow.webContents.session.clearStorageData()
  }

  show() {
    this.saasWebWindow.show();
  }

  isVisible() {
    return this.saasWebWindow.isVisible();
  }

  isMinimized() {
    return this.saasWebWindow.isMinimized();
  }

  toggleWindow () {
    if (this.saasWebWindow.isVisible()){
      this.saasWebWindow.hide();
      // console.log('hide');
    } else {
      this.saasWebWindow.show();
      // console.log('show')
    }
  }

  hide() {
    this.saasWebWindow.hide();
  }

  connect() {
    let url = this.url;
    this.connected = false;
    this.loadURL(url);

    // if (this.inervals !== null) {
    //   clearInterval(this.inervals);
    // }

    // this.inervals = setInterval(()=> {
    //   this.loadURL(url);
    //   console.log("Reconnect.");
    // }, 5000);
  }
}

module.exports = SaasWeb;
