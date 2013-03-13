goog.provide('tl.ui.Record');

goog.require('pstj.ui.Templated');
goog.require('tl.template');

/**
 * Represents a single record in the list of records.
 * @constructor
 * @extends {pstj.ui.Templated}
 */
tl.ui.Record = function() {
	goog.base(this);
};
goog.inherits(tl.ui.Record, pstj.ui.Templated);

/**
 * @return {tl.ds.Record}
 */
tl.ui.Record.prototype.getModel;

/** @inheritDoc */
tl.ui.Record.prototype.getTemplate = function() {
	return tl.template.Record({
		title: this.getModel().getName(),
		thumbnail: this.getModel().getThumbnail()
	});
};
