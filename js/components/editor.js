goog.provide('tl.Editor');

goog.require('tl.utils');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Slider');
goog.require('goog.ui.Slider.Orientation');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.array');
goog.require('goog.object');
goog.require('pstj.date.utils');
goog.require('pstj.color');
goog.require('goog.fx.DragDrop');
goog.require('tl.ds.Record');

goog.require('tl.ds.defs');
goog.require('pstj.ds.MapRotator');
goog.require('pstj.graphics.Timeline');
goog.require('pstj.ui.Templated');
/**
 * @fileoverview Provides an instance signature for the time line to allow
 * easier access to it from different modules.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

/**
 * The class is designed to provide single instance time line with both scale
 *   and scroll elements linked to it. It also introduces the {@link #render}
 *   method for easier attachment to the DOM tree.
 * @constructor
 * @extends {pstj.graphics.Timeline}
 */
tl.Editor = function() {
	goog.base(this);
	this.scale_ = new goog.ui.Slider();
	this.scroll_ = new goog.ui.Slider();
	this.scale_.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
	this.scroll_.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
	this.scale_.setMoveToPointEnabled(true);
	this.scroll_.setMoveToPointEnabled(true);
	this.colormap = new pstj.ds.MapRotator();
	this.colormap.loadMap(tl.ds.defs.ProgramColors);
	this.dayOffset_ = tl.utils.getDays((goog.now() / 1000) << 0);
	this.cutAnimations = [];
};
goog.inherits(tl.Editor, pstj.graphics.Timeline);
goog.addSingletonGetter(tl.Editor);

/**
 * The events that this class produces.
 * @enum {string}
 */
tl.Editor.EventType = {
	ITEM_SELECTED: goog.events.getUniqueId('item-selected')
};


/**
 * Keeps reference to the date we are making schedule for in a date offset
 *   as days from 1970 format to add to the new schedules items.
 * @type {number}
 * @private
 */
tl.Editor.prototype.date_ = 0;

/**
 * Flag if the mouse is in the canvas element.
 * @type {boolean}
 * @private
 */
tl.Editor.prototype.mouseIsOver_ = false;

/**
 * Flag if we have a drag over the time line. Drag is triggered when a
 *   source drag is over our target (the canvas element).
 * @type {boolean}
 * @private
 */
tl.Editor.prototype.hasDragOver_ = false;

/**
 * How long the animation for cutting a file should take.
 * @type {number}
 * @protected
 */
tl.Editor.prototype.cutAnimationDuration = 360;

/**
 * The possible time for insertion as calculated.
 * @type {number}
 * @protected
 */
tl.Editor.prototype.insertTime = -1;

/**
 * The current time in the canvas time line.
 * @type {number}
 * @private
 */
tl.Editor.prototype.cutTime_ = -1;

/**
 * The color to use to draw the insert pointer.
 * @type {string}
 * @protected
 */
tl.Editor.prototype.insertColor = '#299923';

/**
 * Given the ID of the item to visualize, returns the color used for it. If
 *   one is not yet assigned one will be selected and assigned and then
 *   returned
 * @param {Object} obj The program object to find color for.
 * @return {string} The color matching the ID.
 */
tl.Editor.prototype.getColorForPeriod = function(obj) {
	var color = /** @type {string} */ (this.colormap.get(obj[tl.ds.defs.Program.ID]));
	if (obj != this.currentlyHighlighedRecord_) {
		return pstj.color.hexToRgba(color, 0.6);
	}
	return color;
};

/** @inheritDoc */
tl.Editor.prototype.decorateInternal = function(el) {
	goog.base(this, 'decorateInternal', el);
	// Attach the sliders to functions to the DOM.
	this.scale_.decorate(goog.dom.getElementByClass(goog.getCssName(
		'zoom-slider')));
	this.scroll_.decorate(goog.dom.getElementByClass(goog.getCssName(
		'scroll-slider')));
};

