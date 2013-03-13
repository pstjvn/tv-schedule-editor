goog.provide('tl.loader');

goog.require('goog.date.Date');
goog.require('pstj.date.utils');
goog.require('pstj.resource');
goog.require('pstj.configure');

/**
 * @fileoverview Provides abstracted mechanism for talking to the server,
 *   instead of messing the code and the server commands, this files should
 *   provide a facet with all the server methods abstracted as regular
 *   functions.
 *
 * @author regardingscot@gmail.com (Peter StJ)
 */

goog.scope(function() {
  var _ = tl.loader;
  var resource = pstj.resource;
  var conf = pstj.configure;

  /**
   * The exec path to ue for the resource configuration.
   * @type {string}
   */
  _.execPath;

  /**
   * Getter for the exec path, we need this as we want to have run time
   * configuration.
   * @return {!string} The execution path for the remote provider.
   */
  _.getExecPath = function() {
    if (!goog.isDef(_.execPath)) {
      _.execPath = conf.getRuntimeValue('EXECPATH',
        '/cgi-bin/ifone.cgi', 'SYSMASTER.TIMELINE').toString();
    }
    return _.execPath;
  };

  /**
   * The main parameter name.
   * @type {!string}
   */
  _.PARAM_RUN = 'run';

  /**
   * The format for dates that the server understands.
   * @type {string}
   */
  _.DATE_FORMAT = 'MM/dd/yyyy';

  /**
   * The program ID parameter name.
   * @type {string}
   */
  _.PARAM_PROGRAM_ID = 'listid';

  /**
   * The program data parameter name.
   * @type {string}
   */
  _.PARAM_PROGRAM_DATA = 'data';

  /**
   * The parameter name for the date variable.
   * @type {string}
   */
  _.PARAM_DATE = 'date';

  /**
   * The value for the main (run) parameter when requesting program schedule.
   * @type {string}
   */
  _.VALUE_LOAD_PROGRAM = 'get_content_schedule';

  /**
   * The value for the main (run) parameter when requesting list of objects
   *   that are available in a program creation.
   * @type {string}
   */
  _.VALUE_LOAD_MEDIA_FILE_LIST = 'get_content_objects';

  /**
   * The value of the run to save data of the schedule on the sever
   * @type {string}
   */
  _.VALUE_SAVE_PROGRAM = 'set_content_schedule';

  /**
   * The value of the run to get all available channels.
   * @type {string}
   */
  _.VALUE_LOAD_CHANNELS = 'get_content_channels';


  /**
   * Get all channels that are available for scheduling.
   * @param {function(Error, Object): void} callback The handler for the data
   *   from the sever.
   */
  _.getChannels = function(callback) {
    var params = {};
    params[_.PARAM_RUN] = _.VALUE_LOAD_CHANNELS;
    _.ResourceProvider_.get(params, callback);
  };

  /**
   * Loads a program schedule by program id and date. We can generalize the
   *   data type to be an object or an array.
   * @param {number} program_id The id of the program to load.
   * @param {number|goog.date.Date|Date} date The date to load.
   * @param {function(Error, (Array|Object)): undefined} callback The callback
   *   to execute with the result.
   */
  _.getProgram = function(program_id, date, callback) {
    if (date instanceof goog.date.Date) date = date.valueOf();
    var params = {};
    params[_.PARAM_RUN] = _.VALUE_LOAD_PROGRAM;
    params[_.PARAM_PROGRAM_ID] = program_id;
    params[_.PARAM_DATE] = pstj.date.utils.renderTimeSafe(date, _.DATE_FORMAT);
    _.ResourceProvider_.get(params, callback);
  };

  /**
   * Retrieves the list of media files to load in the library, available for
   *   creating a schedule in a program.
   * @param {function(Error, Object):void} callback The callback to execute
   *   with the result.
   */
  _.getMediaFiles = function(callback) {
    var params = {};
    params[_.PARAM_RUN] = _.VALUE_LOAD_MEDIA_FILE_LIST;
    _.ResourceProvider_.get(params, callback, true);
  };

  /**
   * Saves the program schedule on the server.
   * @param {number} program_id The ID of the programming channel to save.
   * @param {string} data The schedule to save.
   * @param {function(Error, (Object|Array)): undefined} callback The callback to execute
   *   on complete.
   */
  _.saveProgram = function(program_id, date, data, callback) {
    var params = {}
    params[_.PARAM_RUN] = _.VALUE_SAVE_PROGRAM;
    params[_.PARAM_PROGRAM_ID] = program_id;
    params[_.PARAM_DATE] = pstj.date.utils.renderTimeSafe(date, _.DATE_FORMAT);
    params[_.PARAM_PROGRAM_DATA] = data;
    _.ResourceProvider_.post(params, callback);
  };

  /**
   * The resource provider as reference for internal usage
   * @type {pstj.resource.Resource}
   * @private
   */
  _.ResourceProvider_ = (function() {
    resource.configure({
      run: _.PARAM_RUN,
      execPath: _.getExecPath()
    });
    return resource.getInstance();
  })();

  /**
   * Allows to load fake data into the resource provider.
   * @param {Object} data The stubs to use.
   */
  _.loadFakeData = function(data) {

    if (goog.isFunction(_.ResourceProvider_.loadStubs)) {
      _.ResourceProvider_.loadStubs(data);
    }
  };
});
