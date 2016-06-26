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
          this.keys = [key];
          return this;
        },
        array: function (keys) {
          this.keys = keys;
          return this;
        }
      };

    },
    convertListResourceURLToSQL: function () {
      return Q.fcall(function () {
        return true;
      });
    },
    executeSQL: function (database, query) {

      return Q.fcall(function () {
        var key;
        var result = {
          rows: []
        };
        var foundKeys = query.keys.filter((filteredKey) => {
          return validKeys.indexOf(filteredKey) !== -1;
        });
        for (key in foundKeys) {
          if (foundKeys.hasOwnProperty(key)) {

            result.rows.push({key: foundKeys[key]});
          }
        }

        return result;
      });
    }
  };


};
