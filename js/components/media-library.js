goog.provide('tl.MediaLibrary');
goog.provide('tl.MediaLibrary.EventType');

goog.require('goog.dom.dataset');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.registry');
goog.require('pstj.fx.DragDropGroup');
goog.require('pstj.ui.CustomScrollArea');
goog.require('pstj.ui.Templated');
goog.require('tl.ds.Record');
goog.require('tl.ds.RecordList');
goog.require('tl.i18n.ContentSymbols');
goog.require('tl.loader');
goog.require('tl.template');
goog.require('tl.ui.Record');

/**
 * @fileoverview Provides a library view widget that is able to understand the
 * underlying media list and filter it according to the tab pane desired.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

/**
 * Provides the library view for the application. It hosts the list of files
 * on tab panes. The widget holds a tab bar and a single tab pane. The tabs
 * are used to switch between different content types.
 *
 * @constructor
 * @extends {pstj.ui.Templated}
 */
tl.MediaLibrary = function() {
  goog.base(this);

  this.mediaView_ = new pstj.ui.CustomScrollArea();
  this.mediaView_.enableTransitions(true);
  this.mediaView_.setScrollInsideTheWidget(true);
  this.mediaView_.setTransitionToLeft(true);
  this.addChild(this.mediaView_);

  this.addsView_ = new pstj.ui.CustomScrollArea();
  this.addsView_.enableTransitions(true);
  this.addsView_.setTransitionToLeft(true);
  this.addsView_.setScrollInsideTheWidget(true);
  this.addChild(this.addsView_);

  this.tabBar_ = new goog.ui.TabBar();
  this.addChild(this.tabBar_);

  this.dndGroup_ = new pstj.fx.DragDropGroup();
  this.dndGroup_.setDragClass(goog.getCssName('active-drag-element'));
};
goog.inherits(tl.MediaLibrary, pstj.ui.Templated);


/**
 * The scroll view is used to display list of files.
 * @type {pstj.ui.CustomScrollArea}
 * @private
 */
tl.MediaLibrary.prototype.mediaView_;

/**
 * The scroll view is used to display list of files.
 * @type {pstj.ui.CustomScrollArea}
 * @private
 */
tl.MediaLibrary.prototype.addsView_;

/**
 * The tab bar used to draw the library widget.
 * @type {goog.ui.TabBar}
 * @private
 */
tl.MediaLibrary.prototype.tabBar_;

/**
 *
 * @define {number} The maximum number of pixels the library set view should
 *   be.
 */
tl.MediaLibrary.MAX_HEIGHT = 400;

/**
 * The scroll view class name to search for when attempting to decorate.
 * @protected
 * @type {!string}
 */
tl.MediaLibrary.prototype.scrollViewCssClass = goog.getCssName('scroll-view');

/**
 * The class name to use to find the tab bar to decorate.
 * @type {!string}
 * @protected
 */
tl.MediaLibrary.prototype.tabBarCssClass = goog.getCssName('goog-tab-bar');

/**
 * Override the type of the data stored as model in the component.
 * @override
 * @return {tl.ds.RecordList} The data currently stored as model. Should be a
 *   record list.
 */
tl.MediaLibrary.prototype.getModel;


/** @inheritDoc */
tl.MediaLibrary.prototype.getTemplate = function() {
  return tl.template.library({});
};

/** @inheritDoc */
tl.MediaLibrary.prototype.decorateInternal = function(el) {
  goog.base(this, 'decorateInternal', el);
  this.tabBar_.decorate(this.getEls(this.tabBarCssClass));
  // Disable the tabs as we do not have data for them yet.
  this.enableTabs();
};

/**
 * Helper function, this one should be delayed to allow all animations to
 *   render correctly.
 * @private
 */
tl.MediaLibrary.prototype.addListViews_ = function() {
  this.addsView_.render(this.getEls(this.scrollViewCssClass));
  this.mediaView_.render(this.getEls(this.scrollViewCssClass));
};

/**
 * Helper function to enable / disable the tabs according to
 * @param {goog.ui.Component} tab The tab component.
 * @param {boolean} enable True if the tab should be enabled.
 * @protected
 */
