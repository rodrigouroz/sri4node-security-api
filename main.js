module.exports = function (component) {
  'use strict';

  const config = require('./js/config');

  // return function (component) {
  return {
    install: function (sriConfig) {
      const security = require('./js/security')(config, sriConfig);

      const checkAfter = async function (tx, me, reqUrl, operation, elements) {
        return (await security.checkPermissionOnElements(component, tx, me, reqUrl, operation, elements));
      }

      const checkSecure = async function (tx, me, reqUrl, verb) {
        if (verb === 'DELETE') {
          // DELETE is the only method which can be (and must be) security screened before execution (in a secure function)
          console.log(reqUrl)
          var elements = {};
          return (await security.checkPermissionOnElements(component, tx, me, reqUrl, 'delete', elements))
        } else {
          return true; 
        }
      }

      sriConfig.resources.forEach( resource => {
        // security functions should be FIRST function in handler lists
        resource.afterread.unshift(checkAfter)
        resource.afterinsert.unshift(checkAfter)
        resource.afterupdate.unshift(checkAfter)
        resource.secure.unshift(checkSecure)
      })
    }

  }
  // }
}
