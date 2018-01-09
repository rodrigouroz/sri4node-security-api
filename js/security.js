var common = require('./common');
var utils = require('./utils');
var urlModule = require('url');

const { SriError, debug } = require('../../sri4node/js/common.js')

const _ = require('lodash');
const pMemoize = require('p-memoize');
const pReduce = require('p-reduce');
const request = require('requestretry');

const memRequest = pMemoize(request, {maxAge: 5*60*1000}); // cache raw requests for 5 minutes

exports = module.exports = function (config, sriConfig) {

  'use strict';

  const sri4nodeUtils = sriConfig.utils

  const credentials = { 
      'user': config.sriUser,
      'pass': config.sriPassword 
  }

  async function getResourceGroups(ability, userObject, component) {

    // if userObject === null (anonymous) we ask for person '*' which means public in 'beveiliging'
    const userRef = userObject ? '/persons/' + userObject.uuid : '*'
    try {  // need SECURITY_API_HOST defined in application-setup (also global)
      const url = config.vskoApiHost + '/security/query/resources/raw?component=' + component
                    + '&ability=' + ability
                    + '&person=' + userRef;
      // an optimalisation might be to be able to skip ability parameter and cache resources raw for all abilities together
      // (needs change in security API)

      debug('Fetch raw resources at:')
      debug(url)

      const res = await memRequest({url: url, auth: credentials, headers: common.getHeaders(config), json:true})
      if (res.statusCode!=200) {
        throw `security requests returned unexpected status ${res.statusCode}: ${res.body}`
      }
      return res.body
    } catch (error) {
      console.log('____________________________ E R R O R ____________________________________________________') 
      console.log(error)
      console.log('___________________________________________________________________________________________') 
      throw new SriError({status: 503, errors: [{ code: 'security.unavailable',  msg: 'Retrieving security information failed.' }]})
    }
  }


  const checkRawResourceForKeys = async (tx, rawEntry, keys) => {
    if (utils.isPermalink(rawEntry)) {
      const permalinkKey = utils.getKeyFromPermalink(rawEntry)
      if (keys.include(permalinkKey)) {
        return [ permalinkKey ]
      } else {
        return []
      }
    } else {
      const rawUrl = urlModule.parse(rawEntry, true);
      const query = sri4nodeUtils.prepareSQL('check-resource-exist');

      // there is no guarantee that the group is mapped in the database
      sri4nodeUtils.convertListResourceURLToSQL(rawUrl.pathname, rawUrl.query, false, tx, query)
      query.sql(' AND \"key\" IN (').array(keys).sql(')');

      const rows = await sri4nodeUtils.executeSQL(tx, query)
      return rows.map( r => r.key )  // TODO: verify
    }
  }



  async function checkPermissionOnElements(component, tx, sriRequest, elements, operation) {
    const resourceTypes = _.uniq(elements.map( e => utils.getResourceFromUrl(e.permalink) ))

    if (resourceTypes.length > 1) {
      // Do not allow mixed resource output. Does normally not occur.
      console.log(`ERR: Mixed resource output:`)
      console.log(elements)
      throw new SriError({status: 403})
    }

    const [ resourceType ] = resourceTypes

    const resourcesRaw = (await getResourceGroups(operation, sriRequest.userObject, component))

    const relevantRawResources = resourcesRaw.map( rawEntry => rawEntry.toLowerCase() )    
                                             .filter( rawEntry => (utils.getResourceFromUrl(rawEntry) === resourceType) )

    const superUserResource = resourceType + (sriRequest.containsDeleted ? '?$$meta.deleted=any' : '')
    if (relevantRawResources.includes(superUserResource)) {
      return true
    }

    const keys = elements.map( element => utils.getKeyFromPermalink(element.permalink) )
    debug('relevantRawResources:')
    debug(relevantRawResources)
    const keysNotMatched = await pReduce(relevantRawResources, async (keysNeeded, rawEntry) => {
        debug('NEEDED KEYS:')
        debug(keysNeeded)

      if (keysNeeded.length > 0) {
        const matchedkeys = await (checkRawResourceForKeys(tx, rawEntry, keysNeeded))
        debug('MATCHED KEYS:')
        debug(matchedkeys)
        return keysNeeded.filter( k => !matchedkeys.includes(k) )
      } else {
        return []
      }
    }, keys)

    if (keysNotMatched.length > 0) {
      debug(`keysNotMatched: ${keysNotMatched}`)

      // Notify the oauthValve that the current request is forbidden. The valve might act
      // according to this information by throwing an SriError object (for example a redirect to a 
      // login page or an error in case of a bad authentication token). 
      config.oauthValve.handleForbiddenBySecurity(sriRequest)

      // If the valve did not throw an SriError, the default response 403 Forbidden is returned.
      throw new SriError({status: 403})
    }
  }

  return { 
    checkPermissionOnElements
  }

};
