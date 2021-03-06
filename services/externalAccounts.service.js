(function() {
  'use strict';

  angular.module('tc.services').factory('ExternalAccountService', ExternalAccountService);

  ExternalAccountService.$inject = ['$q', '$log', 'CONSTANTS', 'auth', 'ApiService', 'UserService', 'Helpers'];

  function ExternalAccountService($q, $log, CONSTANTS, auth, ApiService, UserService, Helpers) {
    var auth0 = auth;
    $log = $log.getInstance('ExternalAccountService');

    var memberApi = ApiService.getApiServiceProvider('MEMBER');
    var userApi = ApiService.getApiServiceProvider('USER');

    var service = {
      getAllExternalLinks: getAllExternalLinks,
      getLinkedAccounts: getLinkedAccounts,
      getAccountsData: getAccountsData,
      linkExternalAccount: linkExternalAccount,
      unlinkExternalAccount: unlinkExternalAccount
    };
    return service;

    //////////////////////

    /**
     * @brief Retrieves a list of linked external accounts for the user.
     *
     * @param  userId
     * @return list of linked Accounts
     */
    function getLinkedAccounts(userId) {
      return userApi.one('users', userId).get({fields:'profiles'})
      .then(function(result) {
        angular.forEach(result.profiles, function(p) {
          p.provider = p.providerType;
        });
        return result.profiles;
      });
    }

    function getAccountsData(userHandle) {
      return memberApi.one('members', userHandle)
        .withHttpConfig({skipAuthorization: true})
        .customGET('externalAccounts')
        .then(function(data) {
          return data;
        });
    }

    function unlinkExternalAccount(account) {
      var user = UserService.getUserIdentity();
      return $q(function($resolve, $reject) {
        UserService.removeSocialProfile(user.userId, account)
        .then(function(resp) {
          $log.debug('Succesfully unlinked account: ' + JSON.stringify(resp));
          $resolve({
            status: 'SUCCESS'
          });
        })
        .catch(function(resp) {
          $log.error('Error unlinking account: ' + resp.data.result.content);
          var status = 'FATAL_ERROR';
          var msg = resp.data.result.content;
          if (resp.status === 404) {
            status = 'SOCIAL_PROFILE_NOT_EXIST';
          }

          $reject({
            status: status,
            msg: msg
          });
        });
      });
    }

    function _convertAccountsIntoCards(links, data, includePending) {
      var _cards = [];
      if (!links.length) {

        // populate the externalLinks for external-account-data directive with info from ext accounts data
        var providers = _.omit(data, ['userId', 'updatedAt', 'createdAt', 'createdBy', 'updatedBy', 'handle']);

        angular.forEach(_.keys(providers), function(p) {
          if (providers[p]) {
            links.push({provider: p});
          }
        });
      }

      // handling external accounts first
      angular.forEach(links, function(link) {
        var provider = link.provider;
        if (data[provider]) {
          // add data
          _cards.push({provider: provider, data: data[provider]});
        } else if (includePending) {
          // add pending card
          _cards.push({provider: provider, data: {handle: link.name, status: 'PENDING'}});
        }
      });
      $log.debug('Processed Accounts Cards: ' + JSON.stringify(_cards));
      return _cards;
    }

    function getAllExternalLinks(userHandle, userId, includePending) {
      return $q(function(resolve, reject) {
        var _promises = [getAccountsData(userHandle)];
        if (includePending) {
          _promises.push(getLinkedAccounts(userId));
        }

        $q.all(_promises).then(function(data) {
          var links = includePending ? data[1] : [];
          var _cards = _convertAccountsIntoCards(links, data[0].plain(), includePending);

          // TODO add weblinks
          resolve(_cards);
        }).catch(function(resp) {
          $log.error(resp);
          reject(resp);
        });
      });
    }

    function linkExternalAccount(provider, callbackUrl) {
      return $q(function(resolve, reject) {
        // supported backends
        var backends = ['facebook', 'google-oauth2', 'bitbucket', 'github', 'linkedin', 'stackoverflow', 'dribbble'];
        if (backends.indexOf(provider) > -1) {
          auth0.signin({
              popup: true,
              connection: provider,
              scope: 'openid profile offline_access',
              state: callbackUrl
            },
            function(profile, idToken, accessToken, state, refreshToken) {
              $log.debug('onSocialLoginSuccess');
              var socialData = Helpers.getSocialUserData(profile, accessToken);
              var user = UserService.getUserIdentity();
              var postData = {
                userId: socialData.socialUserId,
                name: socialData.username,// TODO it should be first+last Name
                email: socialData.email,
                emailVerified: false,
                providerType: socialData.socialProvider,
                context: {
                  handle: socialData.username,
                  accessToken: socialData.accessToken
                }
              };
              if (socialData.accessTokenSecret) {
                postData.context.accessTokenSecret = socialData.accessTokenSecret;
              }

              $log.debug('link API postdata: ' + JSON.stringify(postData));
              userApi.one('users', user.userId).customPOST(postData, 'profiles', {}, {})
                .then(function(resp) {
                  $log.debug('Succesfully linked account: ' + JSON.stringify(resp));

                  // construct 'card' object and resolve it
                  var _data = {
                    status: 'SUCCESS',
                    linkedAccount: {
                      provider: provider,
                      data: postData
                    }
                  };
                  _data.linkedAccount.data.status = 'PENDING';
                  resolve(_data);
                })
                .catch(function(resp) {
                  var errorStatus = 'FATAL_ERROR';
                  $log.error('Error linking account: ' + resp.data.result.content);
                  if (resp.data.result && resp.data.result.status === 400) {
                    errorStatus = 'SOCIAL_PROFILE_ALREADY_EXISTS';
                  }

                  reject({
                    status: errorStatus,
                    msg: resp.data.result.content
                  });
                });
            },
            function(error) {
              $log.warn('onSocialLoginFailure ' + JSON.stringify(error));
              reject(error);
            }
          );
        } else {
          $log.error('Unsupported social login backend: ' + provider);
          $q.reject({
            status: 'failed',
            error: 'Unsupported social login backend \'' + provider + '\''
          });
        }
      });
    }
  }
})();
