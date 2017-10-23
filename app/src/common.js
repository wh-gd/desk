/**
 * Created by Zhongyi on 3/26/16.
 */
"use strict";
class Common {
  constructor() {
    this.ELECTRONIC_SAAS = "";
    // Common.DEBUG_MODE = false;
    this.WINDOW_SIZE_LOADING = {width: 380, height: 160};
    this.WINDOW_SIZE = {width: 1150, height: 768};
    this.SAAS_DEV_API_HOST = "api-saas-dev.tinfinite.com";
    this.SAAS_API_HOST = "api-saas.tinfinite.com";
    this.SAAS_API_RELEASE_LATEST_PATH = "/ping";
    this.SAAS_PORT = 443;
    this.X_APP_ID = '56c6c309243cb728205a3dff';
    this.X_DEVICE_INFO = 'YWRmYWRmYXM=';
    this.USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/41.0.2227.1 Safari/537.36";
    this.InfoFlag = {
      online: 'online',
      dev: 'dev',
      pre: 'pre',
      local: 'local',
      mode: 'mode'
    };

    this.ShortCut = {
      DevTool: 'Alt+D+K',
      Env: 'Alt+A+I',
      EnvDev: 'CommandOrControl+Alt+D+V',
      EnvPro: 'CommandOrControl+Alt+P+O',
      EnvPre: 'CommandOrControl+Alt+P+E',
      EnvLocal: 'CommandOrControl+Alt+L+C',
      Reload: 'CommandOrControl+Alt+R'
    };

    // this.WEB_SAAS = "https://web-dev.xinshengdaxue.com/";
    // this.WEB_SAAS_LOCAL = "https://web-dev.local.xinshengdaxue.com:3011/";

    this.UPDATE_ERROR_ELECTRON = "Failed to get the local version. If you are using debug mode(by `npm start`), " +
        "this error would happen. Use packed app instead or manually check for updates.\n\n";
    this.UPDATE_ERROR_EMPTY_RESPONSE = "Failed to fetch release info.";
    this.UPDATE_ERROR_UNKNOWN = "Something went wrong.";
    this.UPDATE_NA_TITLE = "No Update Available";
    this.UPDATE_ERROR_NETWORK = "Connection hang up unexpectedly. Check your network settings.";
  }
  UPDATE_ERROR_LATEST (version) {
  return `You are using the latest version(${version}).`
  };
}

module.exports = Common;
