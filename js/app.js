var app = angular.module('lgcAttendance', ['config', 'ionic', 'lgcAttendance.services']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('events', {
      url: '/events',
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

app.controller('EventsCtrl', ['SINGERS', '$scope', '$state', '$ionicModal', 'Events',
  function(SINGERS, $scope, $state, $ionicModal, Events) {
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

    Events.all().then(function(events) {
      _.map(events, function(event) {
        event.attendance = formatAttendanceAbsValues(event.attendees);
        return event;
      });
      $scope.events = events;
    });

    var formatAttendanceAbsValues = function(attendees) {
      var confirmed = _.countBy(_.filter(attendees, 'confirmed'), 'role');
      return formatAttendanceRole('S', confirmed.s) +
        formatAttendanceRole('MS', confirmed.ms) +
        formatAttendanceRole('A', confirmed.a) +
        formatAttendanceRole('T', confirmed.t) +
        formatAttendanceRole('B', confirmed.b);
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

    $scope.createEvent = function(event) {
      var now = new Date();
      var e = event || {};
      var newEvent = new Events();

      newEvent.type = e.type || 'generic';
      newEvent.name = e.name || 'Evento LGC';
      newEvent.date = e.date || extractDate(now);
      newEvent.time = e.time || extractTime(now);
      newEvent.location = e.location || 'Luogo da definire';
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
      var now = new Date();

      event.type = event.type || 'generic';
      event.name = event.name || 'Evento LGC';
      event.date = event.date || extractDate(now);
      event.time = event.time || extractTime(now);
      event.location = event.location || 'Luogo da definire';

      event.$update().then(function(event) {
        $scope.event = null;
        $scope.editEventModal.hide();
      });

    };

    $scope.deleteEvent = function(event) {
      var removedEventId = event.$id();
      event.$remove().then(function(event) {
        _.remove($scope.events, function(e) {
          return e.$id() === removedEventId;
        });
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