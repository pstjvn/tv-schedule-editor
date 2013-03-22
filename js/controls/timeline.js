goog.provide('tl.control.Timeline');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.dataset');
goog.require('goog.events.EventHandler');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.DatePicker.Events');
goog.require('goog.ui.DatePickerEvent');
goog.require('goog.ui.PopupDatePicker');
goog.require('goog.window');
goog.require('pstj.configure');
goog.require('pstj.ng.Template');
goog.require('pstj.ui.CustomButtonRenderer');
goog.require('pstj.widget.Select');
goog.require('tl.Editor');
goog.require('tl.MediaLibrary');
goog.require('tl.component.Toolbar');
goog.require('tl.ds.defs');
goog.require('tl.loader');
goog.require('tl.template');
goog.require('tl.utils');

/**
 * Provides a control instance that handles the environment changes in the
 *   user interaction land as well as server data.
 * @constructor
 */
tl.control.Timeline = function() {
  this.saveButton = new goog.ui.CustomButton('', pstj.ui.CustomButtonRenderer
    .getInstance());
  this.library = new tl.MediaLibrary();
  /**
   * @protected
   * @type {tl.Editor}
   */
  this.editor = tl.Editor.getInstance();
  this.programView = new pstj.ng.Template('&nbsp;');
  this.channelSelector = new pstj.widget.Select();
  this.programControls = new tl.component.Toolbar();
  this.handler = new goog.events.EventHandler(this);
  this.datepicker = new goog.ui.PopupDatePicker();
  this.datepicker.render();
  // Disable preview for now
  // this.preview = new tl.control.Perview(this.editor);

  /**
   * @private
   * @type {function(this: tl.control.Timeline, Error, (Array|Object)): undefined}
   */
  this.loadScheduleBound_ = goog.bind(this.loadSchedule, this);
  /**
   * @private
   * @type {number}
   */
  this.loadedItems_ = 0;
  /**
   * @private
   * @type {number}
   */
  this.waitListCount_ = 2;
  /**
   * @private
   * @type {number}
   */
  this.currentListId_ = -1;
  /**
   * The default day to start with is run time configurable.
   * @private
   * @type {number}
   */
  this.currentWorkingDate_ = +(pstj.configure.getRuntimeValue('START_DATE',
    goog.now() + 24*60*60*1000, 'SYSMASTER.TIMELINE'));

  this.init();
};


/**
 * Initialize all the needed components and start loading data from the server
 * as soon as possible.
 */
tl.control.Timeline.prototype.init = function() {
  // Add handlers. This should also setup all event listeners as well as wait
  // for the loading of absolutely necessary data.
  this.setupWaitingList();

  // Attach everything to the body.
  document.body.appendChild(goog.dom.htmlToDocumentFragment(
    tl.template.base({})));

  var tmpel;
  tmpel = goog.dom.getElementByClass(goog.getCssName(
    'tl-media-library'));
  if (!goog.dom.isElement(tmpel)) {
    throw new Error('Cannot find where to load the media library');
  }
  this.library.decorate(tmpel);

  tmpel = goog.dom.getElementByClass(goog.getCssName('program-view'));
  if (!goog.dom.isElement(tmpel)) {
    throw new Error('Cannot find where to load current program view');
  }
  this.programView.decorate(tmpel);

  tmpel = goog.dom.getElement('timeline');
  if (!goog.dom.isElement(tmpel)) {
    throw new Error('Cannot find where to load time line.');
  }
  this.editor.decorate(tmpel);

  tmpel = goog.dom.getElementByClass(goog.getCssName('program-controls'));
  if (!goog.dom.isElement(tmpel)) {
    throw new Error('Cannot find where to load controls');
  }

  this.programControls.decorate(tmpel);

  // Load all channels
  tl.loader.getChannels(goog.bind(function(err, data) {
    if (err) {
      this.handleError(err);
      return;
    }
    this.channelSelector.setModel(data);
    this.channelSelector.render(document.body);
    this.channelSelector.open();
    this.handleLoadedItem();
  }, this));

  //this.preview.attach(document.getElementById('video'));
  this.handler.listen(this.datepicker, goog.ui.DatePicker.Events.CHANGE,
    this.handleDateChange);
};

/**
 * Handles the date chaning event from the popup.
 * @param {goog.ui.DatePickerEvent} e The change event from the date picker.
 * @protected
 */
tl.control.Timeline.prototype.handleDateChange = function(e) {
  var d = e.date.valueOf();
  this.currentWorkingDate_ = e.date.valueOf();
  this.requestSchedule();
};

/**
 * Handles errors while still loading all the resources.
 * @param {Error=} err The error that occured.
 */
tl.control.Timeline.prototype.handleError = function(err) {
  alert('There was error loading the application');
};

