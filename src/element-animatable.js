// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {
  function isPropertySupported(property) {
    if (property in document.body.style) return true;
    var prefixes = ['Moz', 'Webkit', 'O', 'ms', 'Khtml'];
    var prefProperty = property.charAt(0).toUpperCase() + property.substr(1);

    for (var i = 0; i < prefixes.length; i++) {
      if ((prefixes[i] + prefProperty) in document.body.style) return true;
    }

    return false;
  }

  function isWebAnimationsApiSupported() {
    if (document.documentElement.animate) {
      var player = document.documentElement.animate([], 0);

      if (!player) return false;

      var animProperty = [
        'play', 'currentTime', 'pause', 'reverse',
        'playbackRate', 'cancel', 'finish', 'startTime', 'playState',
      ];

      for (var i = 0, l = animProperty.length; i < l; i++) {
        if (player[animProperty[i] === undefined]) return false;
      }

      return true;
    }
  }

  var isAnimationsApiSupported = isWebAnimationsApiSupported();
  var originalElementAnimate = window.Element.prototype.animate;
  // var isOffsetPathSupported = isPropertySupported('offset-path');
  var isOffsetPathSupported = false;

  window.Element.prototype.animate = function(effectInput, options) {
    var hasOffsetPathProperty = ~JSON.stringify(effectInput).indexOf('offsetPath')

    if (
        !isAnimationsApiSupported
          || (!isOffsetPathSupported && hasOffsetPathProperty)
      ) {
      var id = '';
      if (options && options.id) {
        id = options.id;
      }
      return scope.timeline._play(scope.KeyframeEffect(this, effectInput, options, id));
    }

    return originalElementAnimate.call(this, effectInput, options);
  };
})(webAnimations1);
