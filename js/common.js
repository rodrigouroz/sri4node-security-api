exports = module.exports = {
  getHeaders: function (host) {
    'use strict';
    var headers = {};
    if (host.match('https*://test')) {
      headers['VSKO-ACCESSTOKEN-TEST'] = '152facf1-2df5-4489-82e2-1166f1ad94f3';
    }
    return headers;
  }
};
