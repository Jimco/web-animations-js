// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
(function(scope) {
  if (window.WebAnimationsPolyfillExtension) {
    return;
  }

  function registerProperty(params) {
    console.assert(typeof params.property == 'string');
    console.assert(params.parse instanceof Function);
    console.assert(params.merge instanceof Function);
    // TODO(alancutter): Make addPropertyHandler's merge function work like the
    // extension API and avoid this format conversion function.
    function merge(start, end) {
      var result = params.merge(start, end);
      return [result.start, result.end, result.apply];
    }
    scope.addPropertyHandler(params.parse, merge, params.property);
  }

  var applyHooks = [];
  function addApplyHook(params) {
    console.assert(params.watchedProperties instanceof Array);
    console.assert(params.callback instanceof Function);
    applyHooks.push(params);
  }

  function callApplyHooks(effects) {
    applyHooks.forEach(function(applyHook) {
      // TODO(alancutter): Avoid calling apply hooks multiple times per effect target.
      effects.forEach(function(effect) {
        if (!effect._target._webAnimationsPatchedStyle) {
          return;
        }
        var style = effect._target.style;
        var watchedValues = {};
        applyHook.watchedProperties.forEach(function(property) {
          watchedValues[property] = style._getAnimated(property);
        });
        applyHook.callback(watchedValues, style._animatedStyle());
      })
    })
  };

  scope.callApplyHooks = callApplyHooks;

  window.WebAnimationsPolyfillExtension = {
    registerProperty: registerProperty,
    addApplyHook: addApplyHook,
  };
})(webAnimations1);
