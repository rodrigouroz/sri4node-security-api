var security;

var checkReadPermissionOnSingleElement = function (element, me, component) {
  'use strict';
  return security.checkReadPermissionOnSingleElement(element, me, component);
};

var checkReadPermissionOnSet = function (element, me, component) {
  'use strict';
  return security.checkReadPermissionOnSet(element, me, component);
};

module.exports = function (configuration) {

  security = require('js/security')(configuration);

  return function (component) {
    return {
      checkReadPermission: function (database, elements, me) {
        'use strict';
        if (elements.length === 1) {
          return checkReadPermissionOnSingleElement(elements[0], me, component);
        }

        return checkReadPermissionOnSet(elements, me, component);
      }
    };
  };

};
