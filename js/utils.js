var isHrefAPermalink = function (href) {
  'use strict';
  return href.match(/^\/[a-z\/]*\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/);
};

var getPartFromPermalink = function (permalink, part) {
  'use strict';
  var groups;

  if (isHrefAPermalink(permalink)) {
    groups = permalink.match(/^(\/[a-z\/]*)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/);
    if (part === 'resource') {
      return groups[1];
    } else if (part === 'key') {
      return groups[2];
    }
  }

  return null;
};

var getResourceTypeFromPermalink = function (permalink) {
  'use strict';
  return getPartFromPermalink(permalink, 'resource');
};

var getKeyFromPermalink = function (permalink) {
  'use strict';
  return getPartFromPermalink(permalink, 'key');
};

// splits an href into an object that has the attributes `resource` and `parts`
// `parts` is an array containing pairs of parameter=value
var splitHrefIntoResourceAndParts = function (href) {
  'use strict';
  var groups = href.match(/^(\/[a-z\/]*)(\?(.+))?$/);
  var result = {};

  if (groups) {
    result.resource = groups[1];
    if (groups[3]) {
      result.parts = groups[3].split('&');
    } else {
      result.parts = [];
    }

  }

  return result;
};

var removeIfPresent = function (set) {
  'use strict';
  return function (part) {

    return set.indexOf(part) === -1;
  };

};

var isSubSet = function (set, testSet) {
  'use strict';

  // if after removing all the elements from the set we get an empty set, then testSet contains set
  return testSet && testSet.length < set.length && testSet.filter(removeIfPresent(set)).length === 0;
};

var contains = function (testGroup) {
  'use strict';

  // split a group (href) into its resource and its parts
  var resourceAndParts = splitHrefIntoResourceAndParts(testGroup);


  return function (group) {
    var groupResourceAndParts = splitHrefIntoResourceAndParts(group);

    // a group contains another if they belong to the same resource and the tested group is a subset of the group
    return groupResourceAndParts.resource === resourceAndParts.resource &&
      isSubSet(resourceAndParts.parts, groupResourceAndParts.parts);
  };

};

var reduce = function (group, index, array) {
  'use strict';

  // permalinks are not reduced
  if (isHrefAPermalink(group)) {
    return true;
  }

  // filter if there's at least one group that contains this one
  return !array.some(contains(group));
};

module.exports = {

  // removes raw groups that are subsets of other raw groups in the same set
  reduceRawGroups: function (rawGroups) {
    'use strict';

    return rawGroups.filter(reduce);

  },
  getResourceTypeFromPermalink: getResourceTypeFromPermalink,
  getKeyFromPermalink: getKeyFromPermalink

};
