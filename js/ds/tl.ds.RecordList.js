goog.provide('tl.ds.RecordList');

goog.require('pstj.ds.List');
goog.require('pstj.ds.ListItem');

/**
 * Custom list for the media lists. It provides the default filtering of the
 * object items based on custom criteria.
 *
 * @constructor
 * @extends {pstj.ds.List}
 * @param {Array.<pstj.ds.ListItem>=} opt_nodes The list of initial nodes.
 */
tl.ds.RecordList = function(opt_nodes) {
	goog.base(this, opt_nodes);
};
goog.inherits(tl.ds.RecordList, pstj.ds.List);