/** @inheritDoc */
tl.Editor.prototype.enterDocument = function() {
	goog.base(this, 'enterDocument');

	// Attach basic events.
	// Listen for scale change events.
	goog.events.listen(this, pstj.graphics.Timeline.EventType.SCALE_CHANGE, function(e) {
		this.scroll_.setMaximum(this.getMaximumScrollValue());
	}, undefined, this);

	// Listen for scale slider changes.
	goog.events.listen(this.scale_, goog.ui.Component.EventType.CHANGE, function(e) {
		this.setScalePercent(this.scale_.getValue());
	}, undefined, this);

	// Listen for scroll slider changes.
	goog.events.listen(this.scroll_, goog.ui.Component.EventType.CHANGE, function(e) {
		this.setScrollValue(this.scroll_.getValue());
	}, undefined, this);

	// Listen for mouse move events in the canvas.
  this.getHandler().listen(this.getContentElement(), goog.events.EventType.MOUSEMOVE,
  	this.handleMouseMove);

  goog.dom.classlist.remove(this.getElement(), goog.getCssName('loading'));
	this.dnd_ = new goog.fx.DragDrop(this.getContentElement());
};

/**
 * Here we should draw all time periods we want to allow to be covered by
 *   the time marker.
 */
tl.Editor.prototype.drawsBeforeMarker = function() {
	// here we can use the build in method for drawing periods only extracting
	// the values from the model.
	if (goog.isDefAndNotNull(this.getModel())) {
		var count = this.getModel().length;
		var c;
		if (count > 0) {
			for (var i = 0; i < count; i++) {
				c = this.getModel()[i];
				this.drawPeriod(c[tl.ds.defs.Program.START_TIME], c[tl.ds.defs.Program.END_TIME],
					this.getColorForPeriod(c));
			}
		}
	}
	return false;
};

/**
 * @override
 * @return {Array.<Object>} The program schedule list.
 */
tl.Editor.prototype.getModel;

/**
 * Transform the model from date-time offset to time offset and vice versa.
 * @param {Array.<Object>} model The data to transform.
 * @param {boolean} inwards If true the model is transformed from date-time
 *   to time.
 * @protected
 * @deprecated This is not needed anymore as the server always serves time
 *   offset based values only
 */
tl.Editor.prototype.transformModel = function(model, inwards) {
	if (inwards) {
		var transformaedmodel = goog.array.map(model, function(obj) {
			var tmp = goog.object.clone(obj);
			tl.utils.convertObjectToRelativeOffset(tmp);
			return tmp;
		});
		if (transformaedmodel.length > 0) {
			this.dayOffset_ = transformaedmodel[0][tl.utils.defaultSaveKey];
		}
		return transformaedmodel;
	} else {
		return goog.array.map(this.getModel(), function(obj) {
			var tmp = goog.object.clone(obj);
			tl.utils.converObjectToAbsoluteOffset(tmp);
			return tmp;
		});
	}
}

/**
 * This overrides the default implementation and takes care of the
 *   differences in time format from sysmaster server. We elect to copy the
 *   objects and use them independently in the widget.
 * @override
 */
tl.Editor.prototype.setModel = function(model) {
	goog.base(this, 'setModel', model);
	this.update();
};

/**
 * Tell the schedule editor which is the date to work with. FIXME: this
 *   should not live here, instead a facet should be applied in front of the
 *   editor to handle converting from date-time to time and vice versa
 * @param {number} date_as_offset The edited date as time seconds offset
 *   from 1970
 */
tl.Editor.prototype.setDate = function(date_as_offset) {
	this.date_ = date_as_offset;
};

/**
 * Exports back the model. This is used when you need to access the model
 *   without the transformation applied internally for the time.
 * @return {Array.<Object>} The model compatible with the imported one.
 * @public
 */
tl.Editor.prototype.exportModel = function() {
	return this.getModel();
};

/**
 * For now - test
 */
