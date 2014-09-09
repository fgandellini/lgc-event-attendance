/* jshint unused:false */
/* global alert, angular, _ */
'use strict';

var services = angular.module('lgcAttendance.services', ['config', 'mongolabResourceHttp']);

services.factory('Events', ['$mongolabResourceHttp',
  function($mongolabResourceHttp) {
    return $mongolabResourceHttp('events');
  }
]);

var app = angular.module('lgcAttendance', ['config', 'ionic', 'lgcAttendance.services']);

app.filter('newlines', function() {
  return function(text) {
    return text.replace(/\n/g, '<br/>');
  }
})

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('events', {
      url: '/events?token',
      templateUrl: 'events.html'
    })
    .state('new', {
      url: '/events/new',
      templateUrl: 'attendees.html'
    })
    .state('attendees', {
      url: '/events/:eventId/attendees',
      templateUrl: 'attendees.html'
    });

  $urlRouterProvider.otherwise('/events');
});

app.controller('EventsCtrl', ['AUTH_TOKEN', 'SINGERS', '$stateParams', '$rootScope', '$scope', '$state', '$ionicModal', '$ionicLoading', 'Events',
  function(AUTH_TOKEN, SINGERS, $stateParams, $rootScope, $scope, $state, $ionicModal, $ionicLoading, Events) {

    // admin mode setup
    $rootScope.adminMode = ($stateParams.token === AUTH_TOKEN);

    // current event (target of update)
    $scope.event = null;

    $scope.showDelete = false;
    $scope.listCanSwipe = true;

    var updateCurrentDayTime = function() {
      var now = new Date().toISOString();
      $scope.now = now.slice(0, 10) + ' ' + now.slice(11, 16);
    };

    var getPastSortedEvents = function(allEvents) {
      updateCurrentDayTime();
      return _.sortBy(_.filter(allEvents, function(e) {
        return (e.date + ' ' + e.time) < $scope.now;
      }), ['date', 'time']);
    };

    var getUpcomingSortedEvents = function(allEvents) {
      updateCurrentDayTime();
      return _.sortBy(_.filter(allEvents, function(e) {
        return (e.date + ' ' + e.time) >= $scope.now;
      }), ['date', 'time']);
    };

    var updateEventLists = function(allEvents) {
      $scope.upcomingEvents = getUpcomingSortedEvents(allEvents);
      $scope.pastEvents = getPastSortedEvents(allEvents);
    };

    $ionicModal.fromTemplateUrl('event-popup.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.eventPopup = modal;
    });

    $scope.toggleDelete = function() {
      $scope.showDelete = !$scope.showDelete;
    };

    $scope.openEventPopup = function(event) {
      $scope.showDelete = false;
      $scope.popupTitle = event ? 'Modifica Evento' : 'Nuovo Evento';
      $scope.popupConfirmButton = event ? 'Aggiorna Evento' : 'Crea Evento';
      $scope.event = event;
      $scope.eventPopup.show();
    };

    $scope.closeEventPopup = function() {
      $scope.event = null;
      $scope.eventPopup.hide();
    };

    $scope.saveOrUpdateEvent = function(event) {
      var e = event || {};

      if (!$scope.event) { // create
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
        newEvent.$save().then(function(evt) {
          $scope.events.push(evt);
          updateEventLists($scope.events);
          $scope.eventPopup.hide();
        });
      } else { // update
        $scope.event.type = event.type || $scope.event.type || 'generic';
        $scope.event.name = event.name || $scope.event.name || 'Evento LGC';
        $scope.event.date = event.date || $scope.event.date || null;
        $scope.event.time = event.time || $scope.event.time || null;
        $scope.event.location = event.location || $scope.event.location || null;
        $scope.event.clothing = event.clothing || $scope.event.clothing || null;
        $scope.event.meetingTime = event.meetingTime || $scope.event.meetingTime || null;
        $scope.event.notes = event.notes || $scope.event.notes || null;
        $scope.event.$update().then(function(evt) {
          $scope.event = null;
          updateEventLists($scope.events);
          $scope.eventPopup.hide();
        });
      }
    };

    $scope.deleteEvent = function(event) {
      var removedEventId = event.$id();
      event.$remove().then(function(event) {
        _.remove($scope.events, function(e) {
          return e.$id() === removedEventId;
        });
        updateEventLists($scope.events);
      });
    };

    $ionicModal.fromTemplateUrl('event-details-popup.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.eventDetailsPopup = modal;
    });

    $scope.openEventDetailsPopup = function(event) {
      $scope.showDelete = false;
      $scope.event = event;
      $scope.eventDetailsPopup.show();
    };

    $scope.closeEventDetailsPopup = function() {
      $scope.event = null;
      $scope.eventDetailsPopup.hide();
    };

    $scope.$on('$destroy', function() {
      $scope.eventPopup.remove();
      $scope.eventDetailsPopup.remove();
    });

    // loader management
    var showLoading = function() {
      $ionicLoading.show({
        template: '<i class="icon ion-loading-c loader"></i>'
      });
    };

    var hideLoading = function() {
      $ionicLoading.hide();
    };

    // utility functions
    var initAttendees = function() {
      return _.map(SINGERS, function(singer) {
        singer.confirmed = false;
        return singer;
      });
    };

    // bootstrap
    showLoading();
    Events.all().then(function(events) {
      _.map(events, function(event) {
        event.attendance = _.countBy(_.filter(event.attendees, 'confirmed'), 'role');
        if (_.isEmpty(event.attendance)) {
          event.attendance = null;
        }
        return event;
      });
      $scope.events = events;
      updateEventLists($scope.events);
      hideLoading();
    }, function() {
      $rootScope.adminMode = false;
      $scope.events = [];
      hideLoading();
      alert(':(\nNon riesco a contattare il database!\nRiprova tra qualche istante.');
    });

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