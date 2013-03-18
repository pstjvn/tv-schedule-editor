goog.provide('app');

goog.require('tl.control.Timeline');

/**
 * @fileoverview  Entry point for the application, this is merely a wrapper
 *   around the functionality.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */
app = function() {
  // If we want to test - load stubs instead (assuming those are already
  // provided in the global scope).
  // tl.loader.loadFakeData(goog.global['STUBS']);

  // At the end this should be enough to run the whole application.
  (new tl.control.Timeline());
};

app();
