import { AudioTaskQueue } from "./audio-queue-controller";

type MockLoader = (
  trackUrl: string,
  signal: AbortSignal
) => Promise<AudioBuffer>;

class MockAudioTaskQueue extends AudioTaskQueue {
  constructor(private readonly loader: MockLoader) {
    super();
  }

  protected override loadAudioBuffer(
    trackUrl: string,
    signal: AbortSignal
  ): Promise<AudioBuffer> {
    return this.loader(trackUrl, signal);
  }
}

function assert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const mockBuffer = {} as AudioBuffer;

async function testFIFOAndFailure(): Promise<void> {
  const processed: string[] = [];

  const queue = new MockAudioTaskQueue(
    async (trackUrl) => {
      processed.push(trackUrl);

      if (trackUrl === "bad-track") {
        throw new Error("Mock decoding failure");
      }

      return mockBuffer;
    }
  );

  const results = await Promise.allSettled([
    queue.enqueue("track-1"),
    queue.enqueue("bad-track"),
    queue.enqueue("track-3"),
  ]);

  assert(
    processed.join(",") === "track-1,bad-track,track-3",
    "FIFO order was not preserved."
  );

  assert(results[0]?.status === "fulfilled", "Task 1 should succeed.");
  assert(results[1]?.status === "rejected", "Bad task should reject.");
  assert(results[2]?.status === "fulfilled", "Task 3 should still succeed.");

  console.log("PASS: FIFO order and failure recovery.");
}

async function testCancelActiveTask(): Promise<void> {
  const processed: string[] = [];

  let markStarted!: () => void;

  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });

  const queue = new MockAudioTaskQueue(
    (trackUrl, signal) => {
      processed.push(trackUrl);

      if (trackUrl !== "slow-track") {
        return Promise.resolve(mockBuffer);
      }

      return new Promise<AudioBuffer>((resolve, reject) => {
        const abort = () => {
          reject(
            new DOMException("Request cancelled.", "AbortError")
          );
        };

        if (signal.aborted) {
          abort();
          return;
        }

        signal.addEventListener("abort", abort, { once: true });
        markStarted();
      });
    }
  );

  const cancelledTask = queue.enqueue("slow-track");
  const nextTask = queue.enqueue("track-2");
  const finalTask = queue.enqueue("track-3");

  await started;

  assert(
    queue.cancel("slow-track"),
    "The active task should be cancellable."
  );

  const results = await Promise.allSettled([
    cancelledTask,
    nextTask,
    finalTask,
  ]);

  assert(
    results[0]?.status === "rejected",
    "The cancelled task should reject."
  );

  if (results[0]?.status === "rejected") {
    assert(
      results[0].reason instanceof Error &&
        results[0].reason.name === "AbortError",
      "Cancellation should reject with AbortError."
    );
  }

  assert(
    results[1]?.status === "fulfilled" &&
      results[2]?.status === "fulfilled",
    "Other tasks should continue after cancellation."
  );

  assert(
    processed.join(",") === "slow-track,track-2,track-3",
    "Remaining tasks did not preserve FIFO order."
  );

  console.log("PASS: Cancelling one task does not block the queue.");
}

async function main(): Promise<void> {
  await testFIFOAndFailure();
  await testCancelActiveTask();
}

void main().catch((error: unknown) => {
  console.error(error);
  throw error;
});