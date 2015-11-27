var assert = require('assert');
var nock = require('nock');
var sri4nodeUtilsMock = require('./sri4nodeUtilsMock');

var configuration = {
  USER: '***REMOVED***',
  PASSWORD: '***REMOVED***',
  VSKO_API_HOST: 'https://testapi.vsko.be'
};

var security;

describe('Check read permission on a set of elements', function () {
  'use strict';

  var me;
  var component;

  before(function () {
    component = '/security/components/persons-api';
    me = {
      uuid: '6c0592b0-1ea6-4f38-9d08-31dc793062ba'
    };

    var batch;
    var response;
    var url;

    response = [
      '/persons'
    ];

    url = '/security/query/resources/raw?component=/security/components/persons-api';
    url += '&ability=read&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba';

    nock(configuration.VSKO_API_HOST)
      .get(url)
      .reply(200, response);

    nock(configuration.VSKO_API_HOST)
      .get(url)
      .reply(200, response);

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/ec59842f-837a-421b-a820-fd0d916385b6'
    }, {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/017ea598-fcce-4165-a03b-759950ca48c4'
    }, {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/508990f2-1e89-424c-8e3a-fcc292e082ca'
    }];

    response = [{
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/ec59842f-837a-421b-a820-fd0d916385b6'
    }, {
      status: 200,
      body: false,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/017ea598-fcce-4165-a03b-759950ca48c4'
    }, {
      status: 200,
      body: false,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/508990f2-1e89-424c-8e3a-fcc292e082ca'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/b95fbe1b-755c-4135-83eb-77d743e12443'
    }, {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/a7c119d6-8058-4c33-b329-05772c4550eb'
    }, {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/3f7510b6-e2a0-435e-8939-875af7363b82'
    }];

    response = [{
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/b95fbe1b-755c-4135-83eb-77d743e12443'
    }, {
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/a7c119d6-8058-4c33-b329-05772c4550eb'
    }, {
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/3f7510b6-e2a0-435e-8939-875af7363b82'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/017ea598-fcce-4165-a03b-759950ca48c4'
    }];

    response = [{
      status: 200,
      body: false,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=read' +
        '&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/017ea598-fcce-4165-a03b-759950ca48c4'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

  });

  it('should reject the read of a set of elements if it does not have permission', function () {
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

    var databaseMock = {};

    security = require('../js/security')(configuration, sri4nodeUtilsMock([]));

    return security.checkReadPermissionOnSet(elements, me, component, databaseMock).fail(function (error) {
      assert.equal(403, error.statusCode);
      assert.equal('<h1>403 Forbidden</h1>', error.body);

    });
  });

  it('should allow the read of a set of elements if it has permission to read all the elements', function () {
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

    var databaseMock = {};

    security = require('../js/security')(configuration, sri4nodeUtilsMock([]));

    return security.checkReadPermissionOnSet(elements, me, component, databaseMock).then(function () {
      assert(true);

    });
  });

  it('should allow the read of an element that the allowed query returns false but the direct ' +
    'check in the database works', function () {
    var elements = [{
      $$meta: {
        permalink: '/persons/017ea598-fcce-4165-a03b-759950ca48c4'
      }
    }];

    var databaseMock = {};

    security = require('../js/security')(configuration, sri4nodeUtilsMock(['017ea598-fcce-4165-a03b-759950ca48c4']));

    return security.checkReadPermissionOnSet(elements, me, component, databaseMock).then(function () {
      assert(true);

    });
  });


});
