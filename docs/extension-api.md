
Polyfill Extension API
----------------------

[Design doc](https://docs.google.com/document/d/1pDFK6ebP2gejltvUwRieHVp3g85BA_SS6G0_-hHFzL0)

This is a work in progress implemenation of an API for extending the
set of CSS properties supported by the Web Animations Polyfill.

### API Reference

See design doc for now.

### To Be Done

 - Support for targets other than `web-animations.dev.js`.
 - Support extended CSS properties that are natively supported by the browser.
 - registerApplyHook().
 - Final documentation.

### Quick and dirty example

```
<!DOCTYPE html>
<script src="web-animations.dev.js"></script>
<style>
#target {
  width: 100px;
  height: 100px;
  background: blue;
}
</style>
<div id="target"></div>
<script>
WebAnimationsPolyfillExtension.registerProperty({
  property: 'pants',
  parse: function(value) {
    return value;
  },
  merge: function(start, end) {
    return {
      start: Number(start),
      end: Number(end),
      apply: function(value) {
        return value|0;
      },
    };
  },
});
WebAnimationsPolyfillExtension.addApplyHook({
  watchedProperties: ['pants'],
  callback: function(watchedValues, style) {
    if (watchedValues.pants == undefined) {
      style.backgroundColor = '';
    } else {
      style.backgroundColor = 'rgb(255, ' + watchedValues.pants + ', 0)';
    }
  },
});
target.addEventListener('click', function() {
  target.animate({pants: [100, 200]}, {
    duration: 1000,
    delay: 100,
  });
});
</script>
```
