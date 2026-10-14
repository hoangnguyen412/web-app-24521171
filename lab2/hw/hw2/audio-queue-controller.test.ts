import {
  AudioTaskQueue,
} from "./audio-queue-controller";

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

async function testFIFOQueue(): Promise<void> {
  const processed: string[] = [];
  const mockBuffer = {} as AudioBuffer;

  const queue = new MockAudioTaskQueue(
    async (trackUrl, _signal) => {
      processed.push(trackUrl);

      // Simulate one task failing.
      if (trackUrl === "bad-track") {
        throw new Error("Mock loading failure");
      }

      return mockBuffer;
    }
  );

  const results = await Promise.allSettled([
    queue.enqueue("track-1"),
    queue.enqueue("bad-track"),
    queue.enqueue("track-3"),
  ]);

  if (
    processed.join(",") !==
    "track-1,bad-track,track-3"
  ) {
    throw new Error("FIFO order verification failed.");
  }

  if (results[0].status !== "fulfilled") {
    throw new Error("The first task should succeed.");
  }

  if (results[1].status !== "rejected") {
    throw new Error("The failing task should be rejected.");
  }

  if (results[2].status !== "fulfilled") {
    throw new Error("The third task should still succeed.");
  }

  console.log("PASS: FIFO order is preserved.");
  console.log("PASS: A failed task does not block the queue.");
}

void testFIFOQueue();