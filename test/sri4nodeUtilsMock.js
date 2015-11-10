var Q = require('q');

module.exports = function (validKeys) {
  'use strict';

  if (!validKeys) {
    validKeys = [];
  }

  return {
    prepareSQL: function () {

      return {

        sql: function () {
          return this;
        },
        param: function (key) {
          this.key = key;
        }
      };

    },
    convertListResourceURLToSQL: function () {

    },
    executeSQL: function (database, query) {

      return Q.fcall(function () {
        var result = {
          rows: []
        };
        if (validKeys.indexOf(query.key) !== -1) {
          result.rows.push({key: query.key});
        }

        return result;
      });
    }
  };


};
