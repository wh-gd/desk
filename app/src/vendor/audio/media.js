/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 *  const ipcRenderer = require('electron').ipcRenderer;
 *  const remote = require('electron').remote;
 */
/* eslint-disable */
'use strict'
// console.log(process.version);
var ffmpegProcess = require('../../../ffmpeg-lib-node')
var _audioEngine = ffmpegProcess.createNewFFmpegEngine()
// Put variables in global scope to make them available to the browser gutil.
// sampleRate: 44100, sampleSize: 196000, channelCount: 1，这个是音频的设置
var PCAudioStreamState = {
    PCAudioStreamStateConneted: 0,
    PCAudioStreamStateConneting: 1
}
// 推流方式
var PCAudioStreamPushType = {
    PCAudioStreamPushTypeFileSending: 0,
    PCAudioStreamPushTypeRecording: 1
}
// 停止方式
var PCAudioStreamStopType = {
    PCAudioStreamStopTypeInitial: 0,           // 初始
    PCAudioStreamStopTypeToFileSending: 1,     // 将要文件直播
    PCAudioStreamStopTypeToRecording: 2        // 将要语音直播
}

// audio 状态
var PCAudioStatusType = {
  PCAudioStatusInitial: -1,                    // 初始状态
  PCAudioStatusStop: 0,                        // 停止录音
  PCAudioStatusRecording: 1                    // 正在录音
}

class Media{
  constructor () {
     this._recordStatus = PCAudioStreamState.PCAudioStreamStateConneting            // 状态，是否正在录制中还是已经结束。-1，初始化状态，0，结束录制， 1，正在录制
     //this._recordType = PCAudioStreamPushType.PCAudioStreamPushTypeRecording        // 类型，是录制声音直播还是本地传送文件录播。0录制声音，1本地传送文件
     this._stopType   = PCAudioStreamStopType.PCAudioStreamStopTypeInitial          //
     this._isRecording = false
     this._isFileSending = false
     this._fileSendingPath = ''
     this._publishUrl  = ''
     this._audioStatus = PCAudioStatusType.PCAudioStatusInitial
     this._constraints = window.constraints = {
                        audio: {sampleRate: 44100, channelCount: 2, sampleSize: 2},
                        video: false
     }
  }

  handleSuccess(stream) {
    var audioTracks = stream.getAudioTracks()
    //console.log('Got stream with constraints:', this._constraints)
    console.log('Using audio device: ' + audioTracks[0].label)

    var _audioContext = new (window.AudioContext || window.webkitAudioContext)
    var _microphone = _audioContext.createMediaStreamSource(stream)
    // 创建缓存，用来缓存声音
    var bufferSize = 2048

      // 创建声音的缓存节点，createJavaScriptNode方法的
      // 第二个和第三个参数指的是输入和输出都是双声道。
    var _recorder = _audioContext.createScriptProcessor(bufferSize, 1, 1)
    _microphone.connect(_recorder)
    _recorder.connect(_audioContext.destination)

    _recorder.onaudioprocess = function(audioProcessingEvent) {
      let inputBuffer = audioProcessingEvent.inputBuffer
      // The output buffer contains the samples that will be modified and played
      //var outputBuffer = audioProcessingEvent.outputBuffer

      // Loop through the output channels (in this case there is only one)
      try{
        for (var channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
          let inputData  = inputBuffer.getChannelData(channel)
          //var outputData = outputBuffer.getChannelData(channel)
          let audioBuffer = new Float32Array(inputData)
          if (audioBuffer.length > 1024) {
            let ret = _audioEngine.processFFmpegBuffer(audioBuffer, audioBuffer, audioBuffer.length)
            if(ret === -1){
              // console.log("array is empty.")
            }
            else{
              //console.log("array is not empty %d.", audioBuffer.length)
            }
          } else {
            gutil.error(" the audio inputData capture is error")
          }

          audioBuffer = null
          // 设置inputData
          if (mymedia._audioStatus == PCAudioStatusType.PCAudioStatusStop) {
              let track = stream.getTracks()[0]
              track.stop()
              _microphone.disconnect(_recorder)
              _recorder.disconnect(_audioContext.destination)
              mymedia._audioStatus = PCAudioStatusType.PCAudioStatusInitial
              console.log("this._recordStatus is %d", mymedia._recordStatus)
          }
        }
      } catch (err) {
        console.log(err)
      }
    }

    // stop the record stream
    stream.oninactive = function() {
      _audioContext.close()
      _audioContext = null
      _microphone = null
      _recorder = null
      _audioEngine.stopRecord()
      console.log('Mic Stream ended')
    }
    // window.stream = stream // make variable available to browser gutil
    // audio.srcObject = stream;
  }

  handleError(error) {
    window.alert('没有找到麦克！')
    console.log('navigator.getUserMedia error:%d.', error)
  }

  openMicClicked(strUrl) {
    if (strUrl == undefined) {
      window.alert('liveUrl undefined')
      return
    }

    this._publishUrl = strUrl
    this.startRecord();
  }

  startRecord() {
    if (this._isFileSending) {
      this._stopSendFileWithStopType(PCAudioStreamStopType.PCAudioStreamStopTypeToRecording)
    }
    if (this._stopType == PCAudioStreamStopType.PCAudioStreamStopTypeInitial) {
      this._stopType = PCAudioStreamStopType.PCAudioStreamStopTypeToRecording
      this._startRecord()
    }
    ipcRenderer.send('recording')
  }

