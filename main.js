var security;

module.exports = function (configuration, sri4nodeUtils) {
  'use strict';

  security = require('./js/security')(configuration, sri4nodeUtils);

  return function (component) {
    return {
      checkReadPermission: function (database, elements, me) {
        if (elements.length === 1) {
          return security.checkReadPermissionOnSingleElement(elements[0], me, component);
        }

        return security.checkReadPermissionOnSet(elements, me, component);
      },
      checkInsertPermission: function (database, elements, me) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        return security.checkInsertPermissionOnSet(elements, me, component, database);
      },
      checkUpdatePermission: function (database, elements, me) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        return security.checkUpdatePermissionOnSet(elements, me, component, database);
      },
      checkDeletePermission: function (database, elements, me) {
        // sanitize, always pass an array to the check function
        if (!Array.isArray(elements)) {
          elements = [elements];
        }

        return security.checkDeletePermissionOnSet(elements, me, component, database);
      }
    };
  };

};
