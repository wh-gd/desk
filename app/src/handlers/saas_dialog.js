'use strict'

const {dialog,nativeImage} = require('electron');
const path = require('path');

const appManifest = require('../../package.json');
const icon = nativeImage.createFromPath(path.join(__dirname, '../../assets/icon.png'));

function showDialog(type,msg) {
  dialog.showMessageBox({
    type: type,
    message: msg,
    icon: icon,
    buttons: ['确定']
  })
}

function showAboutDialog() {
  let msg = '新生大学 \n' + '版本:' + appManifest.version;
  showDialog('info',msg);
}

function showLatestDialog() {
  let msg = '当前已经是最新版本！';
  showDialog('info',msg);
}

function showRunningDialog() {
  let msg = '新生大学已经运行！！';
  showDialog('warning',msg);
}

function RecordingDialog() {
  let msg = '当前正在直播，请关闭直播后退出！';
  showDialog('warning',msg);
}

function StartRecordingDialog() {
  let msg = '开始录音！';
  showDialog('warning',msg);
}

function StopRecordingDialog() {
  let msg = '停止录音！';
  showDialog('warning',msg);
}

function showMsgDialog(message, detail, positive_button, callback) {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['取消', positive_button],
    defaultId: 1,
    cancelId: 0,
    title: message,
    message: message,
    detail: detail,
    icon: icon
  }, callback);
}

function showWriterDialog(win,message, detail, callback) {
  dialog.showMessageBox(win,{
    type: 'info',
    buttons: ['否', '是'],
    defaultId: 1,
    cancelId: 0,
    title: message,
    message: message,
    detail: detail,
    icon: icon
  }, callback);
}

var SassDialog = {
  showAboutDialog: showAboutDialog,
  showLatestDialog: showLatestDialog,
  showMsgDialog: showMsgDialog,
  showWriterDialog:showWriterDialog,
  showRunningDialog: showRunningDialog,
  RecordingDialog: RecordingDialog,
  StartRecordingDialog: StartRecordingDialog,
  StopRecordingDialog: StopRecordingDialog,
  showDialog: showDialog
}

module.exports = SassDialog;