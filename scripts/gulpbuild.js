'use strict';

var Q = require('q');
const gulp = require('gulp')
const gutil = require('gulp-util')
const jetpack = require('fs-jetpack')
var packager = require('electron-packager')
var childProcess = require('child_process');
var devManifest = require('../package.json')
var appConfig = require('./config.js')

var argv = require('minimist')(process.argv.slice(2))

const src = './app'
const dest = './build'

const projectDir = jetpack
const srcDir = projectDir.cwd(src)
const destDir = projectDir.cwd(dest)

const filesToCopy = [
    './app/package.json',
    './app/assets/*',
    './app/ffmpeg-lib-node/ffmpeg-lib-node.js',
    './app/ffmpeg-lib-node/package.json',
    './app/ffmpeg-lib-node/build/Release/FFmpegLibNode.node',
    './app/src/**/*'
]

const osIsDrawin = (process.platform === "darwin");
if (osIsDrawin){
  filesToCopy.push('./app/pepper/PepperFlashPlayer.plugin/**/*')
} else {
  filesToCopy.push('./app/ffmpeg-lib-node/build/Release/*.dll')
  filesToCopy.push('./app/pepper/pepflashplayer64.dll')
}

gulp.task('clean', function() {
    return jetpack.cwd(dest).dir('.', { empty: true })
})

gulp.task('clear', function() {
    jetpack.cwd(dest).dir('.', { empty: true })
    jetpack.cwd('./node_modules').dir('.', { empty: true })
    jetpack.cwd('./app/node_modules').dir('.', { empty: true })
    jetpack.cwd('./app/ffmpeg-lib-node/node_modules').dir('.', { empty: true })
})

gulp.task('copy', function() {
    return gulp.src(filesToCopy, { base: 'app' })
        .pipe(gulp.dest(dest))
})

gulp.task('build',['clean', 'copy'])

function getElectronVersion () {
  var v = (devManifest.devDependencies || {})['electron'] ||
    (devManifest.dependencies || {})['electron']

  if (v) {
    return v.replace(/^\D+/, '')
  } else {
    gutil.log(
      'No electron version was found in config.js or package.json.'
    )
  }
}
// console.log(__dirname);
var packagerConfig = {
  dir: dest,
  out: osIsDrawin ? appConfig.osx.out : appConfig.win.out,
  name: osIsDrawin ? appConfig.productName : appConfig.name,
  // name: appConfig.productName,
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

var tmpDir;
var installerPath;

function init () {
    tmpDir = projectDir.dir('./tmp', { empty: true });
    installerPath = projectDir.dir('./installer');
};

function replace (str, patterns) {
    Object.keys(patterns).forEach(function (pattern) {
        var matcher = new RegExp('{{' + pattern + '}}', 'g');
        str = str.replace(matcher, patterns[pattern]);
    });
    return str;
};

function createInstaller () {
    var deferred = Q.defer();
    var finalPackageName = appConfig.name + '_v' + appConfig.app_version + '.exe';
    var installScript = projectDir.read('nsi/main.nsi');
    installScript = replace(installScript, {
        name: appConfig.name,
        productName: appConfig.productName,
        version: appConfig.app_version,
        src: packagerConfig.out + '\\' + appConfig.name + '-win32-x64',
        dest: installerPath.path(finalPackageName),
        icon: projectDir.path('resources/icon.ico'),
        setupIcon: projectDir.path('resources/win-install.ico'),
        unInstallIcon: projectDir.path('resources/win-uninstall.ico'),
        publisher:appConfig.win.installer.publisher,
        webSite:appConfig.win.installer.publisher,
        welTitle: appConfig.win.installer.welTitle,
        welTxt: appConfig.win.installer.welTxt,
        Comments: appConfig.win.installer.Comments
        // banner: projectDir.path('resources/background.png'),
    });
    tmpDir.write('installer.nsi', installScript);

    gutil.log('Building installer with NSIS...');

    // Remove destination file if already exists.
    installerPath.remove(finalPackageName);

    // Note: NSIS have to be added to PATH (environment variables).
    var nsis = childProcess.spawn('makensis', [
        tmpDir.path('installer.nsi')
    ], {
        stdio: 'inherit'
    });
    nsis.on('error', function (err) {
        if (err.message === 'spawn makensis ENOENT') {
            throw "Can't find NSIS. Are you sure you've installed it and"
                + " added to PATH environment variable?";
        } else {
            throw err;
        }
    });
    nsis.on('close', function () {
        gutil.log('Installer ready!', installerPath.path(finalPackageName));
        cleanClutter();
        deferred.resolve();
    });

    return deferred.promise;
};

function packToDmgFile () {
    var deferred = Q.defer();

    var appdmg = require('appdmg');
    var dmgName = appConfig.productName + '-v' + appConfig.app_version + '.dmg';

    // Prepare appdmg config
    var outAppPath = packagerConfig.out + '/' + appConfig.productName + '-darwin-x64/' + appConfig.productName + '.app';
    var dmgManifest = projectDir.read('resources/dmg.json');
    dmgManifest = replace(dmgManifest, {
        productName: appConfig.productName,
        appPath: outAppPath,
        dmgIcon: projectDir.path("resources/dmg-icon.icns"),
        dmgBackground: projectDir.path("resources/background.png")
    });
    tmpDir.write('dmg.json', dmgManifest);

    // Delete DMG file with this name if already exists
    installerPath.remove(dmgName);

    gutil.log('Packaging to DMG file...');

    var readyDmgPath = installerPath.path(dmgName);
    appdmg({
        source: tmpDir.path('dmg.json'),
        target: readyDmgPath
    })
    .on('error', function (err) {
        console.error(err);
    })
    .on('finish', function () {
        gutil.log('DMG file ready!', readyDmgPath);
        cleanClutter();
        deferred.resolve();
    });

    return deferred.promise;
};

function cleanClutter () {
  projectDir.removeAsync('./build');
  if (osIsDrawin)
    projectDir.removeAsync('./dist-osx');
  tmpDir.removeAsync('.');
};

gulp.task('package', ['build'] , function() {
    init();
    // createInstaller();
    jetpack.cwd(packagerConfig.out).dir('.', { empty: true });
    packager(packagerConfig, function (err, appPath) {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      gutil.log('packaged to ' + appPath);
      if (osIsDrawin) {
        packToDmgFile();
      } else {
        // 由于中文打包显示乱码暂时注释
        // createInstaller();
      }
    })
  }
)
