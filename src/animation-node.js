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

(function(scope, testing) {

  var fills = 'backwards|forwards|both'.split('|');
  var directions = 'reverse|alternate|alternate-reverse'.split('|');

  function normalizeTimingInput(timingInput) {
    var input = {
      delay: 0,
      endDelay: 0,
      fill: 'none',
      iterationStart: 0,
      iterations: 1,
      duration: 0,
      playbackRate: 1,
      direction: 'normal',
      easing: 'linear'
    };

    if (typeof timingInput == 'number') {
      input.duration = timingInput;
    } else if (timingInput !== undefined) {
      Object.getOwnPropertyNames(timingInput).forEach(function(property) {
        if (timingInput[property] !== 'auto') {
          if (typeof input[property] == 'number' && typeof timingInput[property] != 'number') {
            return;
          }
          if ((property == 'fill') && (fills.indexOf(timingInput[property]) == -1)) {
            return;
          }
          if ((property == 'direction') && (directions.indexOf(timingInput[property]) == -1)) {
            return;
          }
          input[property] = timingInput[property];
        }
      });
    }
    input.easing = toTimingFunction(input.easing);
    return input;
  }

  function cubic(a, b, c, d) {
    if (a < 0 || a > 1 || c < a || c > 1) {
      return linear;
    }
    return function(x) {
      var start = 0, end = 1;
      while (1) {
        var mid = (start + end) / 2;
        function f(a, b, m) { return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m};
        var xEst = f(a, c, mid);
        if (Math.abs(x - xEst) < 0.001) {
          return f(b, d, mid);
        }
        if (xEst < x) {
          start = mid;
        } else {
          end = mid;
        }
      }
    }
  }

  var Start = 1;
  var Middle = 0.5;
  var End = 0;

  function step(count, pos) {
    return function(x) {
      if (x >= 1) {
        return 1;
      }
      var stepSize = 1 / count;
      x += pos * stepSize;
      return x - x % stepSize;
    }
  }

  var presets = {
    'ease': cubic(0.25, 0.1, 0.25, 1),
    'ease-in': cubic(0.42, 0, 1, 1),
    'ease-out': cubic(0, 0, 0.58, 1),
    'ease-in-out': cubic(0.42, 0, 0.58, 1),
    'step-start': step(1, Start),
    'step-middle': step(1, Middle),
    'step-end': step(1, End)
  };

  var numberString = '\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*';
  var cubicBezierRe = new RegExp('cubic-bezier\\(' + numberString + ',' + numberString + ',' + numberString + ',' + numberString + '\\)');
  var stepRe = /step\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/;
  var linear = function(x) { return x; };

  function toTimingFunction(easing) {
    var cubicData = cubicBezierRe.exec(easing);
    if (cubicData) {
      return cubic.apply(this, cubicData.slice(1).map(Number));
    }
    var stepData = stepRe.exec(easing);
    if (stepData) {
      return step(Number(stepData[1]), {'start': Start, 'middle': Middle, 'end': End}[stepData[2]]);
    }
    var preset = presets[easing];
    if (preset) {
      return preset;
    }
    return linear;
  };

  function calculateActiveDuration(timingInput) {
    return Math.abs(repeatedDuration(timingInput) / timingInput.playbackRate);
  }

  function repeatedDuration(timingInput) {
    return timingInput.duration * timingInput.iterations;
  }

  var PhaseNone = 0;
  var PhaseBefore = 1;
  var PhaseAfter = 2;
  var PhaseActive = 3;

  function calculatePhase(activeDuration, localTime, timingInput) {
    if (localTime == null) {
      return PhaseNone;
    }
    if (localTime < timingInput.delay) {
      return PhaseBefore;
    }
    if (localTime >= timingInput.delay + activeDuration) {
      return PhaseAfter;
    }
    return PhaseActive;
  }

  function calculateActiveTime(activeDuration, fillMode, localTime, phase, delay) {
    switch (phase) {
      case PhaseBefore:
        if (fillMode == 'backwards' || fillMode == 'both')
          return 0;
        return null;
      case PhaseActive:
        return localTime - delay;
      case PhaseAfter:
        if (fillMode == 'forwards' || fillMode == 'both')
          return activeDuration;
        return null;
      case PhaseNone:
        return null;
    }
  }

  function calculateScaledActiveTime(activeDuration, activeTime, startOffset, timingInput) {
    return (timingInput.playbackRate < 0 ? activeTime - activeDuration : activeTime) * timingInput.playbackRate + startOffset;
  }

  function calculateIterationTime(iterationDuration, repeatedDuration, scaledActiveTime, startOffset, timingInput) {
    if (scaledActiveTime === Infinity || scaledActiveTime === -Infinity || (scaledActiveTime - startOffset == repeatedDuration && timingInput.iterations && ((timingInput.iterations + timingInput.iterationStart) % 1 == 0))) {
      return iterationDuration;
    }

    return scaledActiveTime % iterationDuration;
  }

  function calculateCurrentIteration(iterationDuration, iterationTime, scaledActiveTime, timingInput) {
    if (scaledActiveTime === 0) {
      return 0;
    }
    if (iterationTime == iterationDuration) {
      return timingInput.iterationStart + timingInput.iterations - 1;
    }
    return Math.floor(scaledActiveTime / iterationDuration);
  }

  function calculateTransformedTime(currentIteration, iterationDuration, iterationTime, timingInput) {
    var currentIterationIsOdd = currentIteration % 2 >= 1;
    var currentDirectionIsForwards = timingInput.direction == 'normal' || timingInput.direction == (currentIterationIsOdd ? 'alternate-reverse' : 'alternate');
    var directedTime = currentDirectionIsForwards ? iterationTime : iterationDuration - iterationTime;
    var timeFraction = directedTime / iterationDuration;
    return iterationDuration * timingInput.easing(timeFraction);
  }

  function calculateTimeFraction(activeDuration, localTime, timingInput) {
    var phase = calculatePhase(activeDuration, localTime, timingInput);
    var activeTime = calculateActiveTime(activeDuration, timingInput.fill, localTime, phase, timingInput.delay);
    if (activeTime === null) {
      return null;
    }
    var startOffset = timingInput.iterationStart * timingInput.duration;
    var scaledActiveTime = calculateScaledActiveTime(activeDuration, activeTime, startOffset, timingInput);
    var iterationTime = calculateIterationTime(timingInput.duration, repeatedDuration(timingInput), scaledActiveTime, startOffset, timingInput);
    var currentIteration = calculateCurrentIteration(timingInput.duration, iterationTime, scaledActiveTime, timingInput);
    return calculateTransformedTime(currentIteration, timingInput.duration, iterationTime, timingInput) / timingInput.duration;
  }

  scope.AnimationNode = function(timingInput) {
    var input = normalizeTimingInput(timingInput);
    var timeFraction = 0;
    var activeDuration = calculateActiveDuration(input);
    var f = function(localTime) {
      return calculateTimeFraction(activeDuration, localTime, input);
    };
    f.totalDuration = activeDuration + input.delay + input.endDelay;
    return f;
  };

  if (TESTING) {
    testing.normalizeTimingInput = normalizeTimingInput;
    testing.toTimingFunction = toTimingFunction;
    testing.calculateActiveDuration = calculateActiveDuration;
    testing.calculatePhase = calculatePhase;
    testing.PhaseNone = PhaseNone;
    testing.PhaseBefore = PhaseBefore;
    testing.PhaseActive = PhaseActive;
    testing.PhaseAfter = PhaseAfter;
    testing.calculateActiveTime = calculateActiveTime;
    testing.calculateScaledActiveTime = calculateScaledActiveTime;
    testing.calculateIterationTime = calculateIterationTime;
    testing.calculateCurrentIteration = calculateCurrentIteration;
    testing.calculateTransformedTime = calculateTransformedTime;
  }

})(webAnimations, testing);