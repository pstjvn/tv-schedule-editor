goog.provide('tl.component.Toolbar');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.ui.CustomButton');
goog.require('pstj.ui.CustomButtonRenderer');
goog.require('pstj.ui.Templated');

/**
 * @fileoverview Provides a toolbar like functionality for action buttons.
 *   Whenever an action is triggered the button's DOM data attribute for
 *   action is retrieved and passed to the parent control as action event.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

/**
 * Provides application specific toolbar abstraction to allow us to construct
 *   series of grouped controls.
 * @constructor
 * @extends {pstj.ui.Templated}
 */
tl.component.Toolbar = function() {
  goog.base(this);
};
goog.inherits(tl.component.Toolbar, pstj.ui.Templated);

goog.scope(function() {
  var _ = tl.component.Toolbar.prototype;
  var array = goog.array;
  var dom = goog.dom;

  /** @inheritDoc */
  _.decorateInternal = function(el) {
    goog.base(this, 'decorateInternal', el);
    var controls = dom.getElementsByClass(goog.getCssName('pstj-button'),
      this.getElement());
    array.forEach(controls, this.addControl_, this);
  };

  /**
   * Create a new item in the toolbar from existing DOM element.
   * @param {Element} el The element to decorate as button.
   * @private
   */
  _.addControl_ = function(el) {
    var child = new goog.ui.CustomButton('', pstj.ui.CustomButtonRenderer
      .getInstance());
    this.addChild(child);
    child.decorate(el);
  };
});
