var assert = require('assert');
var utils = require('../js/utils');

describe('Reduce Security raw groups', function () {
  'use strict';

  it('should reduce a list of raw groups that have a subset of a main group', function () {
    var groups = ['/content', '/content?contentTypeFilter=application%2Fmsword'];

    assert.equal(['/content'], utils.reduceRawGroups(groups));
  });

  it('should not reduce a list of permalinks in a set of raw groups', function () {
    var groups = ['/content', '/content/0a543170-f917-fe1d-925d-9f1bb20d3957'];

    assert.equal(groups, utils.reduceRawGroups(groups));
  });

  it('should not reduce a list of raw groups that are not a subset of each other', function () {
    var groups = ['/content?contentTypeFilter=application%2Fmsword', '/content?contentTypeFilter=image%2Fpng'];

    assert.equal(groups, utils.reduceRawGroups(groups));
  });

  it('should reduce a list of raw groups that have more than a subset of a main group and not ' +
   'reduce groups that are not subset of each other', function () {
    var groups = ['/content?contentTypeFilter=application%2Fmsword', '/content?contentTypeFilter=image%2Fpng',
      '/content?contentTypeFilter=application%2Fmsword&importance=HIGH'];

    assert.equal(['/content?contentTypeFilter=application%2Fmsword', '/content?contentTypeFilter=image%2Fpng'],
      utils.reduceRawGroups(groups));
  });

  it('should reduce a list of raw groups that have more than a subset of a main group', function () {
    var groups = ['/content?type=DOCUMENT', '/content?type=DOCUMENT&importance=HIGH', '/content?nameContains=index',
      '/content'];

    assert.equal(['/content'], utils.reduceRawGroups(groups));
  });

  it('should reduce a list of raw groups that have subsets of a subset', function () {
    var groups = ['/content?type=DOCUMENT', '/content?type=DOCUMENT&importance=HIGH', '/content?nameContains=index'];

    assert.equal(['/content?type=DOCUMENT', '/content?nameContains=index'], utils.reduceRawGroups(groups));
  });

});
