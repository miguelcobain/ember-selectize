# ember-selectize

An Ember and Selectize integration. Check [Selectize](http://brianreavis.github.io/selectize.js/)!

## Browser Support

Should run wherever Ember and Selectize run.

## How to use

Just grab the `src/ember.selectize.js` and drop/include in your build pipeline.
Building automation is not available since this is a very simple project (basically an `Ember.View`).

## Tests

Open `tests/index.html` in a browser.

Tests are written in qunit, and were borrowed from `Ember.Select`.

I've rewritten many of them, but most of them still fail.

This is due to the nature of this component. `Selectize`'s tests assures that everything is ok between Selectize<->DOM.
`Ember.Select`'s tests also test the DOM. This is unecessary in this project. 

Ember-selectize tests should be focused between Ember<->Selectize.

**There is still much to do here.**
