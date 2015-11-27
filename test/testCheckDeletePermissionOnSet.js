var assert = require('assert');
var nock = require('nock');
var sri4nodeUtilsMock = require('./sri4nodeUtilsMock');

var configuration = {
  USER: '***REMOVED***',
  PASSWORD: '***REMOVED***',
  VSKO_API_HOST: 'https://testapi.vsko.be'
};

var security;

describe('Check delete permission on a set of elements', function () {
  'use strict';

  var me;
  var response;
  var batch;

  before(function () {

    var url;

    me = {
      uuid: '6c0592b0-1ea6-4f38-9d08-31dc793062ba'
    };

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/persons-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/cf2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    response = [{
      status: 200,
      body: false,
      href: '/security/query/allowed?component=/security/components/persons-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/persons/cf2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/c000eaea-9ce7-2590-e044-d4856467bfb8'
    },
    {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/cf2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    response = [{
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/c000eaea-9ce7-2590-e044-d4856467bfb8'
    },
    {
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/cf2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

    batch = [{
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/d000eaea-9ce7-2590-e044-d4856467bfb8'
    },
    {
      verb: 'GET',
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/df2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    response = [{
      status: 200,
      body: false,
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/d000eaea-9ce7-2590-e044-d4856467bfb8'
    },
    {
      status: 200,
      body: true,
      href: '/security/query/allowed?component=/security/components/organisationalunits-api&ability=delete&person=' +
        '/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba&resource=/organisations/df2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    nock(configuration.VSKO_API_HOST)
      .put('/security/query/batch', batch)
      .reply(200, response);

    response = [
      '/boardings',
      '/organisationalunits/relations?statuses=ACTIVE,ABOLISHED,FUTURE'
    ];

    url = '/security/query/resources/raw?component=/security/components/organisationalunits-api';
    url += '&ability=delete&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba';

    nock(configuration.VSKO_API_HOST)
      .get(url)
      .reply(200, response);

    response = ['/persons?q=rodri'];

    url = '/security/query/resources/raw?component=/security/components/persons-api';
    url += '&ability=delete&person=/persons/6c0592b0-1ea6-4f38-9d08-31dc793062ba';

    nock(configuration.VSKO_API_HOST)
      .get(url)
      .reply(200, response);
  });

  it('should reject the delete of a set of elements with a proper error object', function () {

    var elements = [{
      path: '/persons/cf2dccb0-d944-4402-e044-d4856467bfb8',
      body: '/persons/cf2dccb0-d944-4402-e044-d4856467bfb8'
    }];

    var databaseMock = {};

    security = require('../js/security')(configuration, sri4nodeUtilsMock([]));

    return security.checkDeletePermissionOnSet(elements, me, '/security/components/persons-api',
      databaseMock).fail(function (error) {
        assert.equal(403, error.statusCode);
        assert.equal('<h1>403 Forbidden</h1>', error.body);

      });
  });

  it('should allow the delete of a set of elements', function () {

    var elements = [];

    elements.push({
      path: '/organisations/c000eaea-9ce7-2590-e044-d4856467bfb8',
      body: '/organisations/c000eaea-9ce7-2590-e044-d4856467bfb8'
    });

    elements.push({
      path: '/organisations/cf2dccb0-d944-4402-e044-d4856467bfb8',
      body: '/organisations/cf2dccb0-d944-4402-e044-d4856467bfb8'
    });

    var databaseMock = {};

    security = require('../js/security')(configuration,
      sri4nodeUtilsMock([]));

    return security.checkDeletePermissionOnSet(elements, me, '/security/components/organisationalunits-api',
      databaseMock).then(function () {
        assert(true);
      });
  });


  it('should allow the update of an element that the allowed query returns false but the direct ' +
    'check in the database works', function () {
    var elements = [];

    elements.push({
      path: '/organisations/d000eaea-9ce7-2590-e044-d4856467bfb8',
      body: '/organisations/d000eaea-9ce7-2590-e044-d4856467bfb8'
    });

    elements.push({
      path: '/organisations/df2dccb0-d944-4402-e044-d4856467bfb8',
      body: '/organisations/df2dccb0-d944-4402-e044-d4856467bfb8'
    });

    var databaseMock = {};

    security = require('../js/security')(configuration,
      sri4nodeUtilsMock(['df2dccb0-d944-4402-e044-d4856467bfb8',
        'd000eaea-9ce7-2590-e044-d4856467bfb8']));

    return security.checkDeletePermissionOnSet(elements, me, '/security/components/organisationalunits-api',
      databaseMock).then(function () {
        assert(true);
      });
  });
});
