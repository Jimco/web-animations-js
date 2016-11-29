
Polyfill Extension API
----------------------

[Design doc](https://docs.google.com/document/d/1pDFK6ebP2gejltvUwRieHVp3g85BA_SS6G0_-hHFzL0)

This is a work in progress implemenation of an API for extending the
set of CSS properties supported by the Web Animations Polyfill.

### API Reference

See design doc for now.

### To Be Done

 - Support for targets other than `web-animations.dev.js`.
 - Final documentation.
 - Tests.

### Quick and dirty example

```
<!DOCTYPE html>
<script src="web-animations.dev.js"></script>
<style>
#target {
  width: 100px;
  height: 100px;
  background: black;
}
</style>
<div id="target"></div>
<script>
function quantize(x) {
  return Math.round(Math.max(Math.min(x, 1), 0) * 255);
}

WebAnimationsPolyfillExtension.register({
  name: 'test',
  properties: {
    heat: {
      parse: function(value) {
        return value;
      },
      merge: function(start, end) {
        return {
          start: Number(start),
          end: Number(end),
          apply: function(value) {
            return value;
          },
        };
      },
    },
  },
  applyHook: function(values, style) {
    var heat = values.heat;
    if (heat == undefined) {
      style.backgroundColor = '';
      return;
    }
    var red = quantize(heat * 4);
    var green = quantize(heat + Math.sin(heat * 20) / 8);
    var blue = quantize(heat / 2);
    style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;
  },
});
target.animate({heat: [0, 1]}, {
  duration: 2000,
  iterations: 2,
  direction: 'alternate',
  easing: 'ease-in',
});
</script>
```
