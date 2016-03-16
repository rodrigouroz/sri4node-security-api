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
    headers: common.getHeaders(config)
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

  function getResourceGroups(permission, me, component) {

    var operation = constructOperation();
    var deferred = Q.defer();

    var url = config.SECURITY_API_HOST + '/security/query/resources/raw?component=' + component;
    url += '&ability=' + permission;
    url += '&person=' + me;

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

  function checkDirectPermissionOnElement(key, reducedGroups, me, component, database) {

    var promises = [];
    var deferred = Q.defer();
    var groupDeferred;
    var query;
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

    function resolveQuery(queryConverted, keyConverted, groupConvertedDeferred) {

      return function () {
        queryConverted.sql(' AND \"key\" = ').param(keyConverted);

        sri4nodeUtils.executeSQL(database, queryConverted)
          .then(checkElementExists(groupConvertedDeferred))
          .catch(function () {
            groupConvertedDeferred.reject();
          });
      };

    }

    // for each group, convert to sql and check if the new element is there
    for (i = 0; i < reducedGroups.length; i++) {
      groupUrl = urlModule.parse(reducedGroups[i], true);
      query = sri4nodeUtils.prepareSQL('check-resource-exists');
      groupDeferred = Q.defer();
      promises.push(groupDeferred.promise);
      // there is no guarantee that the group is mapped in the database
      try {

        sri4nodeUtils.convertListResourceURLToSQL(groupUrl.pathname, groupUrl.query, false, database, query).
          then(resolveQuery(query, key, groupDeferred));

      } catch (e) {
        groupDeferred.reject();
      }

    }

    // at least one succeded
    Q.allSettled(promises).then(function (results) {

      if (results.some(function (result) { return result.state === 'fulfilled'; })) {
        deferred.resolve();
      } else {
        deferred.reject();
      }
    });

    return deferred.promise;
  }

  // special case: If route is a subset of the reduction of raw security groups => allow
  function checkSpecialCaseForQuery(reducedGroups, route) {
    return reducedGroups.some(utils.contains(route));
  }

  function checkSpecialCaseForPermalink(reducedGroups, permalink) {
    var type = utils.getResourceTypeFromPermalink(permalink);
    return checkSpecialCaseForQuery(reducedGroups, type);
  }

  function checkSpecialCase(reducedGroups, route) {
    if (utils.isPermalink(route)) {
      return checkSpecialCaseForPermalink(reducedGroups, route);
    }
    return checkSpecialCaseForQuery(reducedGroups, decodeURIComponent(route));
  }

  function getKey(permission, element) {
    if (permission === 'delete') {
      return utils.getKeyFromPermalink(element.body);
    }

    return element.body.key;
  }

  function checkDirectPermissionOnSet(permission, elements, me, component, database, reducedGroups, deferred) {

    var i;

    if (!deferred) {
      deferred = Q.defer();
    }
    var promises = [];

    for (i = 0; i < elements.length; i++) {

      // special case: If reduction of raw security groups yields /{type} -> allow
      if (checkSpecialCaseForPermalink(reducedGroups, elements[i].path)) {
        promises.push(Q.fcall(function () { return true; }));
      } else {
        promises.push(checkDirectPermissionOnElement(getKey(permission, elements[i]), reducedGroups,
          me, component, database));
      }
    }

    Q.all(promises).then(function () {
      deferred.resolve();
    }).fail(function () {
      deferred.reject();
    });

    return deferred.promise;
  }

  function responseHandlerBatchFn(op, deferred, permission, elements, me, component, database, reducedGroups) {

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
          // check direct (in current database transaction)
          checkDirectPermissionOnSet(permission, elements, me, component, database, reducedGroups, deferred);
        }

      } else {
        // check direct (in current database transaction)
        checkDirectPermissionOnSet(permission, elements, me, component, database, reducedGroups, deferred);
      }

    };
  }

  function checkPermission(permission, elements, me, component, database, route) {

    var deferred = Q.defer();

    // 1) get raw groups
    getResourceGroups(permission, me, component).then(function (groups) {
      var reducedGroups = utils.reduceRawGroups(groups);

      // 2) check if route is subset of any raw group => grant access
      if (route && checkSpecialCase(reducedGroups, route)) {
        return deferred.resolve();
      }

      // 3) check against beveiliging
      var operation = constructOperation();

      var batchRequests = [];
      var i;
      var baseUrl = '/security/query/allowed?component=' + component;
      baseUrl += '&ability=' + permission;
      baseUrl += '&person=' + me;

      for (i = 0; i < elements.length; i++) {
        batchRequests.push({
          verb: 'GET',
          href: baseUrl + '&resource=' + elements[i].path
        });
      }

      operation.attempt(function () {
        needle.put(config.SECURITY_API_HOST + '/security/query/batch', batchRequests, reqOptions,
          responseHandlerBatchFn(operation, deferred, permission, elements, me, component, database, reducedGroups));
      });

    });

    return deferred.promise;


  }

  return {

    checkReadPermissionOnSet: function (elements, me, component, database, route, ability) {

      elements = elements.map(function (element) {
        return {
          path: element.$$meta.permalink,
          body: element
        };
      });

      // special case: if me === null (anonymous) we ask for person * (in beveiliging * means public)
      if (!me) {
        me = '*';
      } else {
        me = '/persons/' + me.uuid;
      }

      return checkPermission(ability, elements, me, component, database, route);
    },
    checkInsertPermissionOnSet: function (elements, me, component, database) {

      // we check the permission directly because since it's a new resource the allowed
      // query will return false
      me = '/persons/' + me.uuid;

      return getResourceGroups('create', me, component).then(function (groups) {

        return checkDirectPermissionOnSet('create', elements, me, component, database, utils.reduceRawGroups(groups));

      });

    },
    checkUpdatePermissionOnSet: function (elements, me, component, database) {

      me = '/persons/' + me.uuid;

      return checkPermission('update', elements, me, component, database);
    },
    checkDeletePermissionOnSet: function (elements, me, component, database) {

      me = '/persons/' + me.uuid;

      return checkPermission('delete', elements, me, component, database);
    }
  };

};
