goog.provide('tl.RecordDrag');

goog.require('goog.fx.DragDrop');
goog.require('pstj.fx.Dragger');
goog.require('tl.template');
goog.require('tl.ui.Record');

/**
 * Provides custom dragger to allow creation of UI for the dragged record.
 * @constructor
 * @extends {goog.fx.DragDrop}
 * @param {tl.ui.Record} record The record instance to use.
 */
tl.RecordDrag = function(record) {
  goog.base(this, record.getElement(), /** @type {Object} */(
    record.getModel()));
  this.data = /** @type {Object} */ (record.getModel());
};
goog.inherits(tl.RecordDrag, goog.fx.DragDrop);

/**
 * Makes the model compatible by type with the required one.
 * @override
 * @return {Object} The record object is always an object or null.
 */
tl.RecordDrag.prototype.getModel;

/** @inheritDoc */
tl.RecordDrag.prototype.createDragElement = function(srcEl) {
  if (!goog.isDefAndNotNull(this.data)) {
    throw Error('Cannot create drag element without data');
  }
  var el = goog.dom.htmlToDocumentFragment(tl.template.DragElement(this.data));
  return /** @type {!Element} */ (el);
};

/** @inheritDoc */
tl.RecordDrag.prototype.createDraggerFor = function(sourceEl, el, event) {
  // position the new element absolutely
  el.style.position = 'absolute';
  el.style.left = event.clientX + 'px';
  el.style.top = event.clientY + 'px';
  return new pstj.fx.Dragger(el);
};
