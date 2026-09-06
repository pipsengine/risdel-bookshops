import assert from "node:assert/strict";
import {
  parseBoolean,
  parseInteger,
  parseDecimal,
  normalizeEmail,
  rowToRecord,
  recordToRow
} from "../../src/data/providers/google-sheets/sheets.mapper";

assert.equal(parseBoolean("false"), false);
assert.equal(parseBoolean("FALSE"), false);
assert.equal(parseBoolean("true"), true);
assert.equal(parseBoolean("1"), true);
assert.equal(parseBoolean(""), false);
assert.equal(parseInteger("42"), 42);
assert.equal(parseDecimal("12.50"), 12.5);
assert.equal(normalizeEmail(" Admin@Risdel.Local "), "admin@risdel.local");

const headers = ["Id", "Name", "IsActive"];
const record = rowToRecord(headers, ["abc", "Main", "FALSE"]);
assert.equal(record.IsActive, "FALSE");
assert.equal(parseBoolean(record.IsActive), false);
assert.deepEqual(recordToRow(headers, { Id: "abc", Name: "Main", IsActive: false }), [
  "abc",
  "Main",
  "FALSE"
]);

console.log("mapper tests passed");
