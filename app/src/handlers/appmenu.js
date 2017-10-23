'use strict'

const {remote,ipcRenderer} = require('electron');
const {Menu} = remote;
var appManifest = require('../../package.json');

class AppMenu {
  InitMenu () {
    let template = this.getTemplate(process.platform);
    if (template !== null) {
      let menu = Menu.buildFromTemplate(template)
      Menu.setApplicationMenu(menu)
      // console.log('InitMenu');
    } else {
      // console.log('not InitMenu');
    }
  }

  static _appAbout() {
    ipcRenderer.send('_appAbout');
  }

  static _appUpdate() {
    ipcRenderer.send('_appUpdate',false,false);
  }

  static _appQuit() {
    ipcRenderer.send('_appQuit');
  }

  getTemplate(platform) {
    let darwinTemplate = [
      {
        label: appManifest.productName,
        // label: '新生大学',
        submenu: [
          {
            label: '关于新生大学',
            click: AppMenu._appAbout
          },
          {
            label: '更新新生大学',
            click: AppMenu._appUpdate
          },
          {
            type: 'separator'
          },
          {
            label: '隐藏新生大学',
            role: 'hide'
          },
          {
            label: '隐藏其他应用',
            role: 'hideothers'
          },
          {
            label: '显示全部',
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            label: '退出新生大学',
            accelerator: 'Command+Q',
            click: AppMenu._appQuit
          }
        ]
      },
      {
        label: '修改',
        submenu: [
          {
            label: '撤销',
            accelerator: 'Command+Z',
            role: 'undo'
          },
          {
            label: '重做',
            accelerator: 'shift+Command+Z',
            role: 'redo'
          },
          {
            type: 'separator'
          },
          {
            label: '剪切',
            accelerator: 'Command+X',
            role: 'cut'
          },
          {
            label: '复制',
            accelerator: 'Command+C',
            role: 'copy'
          },
          {
            label: '粘贴',
            accelerator: 'Command+V',
            role: 'paste'
          },
          {
            label: '全选',
            accelerator: 'Command+A',
            role: 'selectall'
          }
        ]
      },
      {
        label: '窗口',
        role: 'window',
        submenu: [
          {
            label: '最小化',
            role: 'minimize'
          },
          {
            label: '关闭',
            accelerator: 'Command+W',
            role: 'close'
          }
        ]
      }
    ]
    if (platform === 'darwin') {
      return darwinTemplate;
    } else {
      return null;
    }
  }
}

module.exports = AppMenu;
