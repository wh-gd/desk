/**
 * Packages the application into executable .app and .exe files.
 * For more info, see https://github.com/electron-userland/electron-packager.
 */
 'use strict';

var argv = require('minimist')(process.argv.slice(2))
var packager = require('electron-packager')
var devManifest = require('../package.json')
var appConfig = require('./config.js')

function getElectronVersion () {
  var v = (devManifest.devDependencies || {})['electron'] ||
    (devManifest.dependencies || {})['electron']

  if (v) {
    return v.replace(/^\D+/, '')
  } else {
    console.log(
      'No electron version was found in config.js or package.json.'
    )
  }
}
// console.log(__dirname);
const osIsDrawin = (argv.platform === "darwin");
var packagerConfig = {
  dir: appConfig.app_src,
  out: osIsDrawin ? appConfig.osx.out : appConfig.win.out,
  name: appConfig.productName,
  'app-version': appConfig.version,
  version: getElectronVersion(),
  platform: argv.platform,
  arch: argv.arch,
  icon: osIsDrawin ? appConfig.osx.icon : appConfig.win.icon,
  prune: true,
  overwrite: appConfig.overwrite
}

if (!osIsDrawin) {
  packagerConfig.win32metadata = {
    CompanyName: devManifest.companyName,
    FileDescription: devManifest.productName,
    OriginalFilename: devManifest.companyName,
    ProductName: devManifest.productName,
    InternalName: devManifest.productName
  }
}

packager(packagerConfig, function (err, appPath) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('packaged to ' + appPath);
})


