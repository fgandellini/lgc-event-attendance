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

app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
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
  }
]);

app.controller('EventsCtrl', ['AUTH_TOKEN', 'SINGERS', '$stateParams', '$rootScope', '$scope', '$state', '$ionicModal', '$ionicLoading', 'Events',
  function(AUTH_TOKEN, SINGERS, $stateParams, $rootScope, $scope, $state, $ionicModal, $ionicLoading, Events) {

    // admin mode setup
    $rootScope.adminMode = ($stateParams.token === AUTH_TOKEN);

    // current event (target of update)
    $scope.event = null;

    $scope.showDelete = false;
    $scope.listCanSwipe = true;

    $scope.private = {
      updateCurrentDayTime: function() {
        var now = new Date().toISOString();
        $scope.now = now.slice(0, 10) + ' ' + now.slice(11, 16);
      },

      getPastSortedEvents: function(allEvents) {
        $scope.private.updateCurrentDayTime();
        return _.sortBy(_.filter(allEvents, function(e) {
          return (e.date + ' ' + e.time) < $scope.now;
        }), ['date', 'time']);
      },

      getUpcomingSortedEvents: function(allEvents) {
        $scope.private.updateCurrentDayTime();
        return _.sortBy(_.filter(allEvents, function(e) {
          return (e.date + ' ' + e.time) >= $scope.now;
        }), ['date', 'time']);
      },

      updateEventLists: function(allEvents) {
        $rootScope.upcomingEvents = $scope.private.getUpcomingSortedEvents(allEvents);
        $rootScope.pastEvents = $scope.private.getPastSortedEvents(allEvents);
      },

      // loader management
      showLoading: function() {
        $ionicLoading.show({
          template: '<i class="icon ion-loading-c loader"></i>'
        });
      },

      hideLoading: function() {
        $ionicLoading.hide();
      },

      // utility functions
      initAttendees: function() {
        return _.map(SINGERS, function(singer) {
          singer.confirmed = false;
          return singer;
        });
      },

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
        newEvent.attendees = $scope.private.initAttendees();
        newEvent.$save().then(function(evt) {
          $rootScope.events.push(evt);
          $scope.private.updateEventLists($rootScope.events);
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
          $scope.private.updateEventLists($rootScope.events);
          $scope.eventPopup.hide();
        });
      }
    };

    $scope.deleteEvent = function(event) {
      var removedEventId = event.$id();
      event.$remove().then(function(event) {
        _.remove($rootScope.events, function(e) {
          return e.$id() === removedEventId;
        });
        $scope.private.updateEventLists($rootScope.events);
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

    $scope.loadData = function() {
      $scope.private.showLoading();
      Events.all().then(function(events) {
        _.map(events, function(event) {
          event.attendance = _.countBy(_.filter(event.attendees, 'confirmed'), 'role');
          if (_.isEmpty(event.attendance)) {
            event.attendance = null;
          }
          return event;
        });
        $rootScope.events = events;
        $scope.private.updateEventLists($rootScope.events);
        $scope.private.hideLoading();
        $rootScope.dataLoaded = true;
      }, function() {
        $rootScope.adminMode = false;
        $rootScope.events = [];
        $scope.private.hideLoading();
        $rootScope.dataLoaded = true;
        alert(':(\nNon riesco a contattare il database!\nRiprova tra qualche istante.');
      });
    };

    // bootstrap
    if ($rootScope.adminMode) {
      $scope.loadData();
    } else {
      if (!$rootScope.dataLoaded) {
        $scope.loadData();
      }
    }

  }
]);

app.controller('AttendeesCtrl', ['$rootScope', '$scope', '$stateParams', 'Events',
  function($rootScope, $scope, $stateParams, Events) {

    _.forEach($rootScope.events, function(evt) {
      if (evt.$id() === $stateParams.eventId) {
        $scope.event = evt;
        $scope.roles = _.groupBy($scope.event.attendees, 'role');
      }
    });

    $scope.updateEvent = function() {
      $scope.event.$update();
    };

  }
]);