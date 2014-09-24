'use strict';

var forEach = function(obj, iterator, context) {
  var key;
  if (obj) {
    if (isFunction(obj)) {
      for (key in obj) {
        // Need to check if hasOwnProperty exists,
        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
          iterator.call(context, obj[key], key);
        }
      }
    } else if (isArray(obj) || isArrayLike(obj)) {
      for (key = 0; key < obj.length; key++) {
        iterator.call(context, obj[key], key);
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key);
        }
      }
    }
  }
  return obj;
};

var isFunction = function(value) {
  return typeof value === 'function';
};

var isArray = (function() {
  if (!isFunction(Array.isArray)) {
    return function(value) {
      return toString.call(value) === '[object Array]';
    };
  }
  return Array.isArray;
})();

var isWindow = function(obj) {
  return obj && obj.document && obj.location && obj.alert && obj.setInterval;
};

var isString = function(value) {
  return typeof value === 'string';
};

var isDefined = function(value) {
  return typeof value !== 'undefined';
};

var isArrayLike = function(obj) {
  if (obj == null || isWindow(obj)) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === 1 && length) {
    return true;
  }

  return isString(obj) || isArray(obj) || length === 0 ||
    typeof length === 'number' && length > 0 && (length - 1) in obj;
};


// --------------

var IonicModule = angular.module('ionic');

/**
 * @ngdoc directive
 * @name ionTristateToggle
 * @module ionic
 */
IonicModule
  .directive('ionTristateToggle', [
    '$ionicGesture',
    '$timeout',
    function($ionicGesture, $timeout) {

      return {
        restrict: 'E',
        replace: true,
        require: '?ngModel',
        transclude: true,
        template: '<div class="item item-toggle">' +
          '<div ng-transclude></div>' +
          '<label class="toggle">' +
          '<input type="checkbox">' +
          '<div class="track">' +
          '<div class="handle"><i class="icon"></i></div>' +
          '</div>' +
          '</label>' +
          '</div>',

        compile: function(element, attr) {
          var input = element.find('input');
          forEach({
            'name': attr.name,
            'ng-value': attr.ngValue,
            'ng-model': attr.ngModel,
            'ng-checked': attr.ngChecked,
            'ng-disabled': attr.ngDisabled,
            'ng-true-value': attr.ngTrueValue,
            'ng-false-value': attr.ngFalseValue,
            'ng-change': attr.ngChange
          }, function(value, name) {
            if (isDefined(value)) {
              input.attr(name, value);
            }
          });

          if (attr.toggleClass) {
            element[0].getElementsByTagName('label')[0].classList.add(attr.toggleClass);
          }

          return function($scope, $element, $attr) {
            var el, checkbox, track, handle;

            el = $element[0].getElementsByTagName('label')[0];
            checkbox = el.children[0];
            track = el.children[1];
            handle = track.children[0];

            checkbox.indeterminate = false;

            var ngModelController = angular.element(checkbox).controller('ngModel');

            $scope.toggle = new ionic.views.Toggle({
              el: el,
              track: track,
              checkbox: checkbox,
              handle: handle,
              onChange: function() {
                if (checkbox.checked) {
                  checkbox.indeterminate = !checkbox.indeterminate;
                  //handle.children[0].removeClass('ion-location');
                  //handle.children[0].addClass('ion-clock');
                  ngModelController.$setViewValue(true);
                } else {
                  checkbox.indeterminate = !checkbox.indeterminate;
                  //handle.children[0].removeClass('ion-clock');
                  //handle.children[0].addClass('ion-location');
                  ngModelController.$setViewValue(false);
                }
                $scope.$apply();
              }
            });

            $scope.$on('$destroy', function() {
              $scope.toggle.destroy();
            });
          };
        }

      };
    }
  ]);