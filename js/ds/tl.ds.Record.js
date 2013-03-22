goog.provide('tl.ds.Record');

goog.require('pstj.configure');
goog.require('pstj.ds.ListItem');

/**
 * @fileoverview Provides an utility class that wraps the Sysmaster's record
 * type in nice and easy to use abstraction. It does not serve any other
 * purpose.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */


/**
 * Provides a custom record class for the media files. Just ease the work.
 * @constructor
 * @extends {pstj.ds.ListItem}
 * @param {Object} data The record object to wrap.
 */
tl.ds.Record = function(data) {
  goog.base(this, data);
};
goog.inherits(tl.ds.Record, pstj.ds.ListItem);

/**
 * Enumerates the property names in the literal object constructed from the
 *   server provided JSON object
 * @enum {string}
 */
tl.ds.Record.Property = {
  NAME: 'name',
  URL: 'url',
  DURATION: 'duration',
  THUMBNAIL: 'thumbnail',
  AD: 'advertisement'
};

goog.scope(function() {
  var p = tl.ds.Record.prototype;
  var Props = tl.ds.Record.Property;

  /**
   * A default thumbnail to use.
   * @type {string}
   */
  p.defaultThumbnail = pstj.configure.getRuntimeValue(
    'DEFAULT_LIBRARY_ITEM_THUMBNAIL', 'assets/video-file.png',
      'SYSMASTER.TIMELINE.MEDIA_LIBRARY').toString();

  /**
   * Check if the record is an advertisement.
   * @return {!boolean} True if the record is an ad.
   */
  p.isAd = function() {
    return !!this.getProp(Props.AD);
  };

  /**
   * Retrieves the URL of the record from which it can be played.
   * @return {!string} The record URL.
   */
  p.getUrl = function() {
    var url = this.getProp(Props.URL);
    if (!goog.isString(url) || url.length < 5) {
      throw new Error('The record does not have an URL');
    }
    return /** @type {!string} */ (url);
  };

  /**
   * Returns the duration of the record.
   * @return {!number} Duration in SECONDS.
   */
  p.getDuration = function() {
    return /** @type {!number} */ (this.getProp(Props.DURATION));
  };

  /**
   * Getter for the thumbnail.
   * @return {!string} The thumbnail address.
   */
  p.getThumbnail = function() {
    var url = this.getProp(Props.THUMBNAIL);
    if (!goog.isString(url) || url.length < 5) {
      return p.defaultThumbnail;
    }
    return /**@type {!string} */ (url);
  };

  /**
   * Getter for the video name.
   * @return {!string} The name of the video file.
   */
  p.getName = function() {
    return /** @type {!string} */ (this.getProp(Props.NAME));
  };

});
