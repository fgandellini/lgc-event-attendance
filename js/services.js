var services = angular.module('lgcAttendance.services', ['config', 'mongolabResourceHttp']);

services.factory('Events', ['$mongolabResourceHttp',
  function($mongolabResourceHttp) {
    return $mongolabResourceHttp('events');
  }
]);