var Q = require('q');
var needle = require('needle');
var retry = require('retry');
var common = require('./common');
var utils = require('./utils');
var urlModule = require('url');

exports = module.exports = function (config, sri4nodeUtils) {

  'use strict';

  var reqOptions = {
    username: config.USER,
    password: config.PASSWORD,
    open_timeout: 0, //eslint-disable-line
    json: true,
    proxy: common.getProxyOpts(config.VSKO_API_HOST)
  };

  function constructOperation() {
    return retry.operation({
      retries: 3,
      factor: 3,
      minTimeout: 1000,
      maxTimeout: 5 * 1000,
      randomize: true
    });
  }

  function fail(deferred) {
    return deferred.reject({
      statusCode: 403,
      body: '<h1>403 Forbidden</h1>'
    });
  }

  function responseHandlerSingleFn(op, deferred) {

    return function (err, response) {

      if (err) {

        if (op.retry(err)) {
          return;
        }

        deferred.reject(err);
      }

      if (response.statusCode === 200 && response.body === true) {
        deferred.resolve();
      } else {
        fail(deferred);
      }

    };
  }

  function responseHandlerBatchFn(op, deferred) {

    return function (err, response) {

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
          fail(deferred);
        }

      } else {
        fail(deferred);
      }

    };
  }

  function getResourceGroups(permission, me, component) {

    var operation = constructOperation();
    var deferred = Q.defer();

    var url = config.VSKO_API_HOST + '/security/query/resources/raw?component=' + component;
    url += '&ability=' + permission;
    url += '&person=/persons/' + me.uuid;

    function handler(op, promise) {

      return function (err, response) {

        if (err) {

          if (op.retry(err)) {
            return;
          }

          promise.reject(err);
        }

        if (response.statusCode === 200) {
          promise.resolve(response.body);
        } else {
          promise.reject();
        }

      };
    }

    operation.attempt(function () {
      needle.get(url, reqOptions, handler(operation, deferred));
    });

    return deferred.promise;
  }

  function checkAlterPermissionOnElement(permission, element, me, component, database) {

    var promises = [];
    var deferred = Q.defer();
    var query;
    var reducedGroups;
    var groupUrl;
    var i;

    function checkElementExists(promise) {

      return function (result) {

        if (result.rows.length === 1) {
          promise.resolve();
        } else {
          promise.reject();
        }
      };
    }

    // get resource groups from security
    getResourceGroups(permission, me, component).then(function (groups) {

      var groupDeferred;

      // use reduce functions
      reducedGroups = utils.reduceRawGroups(groups);

      // for each group, convert to sql and check if the new element is there
      for (i = 0; i < reducedGroups.length; i++) {
        groupUrl = urlModule.parse(reducedGroups[i], true);
        query = sri4nodeUtils.prepareSQL('check-resource-exists');
        sri4nodeUtils.convertListResourceURLToSQL(groupUrl.pathname, groupUrl.query, false, database, query);
        query.sql(' AND \"key\" = ').param(element.key);
        groupDeferred = Q.defer();
        promises.push(groupDeferred.promise);
        sri4nodeUtils.executeSQL(database, query).then(checkElementExists(groupDeferred));
      }

      // at least one succeded
      Q.allSettled(promises).then(function (results) {

        if (results.some(function (result) { return result.state === 'fulfilled'; })) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      });

    });

    return deferred.promise;
  }

  function checkAlterPermissionOnSet(permission, elements, me, component, database) {

    var i;
    var deferred = Q.defer();
    var promises = [];

    for (i = 0; i < elements.length; i++) {

      promises.push(checkAlterPermissionOnElement(permission, elements[i], me, component, database));
    }

    Q.all(promises).then(function () {

      deferred.resolve();
    }).fail(function () {
      fail(deferred);
    });

    return deferred.promise;
  }

  return {
    checkReadPermissionOnSingleElement: function (element, me, component) {

      var deferred = Q.defer();

      var operation = constructOperation();

      var url = config.VSKO_API_HOST + '/security/query/allowed?component=' + component;
      url += '&ability=read';
      url += '&person=/persons/' + me.uuid;
      url += '&resource=' + element.$$meta.permalink;

      operation.attempt(function () {
        needle.get(url, reqOptions, responseHandlerSingleFn(operation, deferred));
      });

      return deferred.promise;

    },
    checkReadPermissionOnSet: function (elements, me, component) {

      var deferred = Q.defer();

      var operation = constructOperation();

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

      operation.attempt(function () {
        needle.put(config.VSKO_API_HOST + '/security/query/batch', batchRequests, reqOptions,
          responseHandlerBatchFn(operation, deferred));
      });

      return deferred.promise;
    },
    checkInsertPermissionOnSet: function (elements, me, component, database) {

      return checkAlterPermissionOnSet('create', elements, me, component, database);
    },
    checkUpdatePermissionOnSet: function (elements, me, component, database) {

      return checkAlterPermissionOnSet('update', elements, me, component, database);
    },
    checkDeletePermissionOnSet: function (elements, me, component, database) {

      return checkAlterPermissionOnSet('delete', elements, me, component, database);
    }
  };

};
