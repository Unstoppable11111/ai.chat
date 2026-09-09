import {test} from "node:test";
import assert from "node:assert/strict";
import {maximumDrawdown} from "../src/lib/quant-arena/paper-math.mjs";
test("drawdown uses the historical peak even above initial capital",()=>{
  assert.equal(maximumDrawdown([100,200,150]),25);
  assert.equal(maximumDrawdown([100,80,120,90]),25);
  assert.equal(maximumDrawdown([100,0]),100);
  assert.equal(maximumDrawdown([]),0);
  assert.throws(()=>maximumDrawdown([NaN]));
});
