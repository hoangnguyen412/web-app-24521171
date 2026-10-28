import assert from "node:assert/strict";
import { FifoQueue } from "../src/utils/FifoQueue.js";

const queue = new FifoQueue();

assert.equal(queue.size, 0);
assert.equal(queue.dequeue(), undefined);

queue.enqueue("A4");
queue.enqueue("C5");
queue.enqueue("E5");

assert.equal(queue.size, 3);
assert.equal(queue.dequeue(), "A4");
assert.equal(queue.dequeue(), "C5");
assert.deepEqual(queue.toArray(), ["E5"]);

const snapshot = queue.toArray();
snapshot.push("G5");

assert.deepEqual(queue.toArray(), ["E5"]);

assert.equal(queue.dequeue(), "E5");
assert.equal(queue.size, 0);
assert.equal(queue.dequeue(), undefined);

queue.enqueue("D4");
queue.enqueue("F4");
queue.clear();

assert.equal(queue.size, 0);
assert.deepEqual(queue.toArray(), []);

console.log("PASS: FIFO order is correct.");
console.log("PASS: dequeue and size are correct.");
console.log("PASS: toArray returns a copy.");
console.log("PASS: clear resets the queue.");