/**
 * Sets up all event listeners for the whole control. It also takes care for
 * the loading sequence and signaling on the time when the UI is ready to be
 * shown.
 */
tl.control.Timeline.prototype.setupWaitingList = function() {
  this.handler.listen(this.library, tl.MediaLibrary.EventType.LOAD,
    this.handleLoadedItem);

  this.handler.listen(tl.Editor.getInstance(),
    tl.Editor.EventType.ITEM_SELECTED, this.handlerTimelineSelection_);

  this.handler.listen(this.channelSelector, goog.ui.Component.EventType.ACTION,
    this.handleChannelSelection);

  this.handler.listen(this.programControls, goog.ui.Component.EventType.ACTION,
    this.handleControlAction);
};

/**
 * Handles the control action received by the custom tool bar.
 * @param {goog.events.Event} e The ACTION event from a components of the
 *   toolbar.
 */
tl.control.Timeline.prototype.handleControlAction = function(e) {
  var comp = /** @type {goog.ui.Component} */ (e.target);
  var el = comp.getElement();
  var action = goog.dom.dataset.get(el, 'action');
  if (!goog.isNull(action)) {
    this.handleActionByName(action, el);
  }
};

/**
 * Handles named action from the toolbar.
 * @param {string} name The name of the action to perform.
 * @param {Element} el The element that is the root of the component.
 */
tl.control.Timeline.prototype.handleActionByName = function(name, el) {
  switch (name) {
    case 'select-channel':
      this.channelSelector.open();
      break;
    case 'select-date':
      this.datepicker.showPopup(el);
      break;
    case 'save':
      var data = tl.utils.serializeSchedule(this.editor.exportModel(),
        tl.ds.defs.Program.ID,
        tl.ds.defs.Program.START_TIME,
        tl.ds.defs.Program.END_TIME,
        tl.ds.defs.Program.START_FROM);
      tl.loader.saveProgram(this.currentListId_, this.currentWorkingDate_,
        data, function() {});
      break;
    case 'cut':
      this.editor.split();
      break;
    // case 'preview':
    //   this.preview.play();
    //   break;
    case 'delete':
      this.editor.removeSelected();
      break;
    case 'help':
      goog.window.open(goog.asserts.assertString(
        pstj.configure.getRuntimeValue('HELP_URL', 'about:blank',
          'SYSMASTER.TIMELINE')));

      break;
    case 'dump':
      //console.log(this.editor.getModel());
      break;
  }
};

/**
 * Handles the channel selection action. It should be received by the
 *   selection uwidget.
 * @param {goog.events.Event} e The action event from the selection.
 */
tl.control.Timeline.prototype.handleChannelSelection = function(e) {
  e.stopPropagation();
  var model = this.channelSelector.getSelection();
  if (goog.isNull(model)) return;
  this.currentListId_ = +(model.getId());
  this.requestSchedule();
};

/**
 * Requests a schedule from the server using the currently active date.
 * @protected
 */
tl.control.Timeline.prototype.requestSchedule = function() {
  if (this.currentListId_ == -1) return;
  tl.loader.getProgram( /** @type {number} */ (this.currentListId_),
    this.currentWorkingDate_, this.loadScheduleBound_);
};

/**
 * Loads a day schedule data into the application.
 * @param {Error} err The error that was generated if any.
 * @param {Array|Object} data The program schedule.
 * @protected
 */
tl.control.Timeline.prototype.loadSchedule = function(err, data) {
  if (err) { alert('there was an error loading schedule from server.');}
  if (!goog.isArray(data)) {
    throw new Error('The data is not a list.');
  }
  this.editor.setModel(data);
};

/**
 * Handles the event of item selection in the time line editor. This event is
 * fired when the suer clicks in the view side of the time line editor.
 * @param {goog.events.Event} e The event fired from the editor instance.
 * @private
 */
tl.control.Timeline.prototype.handlerTimelineSelection_ = function(e) {
  var currentItem = this.editor.getCurrentSelectionData();
  this.programView.setModel(currentItem || {});
};

/**
 * Handles the ready load states of data for components, basically counting
 * when to invoke the start method of the control.
 * @param {goog.events.Event=} e Any event really assigned to be counted.
 */
tl.control.Timeline.prototype.handleLoadedItem = function(e) {
  this.loadedItems_++;
  if (this.loadedItems_ >= this.waitListCount_) {
    this.start();
  }
};

/**
 * Main method to initialize the UI - after this is called all components will
 * be shown in the view.
 */
tl.control.Timeline.prototype.start = function() {
  // we are ready with everything, setup DND targets and start showing
  // elements.
  var drag = this.library.getDndGroup();
  drag.addTarget(this.editor.getDropTarget());
  this.editor.initDnD();
  drag.init();
};
