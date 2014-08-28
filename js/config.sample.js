var config = angular.module('config', []);

config.constant('AUTH_TOKEN', 'admin-mode-token');

config.constant('MONGOLAB_CONFIG', {
  API_KEY: 'mongolab-api-key',
  DB_NAME: 'da_name'
});

config.constant('SINGERS', [{
  name: 'Singer 1',
  role: 's'
}, {
  name: 'Singer 2',
  role: 'ms'
}, {
  name: 'Singer 3',
  role: 'a'
}, {
  name: 'Singer 4',
  role: 't'
}, {
  name: 'Singer 5',
  role: 'b'
}]);