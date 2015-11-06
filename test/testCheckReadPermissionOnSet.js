var assert = require('assert');
var nock = require('nock');

var configuration = {
  USER: '***REMOVED***',
  PASSWORD: '***REMOVED***',
  VSKO_API_HOST: 'https://testapi.vsko.be'
};

var security = require('../js/security')(configuration);

describe('Check read permission on a set of elements', function() {
  'use strict';

  var me;
  var component;

  before(function() {
    component = '/security/components/persons-api';
    me = {
      uuid: '6c0592b0-1ea6-4f38-9d08-31dc793062ba'
    };
    // https://testapi.vsko.be/security/query/allowed?component=/security/components/persons-api&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/4561ad63-960e-4d07-a463-66ce9f7f7085
    nock('https://testapi.vsko.be')
      .get('/security/query/allowed?component=/security/components/persons-api&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/b217e4e4-aae0-45df-9f62-7a68ec87b3fe')
      .reply(200, false);

    nock('https://testapi.vsko.be')
      .get('/security/query/allowed?component=/security/components/persons-api&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/4561ad63-960e-4d07-a463-66ce9f7f7085')
      .reply(200, true);
  });

  it('should reject the read of a set of elements if it does not have permission for at least one of them', function() {
    var elements = [{
      $$meta: {
        permalink: '/persons/ec59842f-837a-421b-a820-fd0d916385b6'
      }
    }, {
      $$meta: {
        permalink: '/persons/017ea598-fcce-4165-a03b-759950ca48c4'
      }
    }, {
      $$meta: {
        permalink: '/persons/508990f2-1e89-424c-8e3a-fcc292e082ca'
      }
    }];
    return security.checkReadPermissionOnSet(elements, me, component).fail(function(error) {
      assert.equal(403, error.statusCode);
      assert.equal('<h1>403 Forbidden</h1>', error.body);

    });
  });

  it('should allow the read of a set of elements if it has permission to read all the elements in the set', function() {
    var elements = [{
      $$meta: {
        permalink: '/persons/b95fbe1b-755c-4135-83eb-77d743e12443'
      }
    }, {
      $$meta: {
        permalink: '/persons/a7c119d6-8058-4c33-b329-05772c4550eb'
      }
    }, {
      $$meta: {
        permalink: '/persons/3f7510b6-e2a0-435e-8939-875af7363b82'
      }
    }];
    return security.checkReadPermissionOnSet(elements, me, component).then(function(result) {
      assert(true);

    });
  });


});
