/**
 * @fileoverview Provides utility methods for working with the time line.
 */

goog.provide('tl.utils');

goog.require('goog.array');
goog.require('pstj.date.utils');

/**
 * A day in seconds
 * @type {number}
 * @protected
 */
tl.utils.aDay = 86400;

/**
 * The time zone offset that we should add then calculating times.
 * @type {number}
 */
tl.utils.zoneOffset = (new Date()).getTimezoneOffset() * 60;

/**
 * Strips the date from a date-time (as offset from 1970).
 * @param  {!number} time_offset The number of seconds since 1970
 * @return {!number} The number of seconds since the start of the day
 */
tl.utils.stripDate = function(time_offset) {
	return time_offset % tl.utils.aDay;
};

/**
 * Converts a day difference into seconds difference.
 * @param {!number} days The number of days since 1.1.1970
 * @return {!number} Seconds since 1.1.1970
 */
tl.utils.getDaysAsSeconds = function(days) {
	return days * tl.utils.aDay;
};

/**
 * Return the number of days since 1970 for the time offset queried.
 * @param  {!number} time_offset The time offset to use, <b>in seconds</b>.
 * @return {!number} The number of days.
 */
tl.utils.getDays = function(time_offset) {
	return (time_offset / tl.utils.aDay) << 0;
};

/**
 * Stores the default keys to be converted (sysmaster's keys).
 * @type {Array.<string>}
 */
tl.utils.defaultTimeKeys = ['start_time', 'end_time'];

/**
 * Stores the default key to use to store the date part of the date-time
 *   numeric.
 * @type {string}
 */
tl.utils.defaultSaveKey = 'date_partial';

/**
 * Converts an object time stamps to relative time and store the date part in
 *   a different key. The function alters the record object in place.
 * @param  {Object} record The record to convert
 * @param  {Array.<string>=} keys_to_convert Named keys to convert. Make sure
 *   those are ordered in chronological order.
 * @param  {string=} key_to_save The key name to use to store the date portion
 *   in.
 */
tl.utils.convertObjectToRelativeOffset = function(record, keys_to_convert, key_to_save) {
	if (!goog.isArray(keys_to_convert)) keys_to_convert = tl.utils.defaultTimeKeys;
	if (!goog.isString(key_to_save)) key_to_save = tl.utils.defaultSaveKey;
	if (!goog.isObject(record)) throw Error('There is no record object to convert');
	goog.array.forEach(keys_to_convert, function(key){
		if (goog.isNumber(record[key])) {
			var date = tl.utils.getDays(record[key]);

			if (!goog.isNumber(record[key_to_save])) {
				record[key_to_save] = date;
			} else if (goog.isNumber(record[key_to_save])) {
				if (date > record[key_to_save]) { // this is the next day, trim it.
					record[key] = tl.utils.aDay;
					return;
				}
			}
			record[key] = tl.utils.stripDate(record[key]);
		} else {
			throw Error('Cannot convert non-numeric values');
		}
	});
};

/**
 * Convert a whole program to the relative offset schedule. The function
 *   alters the objects in the list in place.
 * @param  {!Array.<Object>} program The record to convert
 * @param  {Array.<string>=} keys Named keys to convert. Make sure those are
 *   ordered in chronological order.
 * @param  {string=} store_key The key name to use to store the date portion
 *   in.
 */
tl.utils.convertScheduleToRelativeTime = function(program, keys, store_key) {
	goog.array.forEach(program, function(obj) {
		tl.utils.convertObjectToRelativeOffset(obj, keys, store_key);
	});
};

/**
 * Converts a record object from time line compatible one to Sysmaster
 *   compatible one. Note that the operation changes the object on place.
 * @param {Object} record The record object to work on.
 * @param {Array.<string>=} keys_to_convert Named keys that has been converted
 *   to convert back.
 * @param {string=} save_key The name of the key that stored the relative
 *   offset padding.
 */
tl.utils.converObjectToAbsoluteOffset = function(record, keys_to_convert, save_key) {
	if (!goog.isArray(keys_to_convert)) keys_to_convert = tl.utils.defaultTimeKeys;
	if (!goog.isString(save_key)) save_key = tl.utils.defaultSaveKey;
	if (!goog.isObject(record)) throw Error('There is no record object to convert');
	goog.array.forEach(keys_to_convert, function(key) {
		if (goog.isNumber(record[key])) {
			if (!goog.isNumber(record[save_key])) throw Error('The save keys does not exists');
			record[key] = record[key] + tl.utils.getDaysAsSeconds(record[save_key]);
		} else {
			throw Error('Cannot convert non-numeric keys');
		}
	});
	delete record[save_key];
};

/**
 * Convert schedule to a piped format. The expected schedule is in a form of
 * array of objects and each object should at least have an ID, start time, end
 * time and start from properties.
 * @param {Array.<Object>} schedule The TV schedule.
 * @param {string} id The ID property name to look up in a single record object.
 * @param {string} start_time The name of the start time property.
 * @param {string} end_time The name of the end time property.
 * @param {string} offset The name of the start from property.
 * @return {string} The serialized schedule.
 */
tl.utils.serializeSchedule = function(schedule, id, start_time, end_time, offset) {
	var result = [];
	var item;
	for (var i = 0; i < schedule.length; i++) {
		item = schedule[i];
		result.push(item[id], item[start_time], item[end_time], item[offset]);
	}
	return result.join('|');
};