tl.MediaLibrary.prototype.enableTab = function(tab, enable) {
  tab.setEnabled(enable);
};

/**
 * Enables / disabled the tabs based on the state of the model.
 */
tl.MediaLibrary.prototype.enableTabs = function() {
  var count = this.tabBar_.getChildCount();
  var enable = !goog.isNull(this.getModel());
  for (var i = 0; i < count; i++) {
    this.enableTab(this.tabBar_.getChildAt(i), enable);
  }
};


/** @inheritDoc */
tl.MediaLibrary.prototype.enterDocument = function() {
  // check which tab is enabled and hide the opposite tab content.
  goog.base(this, 'enterDocument');
  this.getHandler().listen(this.tabBar_, goog.ui.Component.EventType.SELECT,
    this.setActiveView);
  this.loadRemoteData();
};

/**
 * Loads the library data into the view.
 */
tl.MediaLibrary.prototype.loadRemoteData = function() {
  tl.loader.getMediaFiles(goog.bind(function(err, data) {
    if (err) throw Error('Cannot receive data from server');
    this.setModel(new tl.ds.RecordList(goog.array.map(data, function(item) {
      return new tl.ds.Record(item);
    })));
  }, this));
};

/** @inheritDoc */
tl.MediaLibrary.prototype.setModel = function(model) {
  // Actually we accept only media lists here..
  if (!(model instanceof tl.ds.RecordList)) {
    throw Error('The model is expected to be a media file list.');
  }
  goog.base(this, 'setModel', model);
  this.onModelSet();
};

/**
 * Use this to update the active view to the one matching the selected tab.
 */
tl.MediaLibrary.prototype.setActiveView = function() {
  switch (goog.dom.dataset.get(this.tabBar_.getSelectedTab().getElement(),
      'type')) {
    case 'ads':
      this.mediaView_.exitDocument();
      this.addsView_.enterDocument();
      break;
    case 'content':
      this.addsView_.exitDocument();
      this.mediaView_.enterDocument();
      break;
    default:
      break;
  }
};

/**
 * All the magic happens here. Adds animations and all sort of fx when loading
 *   the data.
 */
tl.MediaLibrary.prototype.onModelSet = function() {
  // Redraw the view if we are already rendered
  this.getEls(this.scrollViewCssClass).style.height = tl.MediaLibrary
    .MAX_HEIGHT + 'px';
  this.getEls(this.scrollViewCssClass).style.maxHeight = tl.MediaLibrary
    .MAX_HEIGHT + 'px';
  setTimeout(goog.bind(function() {
    // fill in the items in the scroll views and then add them to the view
    var count = this.getModel().getCount();
    var record;
    var cmp;
    for (var i = 0; i < count; i++) {
      record = /** @type {tl.ds.Record} */ (this.getModel().getByIndex(i));
      cmp = new tl.ui.Record();
      cmp.setModel(record);
      if (record.isAd()) {
        this.addsView_.addChild(cmp, true);
      } else {
        this.mediaView_.addChild(cmp, true);
      }
      this.dndGroup_.addItem(cmp.getElement(), record);
    }
    this.enableTabs();
    this.addListViews_();
    this.tabBar_.setSelectedTabIndex(0);
    // Fire our loaded event, so we can bind dnds.
    this.dispatchEvent(tl.MediaLibrary.EventType.LOAD);
  }, this), 1000);
};

/**
 * Getter for the DND group - used to bind DND events on later stage.
 * @return {goog.fx.DragDropGroup} The dnd group to work with when using the
 *   drag and drop function to add items from the library collection.
 */
tl.MediaLibrary.prototype.getDndGroup = function() {
  return this.dndGroup_;
};

/**
 * Register the media library widget as decorator for the tl-media-library
 *   class.
 */
goog.ui.registry.setDecoratorByClassName(goog.getCssName('tl-media-library'),
    function() {
  return new tl.MediaLibrary();
});

/**
 * @enum {string}
 */
tl.MediaLibrary.EventType = {
  LOAD: goog.events.getUniqueId('load')
};
