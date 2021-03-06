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
goog.provide('lf.backstore.Tx');



/**
 * Tx objects are wrappers of backstore-provided transactions. The interface
 * defines common methods for these wrappers.
 * @interface
 */
lf.backstore.Tx = function() {};


/**
 * @param {!lf.schema.Table} table The schema of the table. Throws an exception
 *     if such a table does not exist.
 * @return {!lf.Stream}
 * @throws {lf.Exception}
 */
lf.backstore.Tx.prototype.getTable;


/**
 * @return {!lf.cache.Journal} The journal associated with this transaction.
 *     The journal keeps track of all changes happened within the transaction.
 */
lf.backstore.Tx.prototype.getJournal;


/**
 * Commits transaction by applying all changes in this transaction's journal to
 * the backing store.
 * @return {!IThenable} A signal that all changes were written to the backing
 *     store.
 */
lf.backstore.Tx.prototype.commit;


/**
 * Aborts tranaction. Caller shall listen to rejection of finished() to detect
 * end of transaction.
 */
lf.backstore.Tx.prototype.abort;
