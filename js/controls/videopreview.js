goog.provide('tl.control.Preview');

goog.require('tl.Editor');
goog.require('goog.array');
goog.require('goog.Uri');

/**
 * Provides the video preview of the configured TV schedule. This code is not
 *   finished as support for mp4 only restricts the usage.
 *
 * TODO: Look for other options (flash perhaps).
 * @constructor
 * @param {tl.Editor} editor The editor to utilize.
 */
tl.control.Perview = function(editor) {
  this.editor = editor;
};

/**
 * Attach the preview to a video element able to play back the video.
 * @param {Element} videoel The video element.
 */
tl.control.Perview.prototype.attach = function(videoel) {
  this.video = videoel || document.querySelector('video');
};

/**
 * Starts play back of the video. This is not finished!
 * FIXME: finish this method.
 */
tl.control.Perview.prototype.play = function() {
  this.data = this.editor.exportModel();
  var startTime = this.editor.getCurrentTime();
  var movie = this.editor.findRecordByTimeStamp(startTime);
  var index = goog.array.indexOf(this.data, movie);
  var uri = new goog.Uri(movie['url']);
  if (uri.getScheme() == 'fw') {
    uri.setScheme('http');
    uri.setPort('88');
  }
  this.video.setAttribute('src', uri.toString());
  this.video.play();
};
