/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
goog.provide('lf.index.Index');

goog.forwardDeclare('lf.index.KeyRange');



/**
 * Single key to row id(s) index.
 * @interface
 */
lf.index.Index = function() {};


/** @typedef {(string|number)} */
lf.index.Index.Key;


/** @return {string} Normalized name for this index. */
lf.index.Index.prototype.getName;


/**
 * Inserts data into index. If the key already existed, append value to the
 * value list. If the index does not support duplicate keys, adding duplicate
 * keys will result in throwing CONSTRAINT error.
 * @param {!lf.index.Index.Key} key
 * @param {number} value
 * @throws {lf.Exception}
 */
lf.index.Index.prototype.add;


/**
 * Replaces data in index. All existing data for that key will be purged.
 * If the key is not found, inserts the data.
 * @param {!lf.index.Index.Key} key
 * @param {number} value
 */
lf.index.Index.prototype.set;


/**
 * Deletes a row having given key from index. If not found return silently.
 * @param {!lf.index.Index.Key} key
 * @param {number=} opt_rowId Delete a single row id when the index allows
 *     duplicate keys. Ignored for index supporting only unique keys.
 */
lf.index.Index.prototype.remove;


/**
 * Gets values from index. Returns empty array if not found.
 * @param {!lf.index.Index.Key} key
 * @return {!Array.<number>}
 */
lf.index.Index.prototype.get;


/**
 * Gets the cost of retrieving data for given range.
 * @param {!lf.index.KeyRange=} opt_keyRange The key range to search for. If not
 *     provided, the cost will be equal to the number of rows in the table.
 * @return {number}
 */
lf.index.Index.prototype.cost;


/**
 * Retrieves all data within the range. Returns empty array if not found.
 * @param {!lf.index.KeyRange=} opt_keyRange The key range to search for. If not
 *     provided, all rowIds in this index will be returned.
 * @return {!Array.<number>}
 */
lf.index.Index.prototype.getRange;


/**
 * Removes everything from the tree.
 */
lf.index.Index.prototype.clear;


/**
 * Returns true if key existed, otherwise false.
 * @param {!lf.index.Index.Key} key
 * @return {boolean}
 */
lf.index.Index.prototype.containsKey;