tl.Editor.prototype.initDnD = function() {
	this.getHandler().listen(this.dnd_,
    [goog.fx.AbstractDragDrop.EventType.DRAGOVER,
    goog.fx.AbstractDragDrop.EventType.DRAGOUT], this.handleDragOver);
	this.getHandler().listen(this.dnd_, goog.fx.AbstractDragDrop.EventType.DROP,
		this.handleDrop);
	this.dnd_.init();
};

/**
 * Handles the DROP event from the DnD. It will process the data received
 *   with the drop event and will try to make a new program item out of it.
 * @param  {goog.fx.DragDropEvent} e The drop event. Should hold reference
 *   to the dragged item.
 * @protected
 */
tl.Editor.prototype.handleDrop = function(e) {
	// remove drag
	this.hasDragOver_ = false;

	// determine the data dropped.
	var record = /** @type {tl.ds.Record} */ (e.dragSourceItem.data);

	// create the new program item
	var item = goog.object.unsafeClone(record.getRawData());

	// set up the program item in the program
	item['start_from'] = 0;
	var duration = item[tl.ds.defs.Program.DURATION];
	var recordAfter = this.findRecordByTimeStamp(this.insertTime);

	// if there is no record then we are at the end of the program.
	if (goog.isNull(recordAfter)) {
		item[tl.ds.defs.Program.START_TIME] = this.insertTime;
	} else {
		item[tl.ds.defs.Program.START_TIME] = recordAfter[tl.ds.defs.Program.START_TIME];
	}
	item[tl.ds.defs.Program.END_TIME] = item[tl.ds.defs.Program.START_TIME] + duration;
	item[tl.ds.defs.Program.START_FROM] = 0;
	item[tl.utils.defaultSaveKey] = this.date_;

	var index = this.getModel().indexOf(recordAfter);

	// insert the new program item.
	goog.array.insertAt(this.getModel(), item, ((index == -1) ?
		this.getModel().length : index));

	// shift the rest of the program if needed.
	if (index != -1) {
		goog.array.forEach(this.getModel(), function(rec, i) {
			if (i > index) {
				rec[tl.ds.defs.Program.START_TIME] += duration;
				rec[tl.ds.defs.Program.END_TIME] += duration;
			}
		});
	}

	// clear marker and redraw.
	this.insertTime = -1;
	this.update();
};

/**
 * Handles the drag event.
 * @param {goog.events.Event} e The drop event.
 * @protected
 */
tl.Editor.prototype.handleDragOver = function(e) {
  // we are now dragging an item over, let the handlers know...
  if (e.type == goog.fx.AbstractDragDrop.EventType.DRAGOVER) {
    this.hasDragOver_ = true;
  } else {
    this.hasDragOver_ = false;
    this.insertTime = -1;
    this.update();
  }
};

/**
 * If there is a currently selected item in the schedule view it will be
 *   removed.
 */
tl.Editor.prototype.removeSelected = function() {
	if (!goog.isDefAndNotNull(this.currentlyHighlighedRecord_)) {
		return;
	}

	var toRemove = this.currentlyHighlighedRecord_;
	var index = goog.array.indexOf(this.getModel(), toRemove);
	goog.array.removeAt(this.getModel(), index);
	var timeDiff = toRemove[tl.ds.defs.Program.END_TIME] - toRemove[tl.ds.defs.Program.START_TIME];
	goog.array.forEach(this.getModel(), function(item, i) {
		if (i >= index) {
			item[tl.ds.defs.Program.START_TIME] -= timeDiff;
			item[tl.ds.defs.Program.END_TIME] -= timeDiff;
		}
	});
	this.currentlyHighlighedRecord_ = null;
	this.dispatchEvent(tl.Editor.EventType.ITEM_SELECTED);
	this.update();
};

/**
 * Splits a scheduled item at the point of marking.
 */
