export class FifoQueue {
  constructor() {
    this.items = [];
    this.head = 0;
  }

  enqueue(item) {
    this.items.push(item);
    return this.size;
  }

  dequeue() {
    if (this.size === 0) {
      return undefined;
    }

    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head += 1;

    // Compact the queue periodically to release consumed items.
    if (this.head > 64 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return item;
  }

  toArray() {
    return this.items.slice(this.head);
  }

  clear() {
    this.items = [];
    this.head = 0;
  }

  get size() {
    return this.items.length - this.head;
  }
}