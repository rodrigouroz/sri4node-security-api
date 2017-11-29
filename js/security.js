var common = require('./common');
var utils = require('./utils');
var urlModule = require('url');

const { SriError, debug } = require('../../sri4node/js/common.js')

const pMemoize = require('p-memoize');
const pReduce = require('p-reduce');
const request = require('requestretry');

const memRequest = pMemoize(request, {maxAge: 5*60*1000}); // cache raw requests for 5 minutes

exports = module.exports = function (config, sriConfig) {

  'use strict';

  const sri4nodeUtils = sriConfig.utils

  const credentials = { 
      'user': config.SRI_USER,     // need ***REMOVED*** configured in application-setup (global)
      'pass': config.SRI_PASSWORD, // need ***REMOVED*** configured in
  }

  async function getResourceGroups(ability, me, component) {
    if (!me) {
      // special case: if me === null (anonymous) we ask for person * (in beveiliging * means public)
      me = '*';
    } else {
      me = '/persons/' + me.uuid;
    }    
    try {  // need SECURITY_API_HOST defined in application-setup (also global)
      const url = config.VSKO_API_HOST + '/security/query/resources/raw?component=' + component
                    + '&ability=' + ability
                    + '&person=' + me;
      // an optimalisation might be to be able to skip ability parameter and cache resources raw for all abilities together
      // (needs changein security API)

      console.log('====================')
      console.log(url)
      console.log('====================')

      const res = await memRequest({url: url, auth: credentials, headers: common.getHeaders(config), json:true})
      if (res.statusCode!=200) {
        throw `security requests returned unexpected status ${res.statusCode}: ${res.body}`
      }
      return res.body
    } catch (error) {
      // TODO: require sri4node (interface)
      console.log(error)
      throw new SriError(503, [{ code: 'security.unavailable',  msg: 'Retrieving security information failed.' }])
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



  async function checkPermissionOnElements(component, tx, me, reqUrl, operation, elements) {

    const resourceType = utils.getResourceFromUrl(reqUrl)

    // the format of elements differs wether it is called on a regulqr resource,result of list query, delete 
    // or expansion list => make a somehow uniform array
    const uniformElements = Array.isArray(elements)
      ? elements.map( e => ({permalink: e.href, deleted: e.$$expanded.$$meta.deleted}) ) // TODO: differentiate between result of list query and expansion
      : [ {permalink: reqUrl, deleted: (elements.$$meta ? elements.$$meta.deleted : false) } ]
   
    if (!uniformElements.every( e => e.permalink.startsWith(resourceType) )) {
      // Do not allow mixed resource output. Does normally not occur.
      debug(`ERR: Mixed resource output: ${uniformElements}`)
      throw new SriError(403, [])
    }

    const resourcesRaw = (await getResourceGroups(operation, me, component))
    console.log('resourcesRaw')
    console.log(resourcesRaw)
        console.log('resourceType')
    console.log(resourceType)

    const relevantRawResources = resourcesRaw.map( rawEntry => rawEntry.toLowerCase() )    
                                             .filter( rawEntry => (utils.getResourceFromUrl(rawEntry) === resourceType) )
    const containsDeletedResources = uniformElements.some( e => e.deleted === true )
    const superUserResource = resourceType + (containsDeletedResources ? '?$$meta.deleted=any' : '')
    if (relevantRawResources.includes(superUserResource)) {
      return true
    }

    const keys = uniformElements.map( element => utils.getKeyFromPermalink(element.permalink) )
    console.log('relevantRawResources:')
    console.log(relevantRawResources)
    const keysNotMatched = await pReduce(relevantRawResources, async (keysNeeded, rawEntry) => {
        console.log('NEEDED KEYS:')
        console.log(keysNeeded)

      if (keysNeeded.length > 0) {
        const matchedkeys = await (checkRawResourceForKeys(tx, rawEntry, keysNeeded))
        console.log('MATCHED KEYS:')
        console.log(matchedkeys)
        return keysNeeded.filter( k => !matchedkeys.includes(k) )
      } else {
        return []
      }
    }, keys)

    if (keysNotMatched.length === 0) {
      return true
    } else {
      debug(`keysNotMatched: ${keysNotMatched}`)
      throw new SriError(403, [])
    }
  }


  return { 
    checkPermissionOnElements
  }








 //const { DefaultDict } = require('pycollections') // TODO: put above

  // const verbToAbility = () => {
  //     'PUT' -> 'create' or 'update' ?! => ask DB? -> win for batch, loose for single request
  //     'DELETE' -> 'delete'
  // }

//   function async checkPermissionBeforeRequest(component, tx, me, reqUrl, requests) {
//     const resourceType = utils.getResourceTypeFromPermalink(reqUrl)

//     // group requests by verb
//     reqDict = requests.reduce( (acc, {url, verb} ) => acc.get(verb).push(url), new DefaultDict([].constructor) )

//     reqDict.items().forEach( ([ verb, urls ]) => { 
//       if (verb === 'DELETE') {
//         // DELETE needs to be security screened before execution, other methods afterwards
//         const resourcesRaw = (await getResourceGroups('delete', me, component))

//       }
//     })


// // TODO: group by verb and then use same code as above (-> seperate function)

//     })

    

//     const relevantRawResources = resourcesRaw.map( rawEntry => rawEntry.toLowerCase() )
//                                              .filter( rawEntry => (getUrlResourceType(rawEntry) === resourceType) )
//     const containsDeletedResources = elements.some( e => e.'$$meta'.deleted === true )
//     const superUserResource = resourceType + (containsDeletedResources ? '?$$meta.deleted=any' : '')
//     if (relevantRawResources.includes(superUserResource)) {
//       return true
//     }

//     const keys = elements.map( element => element.body.key )
//     const keysNotMatched = pReduce(relevantRawResources, async (keysNeeded, rawEntry) => {
//       if (keysNeeded.length > 0) {
//         const matchedkeys = checkRawResourceForKeys(rawEntry, keysNeeded)
//         return keysNeeded.filter( k => matchedkeys.includes(k) )
//       } else {
//         return []
//       }
//     }, keys)

//     if (keysNotMatched.length === 0) {
//       return true
//     } else {
//       throw new SriError(403, [])
//     }
//   }


  // return {

  //   checkReadPermissionOnSet: function (elements, me, component, database, route) {

  //     elements = elements.map(function (element) {
  //       return {
  //         path: element.$$meta.permalink,
  //         body: element
  //       };
  //     });


  //     return checkPermission('read', elements, me, component, database, route);
  //   },
  //   checkInsertPermissionOnSet: function (elements, me, component, database) {

  //     me = '/persons/' + me.uuid;

  //     return checkPermission('create', elements, me, component, database);
  //   },
  //   checkUpdatePermissionOnSet: function (elements, me, component, database) {

  //     me = '/persons/' + me.uuid;

  //     return checkPermission('update', elements, me, component, database);
  //   },
  //   checkDeletePermissionOnSet: function (elements, me, component, tx) {

  //     me = '/persons/' + me.uuid;


  //     return checkPermissionReadResult(component, tx, me, elements) {

  //     return checkPermission('delete', elements, me, component, database);
  //   }
  // };

};