tl.Editor.prototype.split = function() {
	var model = this.getModel();
	if (!goog.isDefAndNotNull(model)) return;
	if (model.length < 1) return;
	var ct = this.getCurrentTime();
	if (ct == 0 || ct == this.getDuration()) return;
	var record = this.findRecordByTimeStamp(ct);
	if (goog.isNull(record)) return;
	if (ct == record[tl.ds.defs.Program.START_TIME] || ct == record[tl.ds.defs.Program.END_TIME]) return;
	// determine how to split the current record.
	var clone = goog.object.unsafeClone(record);
	var newDur = ct - record[tl.ds.defs.Program.START_TIME];
	record[tl.ds.defs.Program.END_TIME] = ct;
	clone[tl.ds.defs.Program.START_TIME] = ct;
	clone[tl.ds.defs.Program.START_FROM] = newDur;
	clone[tl.ds.defs.Program.DURATION] = clone[tl.ds.defs.Program.DURATION] - newDur;
	record[tl.ds.defs.Program.DURATION] = newDur;
	var index = this.getModel().indexOf(record);
	// insert the new program item.
	goog.array.insertAt(this.getModel(), clone, index + 1);
	this.cut();
};

/**
 * Allows the drag elements to see the drop target in order to bind to it.
 * @public
 * @return {goog.fx.DragDrop} The drop target to use.
 */
tl.Editor.prototype.getDropTarget = function() {
	return this.dnd_;
};

/**
 * Adds the listeners needed.
 */
tl.Editor.prototype.addEventListeners = function() {
	// Add our custom listeners.
	this.getHandler().listen(this.getContentElement(),
		goog.events.EventType.MOUSEOVER, this.onMouseEnter);
	this.getHandler().listen(this.getContentElement(),
		goog.events.EventType.MOUSEOUT, this.onMouseLeave);
};

tl.Editor.prototype.onMouseEnter = function(e) {
	this.mouseIsOver_ = true;
};

/**
 * Overrides the default mouse click handler with one that understands scale
 *   / video sections.
 * @override
 */
tl.Editor.prototype.handleMouseClick = function(e) {
	//console.log(e.offsetY, this.tlScaleHeight)
	if (this.positionMatchesTimeScale(e.offsetY)) {
		goog.base(this, 'handleMouseClick', e);
	} else {
		this.selectedRecordByXOffset(e.offsetX);
	}
};

/**
 * Handler for the click event when it is on the video line.
 * @param {!number} x The X offset of the event.
 * @protected
 */
tl.Editor.prototype.handleClickInVideo = function(x) {

};

/**
 * Handles the mouse movement inside the widget.
 * @param {goog.events.Event} e The mouse move event.
 */
tl.Editor.prototype.handleMouseMove = function(e) {
	if (this.hasDragOver_) {
		// calculate the next free time.
		if (goog.isNull(this.getModel())) this.setModel([]);
		var inTime = this.getPossibleStartTimeFromX(e.offsetX);
		if (this.insertTime != inTime) {
			this.insertTime = inTime;
			this.update();
		}
	}
};

tl.Editor.prototype.getPossibleStartTimeFromX = function(x) {
	var time = this.xToTime(x);
	if (this.getModel().length < 1) return 0;
	var record = this.findRecordByTimeStamp(time);
	if (record == null) {
		if (this.getModel().length > 0) return goog.array.peek(
			this.getModel())[tl.ds.defs.Program.END_TIME];
		return 0;
	} else {
		var startTime = record[tl.ds.defs.Program.START_TIME];
		var endTime = record[tl.ds.defs.Program.END_TIME];
		var sx = this.timeToX(startTime);
		var ex = this.timeToX(endTime);
		if (Math.abs(sx-x) > Math.abs(ex-x)) {
			return endTime;
		} else {
			return startTime;
		}
	}
};

tl.Editor.prototype.onMouseLeave = function(e) {
	this.mouseIsOver_ = false;
	this.insertTime = -1;
};

/**
 * Checks is an Y coordinate value is in the visual vicinity of the scale
 *   (i.e. the time parts visualizations.)
 * @param {!number} y The Y value to check.
 * @return {!boolean} True if the Y value is in the scale visual vicinity,
 *   false otherwise.
 * @public
 */
