goog.provide('app');

goog.require('tl.control.Timeline');

/**
 * Entry point for the app.
 */
app = function() {

  //If we want to test - load stubs instead
  // Load stubs into the resource provider
  //tl.loader.loadFakeData(goog.global['STUBS']);

  // At the end this should be enough to run the whole application.
  (new tl.control.Timeline());

};

app();
