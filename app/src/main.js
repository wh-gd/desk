/* eslint-disable */
'use strict';

const path = require('path');
var os = require('os');
const {app, ipcMain, BrowserWindow, globalShortcut} = require('electron');

const UpdateHandler = require('./handlers/update');
const SassDialog = require('./handlers/saas_dialog')
const Splash = require('./windows/controllers/splash');
const SaasWeb = require('./windows/controllers/saas_web');
const AppTray = require('./windows/controllers/app_tray');

const common = require('./common');
const Common = new common();
const utils = require('./vendor/util/utils');

const osIsDrawin = (process.platform === "darwin");

var appWin = null;
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (appWin) {
    if (appWin.isMinimized()) appWin.restore()
    appWin.focus()
  }
})

var recording = false;
class ElectronicSaasWeb {
  constructor() {
    this.splash = null;
    this.SaasWeb = null;
    this.tray = null;
    this.infoFile = null;
    this.info = null;
  }

  init() {
    this.initInfo();
    this.initFlash();
    this.initApp();
    this.initIPC();
  }

  initInfo () {
    let appInfoFile = path.join(__dirname,'/info.json');
    if (osIsDrawin) {
      let infoPath = path.join(os.homedir(),'.xinsheng');
      this.infoFile = path.join(infoPath,'/info.json');
      // console.log('utils.checkFileExistsSync:' + this.infoFile);
      let exist = utils.checkFileExistsSync(this.infoFile);
      // console.log(this.infoFile + ' : ' + exist);
      if (!exist) {
        // console.log('makedir:' + this.infoFile);
        utils.mkdirSyncInfo(infoPath);
        utils.writeFileSync(this.infoFile, utils.readFileSync(appInfoFile));
      }
    } else {
      this.infoFile = appInfoFile;
    }

    // console.log('info:' + this.infoFile);
    this.info = utils.readFileSync(this.infoFile);
  }

