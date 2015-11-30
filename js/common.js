exports = module.exports = {
  getHeaders: function (configuration) {
    'use strict';
    return configuration.HEADERS ? configuration.HEADERS : [];
  }
};
