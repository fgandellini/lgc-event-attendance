var app = angular.module('lgcAttendance', ['config', 'ionic', 'lgcAttendance.services']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('events', {
      url: '/events?token',
      templateUrl: 'events.html'
    })
    .state('new', {
      url: "/events/new",
      templateUrl: 'attendees.html'
    })
    .state('attendees', {
      url: "/events/:eventId/attendees",
      templateUrl: 'attendees.html'
    });

  $urlRouterProvider.otherwise("/events");
});

app.controller('EventsCtrl', ['AUTH_TOKEN', 'SINGERS', '$stateParams', '$rootScope', '$scope', '$state', '$ionicModal', '$ionicLoading', 'Events',
  function(AUTH_TOKEN, SINGERS, $stateParams, $rootScope, $scope, $state, $ionicModal, $ionicLoading, Events) {

    $rootScope.adminMode = ($stateParams.token === AUTH_TOKEN);

    $scope.showDelete = false;
    $scope.listCanSwipe = true;

    $ionicModal.fromTemplateUrl('new-event.html', function(modal) {
      $scope.newEventModal = modal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    $ionicModal.fromTemplateUrl('edit-event.html', function(modal) {
      $scope.editEventModal = modal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    var showLoading = function() {
      $ionicLoading.show({
        template: '<i class="icon ion-loading-c loader"></i>'
      });
    };

    var hideLoading = function() {
      $ionicLoading.hide();
    };

    showLoading();

    Events.all().then(function(events) {
      _.map(events, function(event) {
        event.attendance = _.countBy(_.filter(event.attendees, 'confirmed'), 'role');
        if (_.isEmpty(event.attendance)) {
          event.attendance = null;
        }
        return event;
      });
      $scope.events = _.sortBy(events, 'date');
      hideLoading();
    }, function() {
      //$rootScope.adminMode = false;
      $scope.events = [];
      hideLoading();
      alert(':(\nNon riesco a contattare il database!\nRiprova tra qualche istante.');
    });

    var formatAttendanceAbsValues = function(attendees) {
      var confirmed = _.countBy(_.filter(attendees, 'confirmed'), 'role');
      return formatAttendanceRole('s', confirmed.s) +
        formatAttendanceRole('ms', confirmed.ms) +
        formatAttendanceRole('a', confirmed.a) +
        formatAttendanceRole('t', confirmed.t) +
        formatAttendanceRole('b', confirmed.b);
    };

    var formatAttendanceRole = function(role, confirmed) {
      var att = '';
      if (confirmed) {
        att = role + ':' + confirmed + ' ';
      }
      return att;
    };

    var formatAttendanceRateValues = function(attendees) {
      var roles = _.countBy(SINGERS, 'role');
      var confirmed = _.countBy(_.filter(attendees, 'confirmed'), 'role');
      return 'S:' + rate(confirmed['s'], roles['s']) + '%' +
        ' MS:' + rate(confirmed['ms'], roles['ms']) + '%' +
        ' A:' + rate(confirmed['a'], roles['a']) + '%' +
        ' T:' + rate(confirmed['t'], roles['t']) + '%' +
        ' B:' + rate(confirmed['b'], roles['b']) + '%';
    };

    var rate = function(confirmed, total) {
      c = confirmed || 0;
      return Math.ceil(c * 100.0 / total);
    };

    $scope.toggleDelete = function() {
      $scope.showDelete = !$scope.showDelete;
    };

    $scope.createEvent = function(event) {
      var e = event || {};
      var newEvent = new Events();

      newEvent.type = e.type || 'generic';
      newEvent.name = e.name || 'Evento LGC';
      newEvent.date = e.date || null;
      newEvent.time = e.time || null;
      newEvent.location = e.location || null;
      newEvent.clothing = e.clothing || null;
      newEvent.meetingTime = e.meetingTime || null;
      newEvent.notes = e.notes || null;
      newEvent.attendees = initAttendees();

      newEvent.$save().then(function(event) {
        $scope.events.push(event);
        $scope.showDelete = false;
        $scope.newEventModal.hide();
      });

    };

    var extractDate = function(date) {
      return date.getUTCFullYear() +
        '-' + pad(date.getUTCMonth() + 1) +
        '-' + pad(date.getUTCDate());
    };

    var extractTime = function(date) {
      return pad(date.getUTCHours()) +
        ':' + pad(date.getUTCMinutes());
    }

    var pad = function(number) {
      if (number < 10) {
        return '0' + number;
      }
      return number;
    };

    $scope.updateEvent = function(event) {
      event.type = event.type || 'generic';
      event.name = event.name || 'Evento LGC';
      event.date = event.date || null;
      event.time = event.time || null;
      event.location = event.location || null;
      event.clothing = event.clothing || null;
      event.meetingTime = event.meetingTime || null;
      event.notes = event.notes || null;

      event.$update().then(function(event) {
        $scope.event = null;
        $scope.events = _.sortBy($scope.events, 'date');
        $scope.editEventModal.hide();
      });

    };

    $scope.deleteEvent = function(event) {
      var removedEventId = event.$id();
      event.$remove().then(function(event) {
        _.remove($scope.events, function(e) {
          return e.$id() === removedEventId;
        });
        $scope.events = _.sortBy($scope.events, 'date');
      });
    };

    $scope.editEvent = function(event) {
      $scope.event = event;
      $scope.editEventModal.show();
    };

    $scope.newEvent = function() {
      $scope.newEventModal.show();
    };

    $scope.closeNewEvent = function() {
      $scope.newEventModal.hide();
    };

    $scope.closeEditEvent = function() {
      $scope.event = null;
      $scope.editEventModal.hide();
    };

    var initAttendees = function() {
      return _.map(SINGERS, function(singer) {
        singer.confirmed = false;
        return singer;
      });
    }
  }
]);

app.controller('AttendeesCtrl', ['$scope', '$stateParams', 'Events',
  function($scope, $stateParams, Events) {
    Events.getById($stateParams.eventId).then(function(event) {
      $scope.event = event;
      $scope.roles = _.groupBy($scope.event.attendees, 'role');
    });

    $scope.updateEvent = function() {
      $scope.event.$update();
    };

  }
]);