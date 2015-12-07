(function() {
  'use strict';

  angular.module('tc.services').filter('percentage', percentage);

  function percentage() {
    return function(x) {
      return Math.round(x * 100) + '%';
    };
  }

})();
