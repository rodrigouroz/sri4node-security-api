module.exports = function (component, app, pluginConfig) {
  'use strict';

  // return function (component) {
  return {
    install: function (sriConfig) {

      // As the vsko security implementation depends directly on oauth, don't 
      const oauthValve = require('vsko-authentication')(app);
      oauthValve.install(sriConfig)
      pluginConfig.oauthValve = oauthValve

      const security = require('./js/security')(config, sriConfig);

      const check = async function (tx, sriRequest, elements, operation) {
        await security.checkPermissionOnElements(component, tx, sriRequest, elements, operation)
      }

      sriConfig.resources.forEach( resource => {
        // security functions should be FIRST function in handler lists
        resource.afterread.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'read'))
        resource.afterinsert.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'create'))
        resource.afterupdate.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'update'))
        resource.beforedelete.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'delete'))
      })
    }

  }
  // }
}