  _startRecord() {
    if (!this._isRecording) {
      if (this._publishUrl != '') {
        var ret = _audioEngine.startRecord(this._publishUrl, publishCallback)
        if (ret >= 0) {
          this._recordStatus = PCAudioStreamState.PCAudioStreamStateConneted
          this._isRecording = true
          this._audioStatus = PCAudioStatusType.PCAudioStatusRecording
          navigator.getUserMedia = (navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia)
          navigator.getUserMedia(this._constraints, this.handleSuccess, this.handleError)
        } else {
          this._recordStatus = PCAudioStreamState.PCAudioStreamStateConneting
          this._isRecording = false
          this._audioStatus = PCAudioStatusType.PCAudioStatusStop
          this._stopType = PCAudioStreamStopType.PCAudioStreamStopTypeInitial
        }
      }
    }
  }

  stopRecordClicked() {
    // record the audio from mic
    ipcRenderer.send('stoprecording')
    this._stopRecordWithStopType(PCAudioStreamStopType.PCAudioStreamStopTypeInitial)
    this._stopSendFileWithStopType(PCAudioStreamStopType.PCAudioStreamStopTypeInitial)
  }

  _stopSendFileWithStopType(stopType) {
    if (this._isFileSending) {
      this._stopType = stopType
      if(stopType == PCAudioStreamStopType.PCAudioStreamStopTypeInitial) {
        this._isRecording = false
        this._isFileSending = false
        this._fileSendingPath = ''
      }
      _audioEngine.stopRecord()
      this._recordStatus  = PCAudioStreamState.PCAudioStreamStateConneting
    }
  }

  _stopRecordWithStopType(stopType) {
    if (this._isRecording) {
      this._stopType = stopType
      if (stopType == PCAudioStreamStopType.PCAudioStreamStopTypeInitial) {
        this._isRecording = false
        this._isFileSending = false
        this._fileSendingPath = ''
      }
      this._audioStatus  = PCAudioStatusType.PCAudioStatusStop
      this._recordStatus = PCAudioStreamState.PCAudioStreamStateConneting
    }
  }

  fileSendClicked(filePath, strUrl) {
    // ipcRenderer.send('asynchronous-message', 'main-send-file-event');
    // var filePath = '/Users/guoxinchun1/Downloads/mp3/dd.mp3'
    // 当前的状态，是否打开mic；
    this._publishUrl = strUrl
    this._fileSendingPath = filePath
    this.startSendingFile()
    // console.log('_fileSendingPath:' + filePath)
    // console.log('strUrl:' + strUrl)
  }

  startSendingFile() {
    if (this._isRecording) {
      this._stopRecordWithStopType(PCAudioStreamStopType.PCAudioStreamStopTypeToFileSending)
    }

    if (this._isFileSending) {
          this._stopSendFileWithStopType(PCAudioStreamStopType.PCAudioStreamStopTypeToFileSending)
    }

    if (this._stopType == PCAudioStreamStopType.PCAudioStreamStopTypeInitial) {
      this._stopType = PCAudioStreamStopType.PCAudioStreamStopTypeToFileSending
      this._startSendingFile()
    }
  }

  _startSendingFile() {
    if (!this._isFileSending) {
      if (this._publishUrl != '' && this._fileSendingPath != '') {
        console.log('the filePath is %s, the url is %s.', this._fileSendingPath, this._publishUrl)
        _audioEngine.tansferFile(this._fileSendingPath, this._publishUrl, publishCallback)
      }
    }
    this._isFileSending = true
  }
}

function startSendFileCallback() {
  mymedia._startSendingFile()
}

function startRecordCallback() {
  mymedia._startRecord()
}

function stopPublishCallback() {
  mymedia.stopRecordClicked()
}

function publishCallback(ret, event) {
  console.log('publishCallback ret:%d',ret)
  if (ret === 0) {
      // 发送文件强制结束
      // console.log('success')
      if (mymedia._isFileSending) {
        mymedia._isFileSending = false
      }

      if (mymedia._isRecording) {
        mymedia._isRecording = false
      }

      // 切换到语音直播的方式
      if (mymedia._stopType == PCAudioStreamStopType.PCAudioStreamStopTypeToRecording &&
        mymedia._isRecording == false) {
        console.log('publishCallback startRecordCallback')
        setTimeout(startRecordCallback, 50)
        //mymedia._startRecord()
      }
        // 切换到文件直播的方式
      if (mymedia._stopType == PCAudioStreamStopType.PCAudioStreamStopTypeToFileSending &&
        mymedia._isFileSending == false) {
        console.log('publishCallback startSendFileCallback')
        setTimeout(startSendFileCallback, 50)
        //mymedia._startSendingFile()
      }
  }
  else if (ret === 1) {
    // 文件播完后->开始推送语音
    if (mymedia._publishUrl != '') {
      mymedia._fileSendingPath = ''
      console.log('publishCallback startRecordCallback')
      setTimeout(startRecordCallback, 50)
      //mymedia._startRecord()
    } else {
      console.log('publishCallback _publishUrl is not empty')
    }
  } else {
    // 非正常结束，发送出现错误
    console.log('publishCallback unknow error,then stopPublishCallback')
    setTimeout(stopPublishCallback, 50)
    //mymedia.stopRecordClicked()
  }
}
var appManifest = require('../../../package.json')
class ClientInfo{
  getVersion() {
    // console.log(appManifest.version)
    return appManifest.version
  }
}

const {ipcRenderer} = require('electron');
window.ipcRenderer = ipcRenderer
const appmenu = require('../../handlers/appmenu');
const AppMenu = new appmenu();
AppMenu.InitMenu();
var mymedia = new Media()
window.mymedia = mymedia
module.exports = mymedia
var clientInfo = new ClientInfo()
window.clientInfo = clientInfo
module.exports = clientInfo
/* eslint-disable */
