var Q = require('q');

var security;

module.exports = function (configuration, sri4nodeUtils) {
  'use strict';

  security = require('./js/security')(configuration, sri4nodeUtils);

  return function (component) {
    return {
      // special case: ability can be something different for checking sub resources
      checkReadPermission: function (database, elements, me, route, ability) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        if (!ability) {
          ability = 'read';
        }

        return security.checkReadPermissionOnSet(elements, me, component, database, route, ability);
      },
      checkInsertPermission: function (database, elements, me) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        return security.checkInsertPermissionOnSet(elements, me, component, database);
      },
      checkUpdatePermission: function (database, elements, me, route) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        return security.checkUpdatePermissionOnSet(elements, me, component, database, route);
      },
      checkDeletePermission: function (req, res, database, me, route) {

        // this is called from a secure function in sri4node, which is used on each Request
        // we only continue if the request is a DELETE operation
        if (req.method !== 'DELETE') {
          return Q.fcall(function () { return true; });
        }

        var elements = {
          path: req.route.path,
          body: req.route.path
        };

        return security.checkDeletePermissionOnSet(elements, me, component, database, route);
      }
    };
  };

};
