(function() {
  'use strict';

  angular.module('tc.services').factory('ExternalWebLinksService', ExternalWebLinksService);

  ExternalWebLinksService.$inject = ['$log', 'CONSTANTS', 'ApiService', '$q'];

  function ExternalWebLinksService($log, CONSTANTS, ApiService, $q) {
    $log = $log.getInstance("ExternalWebLinksService");

    var memberApi = ApiService.getApiServiceProvider('MEMBER');

    var service = {
      getLinks: getLinks,
      addLink: addLink,
      removeLink: removeLink
    };
    return service;

    /////////////////////////

    function getLinks(userHandle, includePending) {
      return memberApi.one('members', userHandle)
        .withHttpConfig({skipAuthorization: true})
        .customGET('externalLinks')
        .then(function(links) {
          links = links.plain();
          if (!includePending) {
            _.remove(links, function(l) {
              return _.get(l, 'synchronizedAt') === 0;
            });
          }
          // add provider type as weblink
          links = _(links).forEach(function(l) {
            l.provider = 'weblink';
            if (l.synchronizedAt === 0) {
              l.status = 'PENDING';
            }
          }).value();
          return links;
        });
    }

    function addLink(userHandle, url) {
      return $q(function(resolve, reject) {
        memberApi.one('members', userHandle).customPOST({'url': url}, 'externalLinks')
        .then(function(resp) {
          var _newLink = {
            provider: 'weblink',
            data: resp
          };
          _newLink.data.status = 'PENDING';
          resolve(_newLink);
        })
        .catch(function(resp) {
          var errorStatus = "FATAL_ERROR";
          $log.error("Error adding weblink: " + resp.data.result.content);
          if (resp.data.result && resp.data.result.status === 400) {
            errorStatus = "WEBLINK_ALREADY_EXISTS";
          }
          reject({
            status: errorStatus,
            msg: resp.data.result.content
          });
        });
      });
    }

    function removeLink(userHandle, key) {
      return memberApi.one('members', userHandle).one('externalLinks', key).remove();
    }

  }
})();
