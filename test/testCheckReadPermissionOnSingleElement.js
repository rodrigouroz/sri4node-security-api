var assert = require('assert');
var nock = require('nock');

var configuration = {
  USER: '***REMOVED***',
  PASSWORD: '***REMOVED***',
  VSKO_API_HOST: 'https://testapi.vsko.be'
};

var security = require('../js/security')(configuration);

describe('Check read permission on single element', function() {
  'use strict';

  var me;
  var component;

  before(function() {
    component = '/security/components/persons-api';
    me = {
      uuid: '6c0592b0-1ea6-4f38-9d08-31dc793062ba'
    };
    
    nock('https://testapi.vsko.be')
      .get('/security/query/allowed?component=/security/components/persons-api&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/b217e4e4-aae0-45df-9f62-7a68ec87b3fe')
      .reply(200, false);

    nock('https://testapi.vsko.be')
      .get('/security/query/allowed?component=/security/components/persons-api&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/4561ad63-960e-4d07-a463-66ce9f7f7085')
      .reply(200, true);
  });

  it('should reject the read of an element with a proper error object', function() {
    var element = {
      $$meta: {
        permalink: '/persons/b217e4e4-aae0-45df-9f62-7a68ec87b3fe'
      }
    };
    return security.checkReadPermissionOnSingleElement(element, me, component).fail(function(error) {
      assert.equal(403, error.statusCode);
      assert.equal('<h1>403 Forbidden</h1>', error.body);

    });
  });

  it('should allow the read of an element', function() {
    var element = {
      $$meta: {
        permalink: '/persons/4561ad63-960e-4d07-a463-66ce9f7f7085'
      }
    };
    return security.checkReadPermissionOnSingleElement(element, me, component).then(function(result) {
      assert(true);

    });
  });


});
