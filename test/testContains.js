var assert = require('assert');
var utils = require('../js/utils');

describe('Reduce Security raw groups', function () {
  'use strict';

  it('should return true if the collections contains the element for a generic query', function () {
    var groups = ['/content', '/content?contentTypeFilter=application%2Fmsword'];

    assert(groups.some(utils.contains('/content')));
  });

  it('should return true if the collections contains the element for a filtered query', function () {
    var groups = ['/content', '/content?type=CURRICULUM'];

    assert(groups.some(utils.contains('/content?type=CURRICULUM&root=/content/ba7f4bec-0ace-45ec-b152-fe28246b9270')));
  });

});
