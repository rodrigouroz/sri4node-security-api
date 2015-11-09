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
    json: true,
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

  function responseHandlerBatchFn(op, deferred, me, component) {

    return function(err, response) {

      var i;
      var failed;

      if (err) {

        if (op.retry(err)) {
          return;
        }

        deferred.reject(err);
      }

      if (response.statusCode === 200) {

        failed = [];

        for (i = 0; i < response.body.length; i++) {
          if (response.body[i].status !== 200 || !response.body[i].body) {
            failed.push(response.body[i].href);
          }
        }

        if (failed.length === 0) {
          deferred.resolve();
        } else {
          deferred.reject({
            statusCode: 403,
            body: '<h1>403 Forbidden</h1>'
          });
        }

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
      url += '&resource=' + element.$$meta.permalink;

      operation.attempt(function() {
        needle.get(url, reqOptions, responseHandlerSingleFn(operation, deferred, me, component));
      });

      return deferred.promise;

    },
    checkReadPermissionOnSet: function(elements, me, component) {

      var deferred = Q.defer();

      operation = retry.operation({
        retries: 3,
        factor: 3,
        minTimeout: 1000,
        maxTimeout: 5 * 1000,
        randomize: true
      });

      var batchRequests = [];
      var i;
      var baseUrl = '/security/query/allowed?component=' + component;
      baseUrl += '&ability=read';
      baseUrl += '&person=/persons/' + me.uuid;

      for (i = 0; i < elements.length; i++) {
        batchRequests.push({
          verb: 'GET',
          href: baseUrl + '&resource=' + elements[i].$$meta.permalink
        });
      }

      operation.attempt(function() {
        needle.put(config.VSKO_API_HOST + '/security/query/batch', batchRequests, reqOptions,
          responseHandlerBatchFn(operation, deferred, me, component));
      });

      return deferred.promise;
    }
  };

};