  initFlash() {
    //Specify flash path, supposing it is placed in the same directory with main.js.
    let pluginName;
    switch (process.platform) {
      case 'win32':
        pluginName = '../pepper/pepflashplayer64.dll'
        break
      case 'darwin':
        pluginName = '../pepper/PepperFlashPlayer.plugin'
        break
      case 'linux':
        pluginName = '../pepper/libpepflashplayer.so'
        break
    }
    // console.log(process.platform + ':' + path.join(__dirname, pluginName));
    app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName))
    // Optional:pecify flash version, for example, v22.0.0.209 S
    app.commandLine.appendSwitch('ppapi-flash-version', '22.0.0.209')
  }

  getAppTitle() {
    if (this.info[Common.InfoFlag.mode] !== Common.InfoFlag.online) {
      return Common.ELECTRONIC_SAAS + '[' + this.info[Common.InfoFlag.mode] + ']';
    } else {
      return Common.ELECTRONIC_SAAS;
    }
  }

  initApp() {
    app.commandLine.appendSwitch("ignore-certificate-errors");
    app.on('ready', ()=> {
      if (shouldQuit) {
        if (appWin === null) {
          SassDialog.showRunningDialog();
        }
        app.exit(0);
        return;
      }

      this.createSplash();
      this.createSaasWeb();
      this.createTray();

      // console.log(this.info[this.info[Common.InfoFlag.mode]]);
      // reload current window
      let ret = globalShortcut.register(Common.ShortCut.Reload, () => {
        let curWin = BrowserWindow.getFocusedWindow();
        if (curWin !== null) {
          // console.log('reload');
          curWin.reload();
        }
      });

      if (!ret) {
        console.log('registration ' + Common.ShortCut.Reload +' failed')
      }

      // open dev tools on the current window
      ret = globalShortcut.register(Common.ShortCut.DevTool, () => {
        let curWin = BrowserWindow.getFocusedWindow();
        // console.log('alt+d');
        if (curWin !== null) {
          curWin.toggleDevTools();
        }
      });

      if (!ret) {
        console.log('registration ' + Common.ShortCut.DevTool + ' failed')
      }

      ret = globalShortcut.register(Common.ShortCut.Env, () => {
        let msg = 'win操作系统使用control，mac使用command\n'
        + 'pro环境快捷键=>[' + Common.ShortCut.EnvPro + ']\n'
        + 'pre环境快捷键=>[' + Common.ShortCut.EnvPre + ']\n'
        + 'dev环境快捷键=>[' + Common.ShortCut.EnvDev + ']\n'
        + '刷新当前页面=>[' + Common.ShortCut.Reload + ']\n'
        + 'local环境快捷键=>[' + Common.ShortCut.EnvLocal + '](port:3011)\n'
        + '打开页面开发环境=>[' + Common.ShortCut.DevTool + ']\n'
        + '本信息快捷键=>[' + Common.ShortCut.Env + ']\n';
        SassDialog.showDialog('info', msg);
      });

      if (!ret) {
        console.log('registration ' + Common.ShortCut.Env + ' failed')
      }

      // change mode to online
      ret = globalShortcut.register(Common.ShortCut.EnvPro, () => {
        if (this.info[Common.InfoFlag.mode] !== Common.InfoFlag.online) {
          console.log(this.info[Common.InfoFlag.mode] + ' mode change to ' + Common.InfoFlag.online);
          this.info[Common.InfoFlag.mode] = Common.InfoFlag.online;
          utils.writeFileSync(this.infoFile, this.info);
          // console.log('info:' + this.infoFile);
          let appTitle = this.getAppTitle();
          this.SaasWeb.changeUrl(this.info[this.info[Common.InfoFlag.mode]],appTitle);
          this.splash.setTitle(appTitle);
          this.splash.show();
          this.tray.SetOnlineFlag(true);
          this.SaasWeb.SetOnlineFlag(true);
        }
      });

      if (!ret) {
        console.log('registration ' + Common.ShortCut.EnvPro + ' failed')
      }

      // change mode on dev
      ret = globalShortcut.register(Common.ShortCut.EnvDev, () => {
        if (this.info[Common.InfoFlag.mode] !== Common.InfoFlag.dev) {
          console.log(this.info[Common.InfoFlag.mode] + ' mode change to ' + Common.InfoFlag.dev);
          this.info[Common.InfoFlag.mode] = Common.InfoFlag.dev;
          utils.writeFileSync(this.infoFile, this.info);
          // console.log('info:' + this.infoFile);
          let appTitle = this.getAppTitle();
          this.SaasWeb.changeUrl(this.info[this.info[Common.InfoFlag.mode]],appTitle);
          this.splash.setTitle(appTitle);
          this.splash.show();
          this.tray.SetOnlineFlag(false);
          this.SaasWeb.SetOnlineFlag(false);
        }
      })

      if (!ret) {
        console.log('registration ' + Common.ShortCut.EnvDev + ' failed')
      }

      // change mode to pre
      ret = globalShortcut.register(Common.ShortCut.EnvPre, () => {
        if (this.info[Common.InfoFlag.mode] !== Common.InfoFlag.pre) {
          console.log(this.info[Common.InfoFlag.mode] + ' mode change to ' + Common.InfoFlag.pre);
          this.info[Common.InfoFlag.mode] = Common.InfoFlag.pre;
          utils.writeFileSync(this.infoFile, this.info);
          // console.log('info:' + this.infoFile);
          let appTitle = this.getAppTitle();
          this.SaasWeb.changeUrl(this.info[this.info[Common.InfoFlag.mode]],appTitle);
          this.splash.setTitle(appTitle);
          this.splash.show();
          this.tray.SetOnlineFlag(false);
          this.SaasWeb.SetOnlineFlag(false);
        }
      })

      if (!ret) {
        console.log('registration ' + Common.ShortCut.EnvPre + ' failed')
      }

      // change mode to local
      ret = globalShortcut.register(Common.ShortCut.EnvLocal, () => {
        if (this.info[Common.InfoFlag.mode] !== Common.InfoFlag.local) {
          console.log(this.info[Common.InfoFlag.mode] + ' mode change to ' + Common.InfoFlag.local);
          this.info[Common.InfoFlag.mode] = Common.InfoFlag.local;
          utils.writeFileSync(this.infoFile, this.info);
          // console.log('info:' + this.infoFile);
          let appTitle = this.getAppTitle();
          this.SaasWeb.changeUrl(this.info[this.info[Common.InfoFlag.mode]],appTitle);
          this.splash.setTitle(appTitle);
          this.splash.show();
          this.tray.SetOnlineFlag(false);
          this.SaasWeb.SetOnlineFlag(false);
        }
      })

      if (!ret) {
        console.log('registration ' + Common.ShortCut.EnvLocal + ' failed')
      }
    });

    app.on('activate', () => {
      if (this.SaasWeb === null) {
        this.createSaasWeb();
      } else if (this.SaasWeb.urlLoaded()){
        if (this.SaasWeb.isMinimized() || (!this.SaasWeb.isVisible()))
          new UpdateHandler(this.info[Common.InfoFlag.mode] === Common.InfoFlag.online).checkForUpdate(`v${app.getVersion()}`, false, true);
        this.SaasWeb.show();
      } else {
        this.splash.toggleWindow();
      }
    });

    app.on('window-all-closed', function () {
      // console.log('windows-all-closed')
      if (!osIsDrawin) {
        app.quit();
      }
    });

    app.on('before-quit', function (e) {
      // console.log('before-quit');
      // Unregister all shortcuts.
      // console.log('recording:' + recording);
      if (recording) {
        e.preventDefault();
        SassDialog.RecordingDialog();
      } else {
        globalShortcut.unregisterAll();
        app.exit(0);
        app.exit(0);
      }
    });
    app.on('quit', function (e) {
      // console.log('quit');
    });
  };

  initIPC() {
    ipcMain.on('badge-changed', (event, num) => {
      if (osIsDrawin) {
        app.dock.setBadge(num);
        if (num) {
          this.tray.setTitle(` ${num}`);
        } else {
          this.tray.setTitle('');
        }
      }
    });

    ipcMain.on('user-logged', () => {
      // console.log('user-logged')
      this.splash.hide();
      this.SaasWeb.userLogged()
      appWin = this.SaasWeb.getWindow();
    });

    ipcMain.on('wx-rendered', (event, isLogged) => {
    });

    ipcMain.on('log', (event, message) => {
      console.log(message);
    });
    ipcMain.on('recording', (event) => {
      // console.log('recording');
      // SassDialog.StartRecordingDialog();
      recording = true;
      this.tray.SetRecordFlag(true);
    });

    ipcMain.on('stoprecording', (event) => {
      // SassDialog.StopRecordingDialog();
      // console.log('stoprecording');
      recording = false;
      this.tray.SetRecordFlag(false);
    });

    ipcMain.on('reload', (event, repetitive) => {
      if (repetitive) {
        this.SaasWeb.connect();
      } else {
        this.SaasWeb.reload()
      }
    });

    ipcMain.on('_appAbout', (event) => {
      SassDialog.showAboutDialog();
    });

    ipcMain.on('_appQuit', (event) => {
      if (recording) {
        SassDialog.RecordingDialog();
      } else {
        globalShortcut.unregisterAll();
        app.exit(0);
        app.exit(0);
      }
    });

    ipcMain.on('_appUpdate', (event, silent, latestSilet) => {
      new UpdateHandler(this.info[Common.InfoFlag.mode] === Common.InfoFlag.online).checkForUpdate(`v${app.getVersion()}`, silent, latestSilet);
    });
  };

  createTray() {
    this.tray = new AppTray(this.splash,this.SaasWeb,osIsDrawin);
    this.tray.SetOnlineFlag(this.info[Common.InfoFlag.mode] === Common.InfoFlag.online);
  }

  createSplash() {
    this.splash = new Splash(osIsDrawin);
    // console.log(this.getAppTitle());
    this.splash.setTitle(this.getAppTitle());
  }

  createSaasWeb() {
    // console.log(this.info[this.info[Common.InfoFlag.mode]]);
    this.SaasWeb = new SaasWeb(this.info[this.info[Common.InfoFlag.mode]],osIsDrawin,this.getAppTitle());
    this.SaasWeb.SetOnlineFlag(this.info[Common.InfoFlag.mode] === Common.InfoFlag.online);
    // appWin = this.SaasWeb.getWindow();
  }
}

new ElectronicSaasWeb().init();
