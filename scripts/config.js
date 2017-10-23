'use strict'

const path = require('path')
const pkg = require('../app/package.json')
const platform = process.env.PLATFORM_TARGET || 'all'

let config = {
  name: pkg.name,
  productName: pkg.productName,
  app_version: pkg.version,
  arch: 'x64',
  app_src: path.join(__dirname, '/../build'),
  overwrite: true,
  osx: {
    icon: path.join(__dirname, '/../resources/icon.icns'),
    out: path.join(__dirname, '/../dist-osx'),
  },
  win: {
    icon: path.join(__dirname, '/../resources/icon.ico'),
    out: path.join(__dirname, '/../dist-win'),
    installer: {
      publisher: '情非得已（北京）科技有限公司, Inc.',
      webSite: 'https://web.xinshengdaxue.com/',
      welTitle: pkg.productName,
      welTxt: '新生大学是一个不断积累，持续学习，最终获得新生的学习平台！',
      Comments: '免费使用。'
    }
  }
}

module.exports = config
