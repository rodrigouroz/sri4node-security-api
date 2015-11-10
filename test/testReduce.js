var assert = require('assert');
var utils = require('../js/utils');

describe('Reduce Security raw groups', function () {
  'use strict';

  it('should reduce a list of raw groups that have a subset of a main group', function () {
    var groups = ['/content', '/content?contentTypeFilter=application%2Fmsword'];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/content']);
  });

  it('should not reduce a list of permalinks in a set of raw groups', function () {
    var groups = ['/content', '/content/0a543170-f917-fe1d-925d-9f1bb20d3957'];

    assert.deepEqual(utils.reduceRawGroups(groups), groups);
  });

  it('should not reduce a list of raw groups that are not a subset of each other', function () {
    var groups = ['/content?contentTypeFilter=application%2Fmsword', '/content?contentTypeFilter=image%2Fpng'];

    assert.deepEqual(utils.reduceRawGroups(groups), groups);
  });

  it('should reduce a list of raw groups that have more than a subset of a main group and not ' +
    'reduce groups that are not subset of each other',
    function () {
      var groups = ['/content?contentTypeFilter=application%2Fmsword', '/content?contentTypeFilter=image%2Fpng',
        '/content?contentTypeFilter=application%2Fmsword&importance=HIGH'
      ];

      assert.deepEqual(utils.reduceRawGroups(groups), ['/content?contentTypeFilter=application%2Fmsword',
        '/content?contentTypeFilter=image%2Fpng']);
    });

  it('should reduce a list of raw groups that have more than a subset of a main group', function () {
    var groups = ['/content?type=DOCUMENT', '/content?type=DOCUMENT&importance=HIGH', '/content?nameContains=index',
      '/content'
    ];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/content']);
  });

  it('should reduce a list of raw groups that have subsets of a subset', function () {
    var groups = ['/content?type=DOCUMENT', '/content?type=DOCUMENT&importance=HIGH', '/content?nameContains=index'];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/content?type=DOCUMENT', '/content?nameContains=index']);
  });

  it('should not reduce a list of raw groups that do not have subsets of a subset', function () {
    var groups = ['/content?type=DOCUMENT', '/content?type=DOCUMENT&language=nl',
      '/content?language=nl&importance=HIGH', '/content?nameContains=index'
    ];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/content?type=DOCUMENT', '/content?language=nl&importance=HIGH',
      '/content?nameContains=index'
    ]);
  });

  it('should reduce a list of raw groups that belong to different resources', function () {
    var groups = ['/clbs',
      '/schoolcommunities',
      '/organisations',
      '/cvos',
      '/schoollocations',
      '/organisationalunits/relations',
      '/governinginstitutions',
      '/schools',
      '/clblocations',
      '/boardinglocations',
      '/boardings',
      '/organisationalunits/relations?statuses=ACTIVE,ABOLISHED,FUTURE'
    ];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/clbs',
      '/schoolcommunities',
      '/organisations',
      '/cvos',
      '/schoollocations',
      '/organisationalunits/relations',
      '/governinginstitutions',
      '/schools',
      '/clblocations',
      '/boardinglocations',
      '/boardings'
    ]);
  });

  it('should reduce a list of raw groups that belong to different resources with different levels', function () {
    var groups = ['/content', '/content?language=nl', '/persons?username=rodrigo.uroz'];

    assert.deepEqual(utils.reduceRawGroups(groups), ['/content', '/persons?username=rodrigo.uroz']);
  });

});
