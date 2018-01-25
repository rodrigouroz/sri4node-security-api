module.exports = function (component, app, pluginConfig) {
  'use strict';

  // return function (component) {
  return {
    install: function (sriConfig) {

      // As the vsko security implementation depends directly on oauth, don't 
      const oauthValve = require('vsko-authentication')(app);
      oauthValve.install(sriConfig)
      pluginConfig.oauthValve = oauthValve

      const security = require('./js/security')(pluginConfig, sriConfig);

      const check = async function (tx, sriRequest, elements, operation) {
        await security.checkPermissionOnElements(component, tx, sriRequest, elements, operation)
      }

      sriConfig.resources.forEach( resource => {
        // security functions should be FIRST function in handler lists
        resource.afterRead.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'read'))
        resource.afterInsert.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'create'))
        resource.afterUpdate.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'update'))
        resource.beforeDelete.unshift((tx, sriRequest, elements) => check(tx, sriRequest, elements, 'delete'))
      })
    }

  }
  // }
}