tl.Editor.prototype.positionMatchesTimeScale = function(y) {
	if (y > this.tlScaleHeight) return false;
	return true;
};

tl.Editor.prototype.selectedRecordByXOffset = function(x) {
	var time = this.xToTime(x);
	var result = this.findRecordByTimeStamp(time);
	if (this.currentlyHighlighedRecord_ != result) {
		this.currentlyHighlighedRecord_ = result;
		this.dispatchEvent(tl.Editor.EventType.ITEM_SELECTED);
		this.update();
	}
};

/**
 * Tries to find a record matching the time stamp.
 * @param {number} time The time in seconds as offset from 0:00 hours.
 * @return {Object} The record if one is found, null otherwise.
 * @public
 */
tl.Editor.prototype.findRecordByTimeStamp = function(time) {

	// Make preliminary searches to be sure we can find actual record.
  if (goog.isNull(this.getModel())) return null;
	if (this.getModel().length == 0) return null;
	if (this.getModel()[0][tl.ds.defs.Program.START_TIME] > time) return null;
	if (goog.array.peek(this.getModel())[tl.ds.defs.Program.END_TIME] < time) return null;

	return goog.array.find(this.getModel(), function(record) {
		if (time >= record[tl.ds.defs.Program.START_TIME] && time < record[tl.ds.defs.Program.END_TIME]) {
			return true;
		}
		return false;
	}, this);
};

tl.Editor.prototype.cut = function() {
	//console.log('Add cut');
	this.cutAnimations.push({
		time: this.getCurrentTime(),
		startTime: goog.now(),
		offset: 0,
		maxOffset: 20
	});
	this.update();
};



/**
 * Subroutine to apply the animations if any. It invoked a next iteration
 *   for the update paint automatically.
 * @param {!number} ts The time stamp of the raf.
 * @protected
 */
tl.Editor.prototype.applyAnimations = function(ts) {
	var toRemove = [];
	goog.array.forEach(this.cutAnimations, function(anim, index, arr) {
		var xoffset;
		if (ts > anim.startTime + this.cutAnimationDuration) {
			toRemove.push(index);
		} else {
			var startTime = 0;
			var endTime = this.cutAnimationDuration;
			var ctime = ts - anim.startTime;
			xoffset = anim.maxOffset / endTime * ctime;
			if (xoffset > anim.maxOffset / 2) xoffset = xoffset - ((xoffset - (
				anim.maxOffset / 2)) * 2);
			var x = this.timeToX(anim.time);
			//this.drawRect_(x - xoffset, this.tlScaleHeight, xoffset * 2,
			//this.size_.height, this.wholeBackground_)
			this.getDrawAdaptor().line(x - xoffset, 0, x + xoffset, this.height_,
				'#ff0000');
			this.getDrawAdaptor().line(x + xoffset, 0, x - xoffset, this.height_,
				'#ff0000');
		}
	}, this);
	var i = toRemove.length - 1;
	while (i > -1) {
		goog.array.removeAt(this.cutAnimations, toRemove[i]);
		i--;
	}
};

/** @inheritDoc */
tl.Editor.prototype.drawsAfterMarker = function(ts) {
	if (!goog.array.isEmpty(this.cutAnimations)) {
		//console.log('apply anim')
		this.applyAnimations(ts);
	}

	if (this.insertTime != -1) {
	  // draw the possible insert time
	  var cx = this.timeToX(this.insertTime);
	  this.getDrawAdaptor().line(cx, 0, cx, this.height_, this.insertColor)
	  this.getDrawAdaptor().rect(cx + 1, 11, 50, 11, this.insertColor)
	  this.getDrawAdaptor().text(pstj.date.utils.getTimestamp(this.insertTime),
	  	cx + 3, 20, this.tlCursorBackgroundColor);
	}
	return (this.cutAnimations.length != 0);
};

/**
 * Getter for the current program.
 * @return {Object} The current selection if any.
 */
tl.Editor.prototype.getCurrentSelectionData = function() {
	return this.currentlyHighlighedRecord_;
};
