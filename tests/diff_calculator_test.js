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
goog.setTestOnly();

goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.jsunit');
goog.require('goog.userAgent.product');
goog.require('lf.DiffCalculator');
goog.require('lf.Global');
goog.require('lf.proc.Relation');
goog.require('lf.query.SelectBuilder');
goog.require('lf.testing.MockEnv');


/** @type {!goog.testing.AsyncTestCase} */
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall(
    'DiffCalculatorTest');


/** @type {!lf.testing.MockSchema} */
var schema;


function setUp() {
  asyncTestCase.waitForAsync('setUp');

  var env = new lf.testing.MockEnv();
  env.init().then(function() {
    schema = env.schema;
    asyncTestCase.continueTesting();
  }, fail);
}


function generateSamlpeRows() {
  var table = schema.getTables()[0];
  var rowCount = 10;
  var rows = new Array(rowCount);
  for (var i = 0; i < rowCount; i++) {
    rows[i] = table.createRow({
      'id': 'dummyId' + i.toString(),
      'name': 'dummyName'
    });
  }

  return rows;
}


/**
 * Tests the case where the observed query explicitly names the columns to be
 * projected.
 */
function testDiffCalculation_ExplicitColumns() {
  var table = schema.getTables()[0];
  var builder = new lf.query.SelectBuilder(
      lf.Global.get(), [table.id, table.name]);
  builder.from(table);
  var query = builder.getQuery();
  checkDiffCalculation(query, 'ExplicitColumns');
}


/**
 * Tests the case where the observed query implicitly projects all columns.
 */
function testDiffCalculation_ImplicitColumns() {
  var table = schema.getTables()[0];
  var builder = new lf.query.SelectBuilder(lf.Global.get(), []);
  builder.from(table);
  var query = builder.getQuery();
  checkDiffCalculation(query, 'ImplicitColumns');
}


/**
 * Checks that change notifications are sent as expected when observed results
 * are mutated in various ways.
 * @param {!lf.query.SelectContext} query The query whose results are being
 *     observed.
 * @param {string} description A short description of the query being tested,
 *     for debug purposes.
 */
function checkDiffCalculation(query, description) {
  // TODO: Array.observe currently exists only in Chrome. Polyfiling mechanism
  // not ready yet, see b/18331726. Remove this once fixed.
  if (!goog.userAgent.product.CHROME) {
    return;
  }

  asyncTestCase.waitForAsync('testDiffCalculation_' + description);

  var callback = function(currentVersion, changes) {
    switch (currentVersion) {
      case 0:
        assertEquals(1, changes.length);
        assertEquals(1, changes[0]['addedCount']);
        assertEquals(0, changes[0].index);
        break;
      case 1:
        assertEquals(2, changes.length);
        assertEquals(1, changes[0]['addedCount']);
        assertEquals(0, changes[0].index);
        assertEquals(1, changes[1]['addedCount']);
        assertEquals(2, changes[1].index);
        break;
      case 2:
        assertEquals(2, changes.length);
        assertEquals(1, changes[0]['addedCount']);
        assertEquals(0, changes[0].index);
        assertEquals(1, changes[1]['addedCount']);
        assertEquals(3, changes[1].index);
        break;
      case 3:
        assertEquals(1, changes.length);
        assertEquals(0, changes[0]['addedCount']);
        assertEquals(1, changes[0].removed.length);
        break;
      case 4:
        assertEquals(3, changes.length);
        assertEquals(0, changes[0]['addedCount']);
        assertEquals(1, changes[0].removed.length);
        assertEquals(1, changes[1]['addedCount']);
        assertEquals(3, changes[1].index);
        assertEquals(1, changes[2]['addedCount']);
        assertEquals(4, changes[2].index);

        asyncTestCase.continueTesting();
    }
  };

  var rows = generateSamlpeRows();
  var rowsPerVersion = [
    // Version0: row3 added.
    [rows[3]],
    // Version1: row2, row5 added.
    [rows[2], rows[3], rows[5]],
    // Version2: row1, row4 added.
    [rows[1], rows[2], rows[3], rows[4], rows[5]],
    // Version3: row2 removed.
    [rows[1], rows[3], rows[4], rows[5]],
    // Version4: row5 removed, row7, row8 added.
    [rows[1], rows[3], rows[4], rows[7], rows[8]]
  ];

  performMutations(rowsPerVersion, query, callback);
}


/**
 * Performs a series of mutations.
 * @param {!Array<!Array<!lf.Row>>} rowsPerVersion The query results for each
 *     version to be simulated.
 * @param {!lf.query.SelectContext} query The query being observed.
 * @param {!function(number, !Array<?>)} callback The function to be called
 *     every time a change is applied.
 */
function performMutations(rowsPerVersion, query, callback) {
  var currentVersion = -1;
  var observable = [];
  var oldResults = lf.proc.Relation.createEmpty();
  var diffCalculator = new lf.DiffCalculator(query, observable);

  /**
   * Updates the observed results to the next version, which should trigger the
   * observer callback.
   */
  var updateResultsToNextVersion = function() {
    currentVersion++;
    var table = schema.getTables()[0];
    var newResults = lf.proc.Relation.fromRows(
        rowsPerVersion[currentVersion], [table.getName()]);
    diffCalculator.applyDiff(oldResults, newResults);
    oldResults = newResults;
  };

  Array.observe(observable, function(changes) {
    callback(currentVersion, changes);
    if (currentVersion < rowsPerVersion.length) {
      updateResultsToNextVersion();
    }
  });
  updateResultsToNextVersion();
}
