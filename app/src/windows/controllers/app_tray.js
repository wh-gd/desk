/**
 * Created by Zhongyi on 5/2/16.
 */
"use strict";

const path = require('path');
const {app, Menu, nativeImage, Tray} = require('electron');

const common = require('../../common');
const Common = new common();
const UpdateHandler = require('../../handlers/update');
const SassDialog = require('../../handlers/saas_dialog');

class AppTray {

  SetOnlineFlag (flag) {
    this.onlineFlag = flag;
  }

  SetRecordFlag(recording) {
    this.recording = recording;
  }

  GetRecordFlag() {
    return this.recording;
  }
  constructor(splash,SaasWeb,osIsDrawin) {
    this.onlineFlag = true;
    this.recording = false;
    this.SaasWeb = SaasWeb;
    this.splash = splash;

    let image;
    if (osIsDrawin) {
      image = nativeImage.createFromPath(path.join(__dirname, '../../../assets/status_bar.png'));
    } else {
      image = nativeImage.createFromPath(path.join(__dirname, '../../../assets/icon.png'));
    }
    image.setTemplateImage(true);

    this.tray = new Tray(image);
    this.tray.setToolTip(Common.ELECTRONIC_SAAS);

    // if (!osIsDrawin) {
      let contextMenu = Menu.buildFromTemplate([
        // {label: 'Show', click: () => this.toggleSaasWebWindow()},
        {label: '关于', click: (item, focusedWindow) => {
            // console.log(__dirname)
            SassDialog.showAboutDialog();
        }},
        {label: '更新', click: (item, focusedWindow) => {
            // console.log(__dirname)
            new UpdateHandler(this.onlineFlag).checkForUpdate(`v${app.getVersion()}`, false, false);
        }},
        {label: '退出', click: () => {
          if (this.recording) {
            SassDialog.RecordingDialog();
          } else {
            app.quit();
          }
          }
        }
      ]);
      this.tray.setContextMenu(contextMenu);
    // }
    this.tray.on('click', () => {
      if (this.SaasWeb.urlLoaded()) {
        this.SaasWeb.toggleWindow();
      } else {
        this.splash.toggleWindow();
      }
      // console.log('tray click');
    });
  }

  setTitle(title) {
    this.tray.setTitle(title);
  }
}

module.exports = AppTray;