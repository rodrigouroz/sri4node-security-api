exports = module.exports = {
  getProxyOpts: function (host) {
    'use strict';
    var quotaguardUrl;
    if (host.match('https*://test') || host.match('https*://acc')) {
      quotaguardUrl = process.env.QUOTAGUARDSTATIC_URL; //eslint-disable-line
      if (quotaguardUrl && quotaguardUrl !== '') {
        return quotaguardUrl;
      }
    }
    return null;
  }
};
