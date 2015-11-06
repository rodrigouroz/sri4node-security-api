var Q = require('q');
var needle = require('needle');
var retry = require('retry');
var common = require('./common');

exports = module.exports = function(config) {

  'use strict';

  var operation;

  var reqOptions = {
    username: config.USER,
    password: config.PASSWORD,
    open_timeout: 0, //eslint-disable-line
    proxy: common.getProxyOpts(config.VSKO_API_HOST)
  };

  function responseHandlerSingleFn(op, deferred, me, component) {

    return function(err, response) {

      if (err) {

        if (op.retry(err)) {
          return;
        }

        deferred.reject(err);
      }

      if (response.statusCode === 200 && response.body === true) {
        deferred.resolve();
      } else {
        deferred.reject({
          statusCode: 403,
          body: '<h1>403 Forbidden</h1>'
        });
      }

    };
  }

  return {
    checkReadPermissionOnSingleElement: function(element, me, component) {

      var deferred = Q.defer();

      operation = retry.operation({
        retries: 3,
        factor: 3,
        minTimeout: 1000,
        maxTimeout: 5 * 1000,
        randomize: true
      });

      var url = config.VSKO_API_HOST + '/security/query/allowed?component=' + component;
      url += '&ability=read';
      url += '&person=/persons/' + me.uuid;
      url += '&resource=' + element;

      operation.attempt(function() {
        needle.get(url, reqOptions, responseHandlerSingleFn(operation, deferred, me, component));
      });

      return deferred.promise;

    },
    checkReadPermissionOnSet: function(element, me, component) {

      // TODO
    }
  };

};
