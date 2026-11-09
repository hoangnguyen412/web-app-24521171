
interface ClaimResult {
  readonly dropId: string;
  readonly claimId: string;
  readonly remainingStock: number;
}

export class ClaimError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClaimError';
    this.status = status;
  }
}

// Server stock độc lập với stock hiển thị trên UI.
const serverStock = new Map<string, number>([
  ['drop-vip-ticket', 3],
  ['drop-gcoin-crate', 0],
]);

// Lưu Promise để cả những request trùng claimId đang chạy
// cũng không thể trừ stock hai lần.
const processedClaims = new Map<string, Promise<ClaimResult>>();

function abortableDelay(
  delayMs: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'));
      return;
    }

    const timerId = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    const onAbort = (): void => {
      window.clearTimeout(timerId);
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Request aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function claimCrate(
  dropId: string,
  claimId: string,
  signal: AbortSignal,
): Promise<ClaimResult> {
  const previousClaim = processedClaims.get(claimId);

  if (previousClaim) {
    return previousClaim;
  }

  const claimPromise = (async (): Promise<ClaimResult> => {
    await abortableDelay(800, signal);

    const currentStock = serverStock.get(dropId);

    if (currentStock === undefined) {
      throw new ClaimError('Drop not found', 404);
    }

    if (currentStock <= 0) {
      throw new ClaimError('Looted Out', 409);
    }

    const remainingStock = currentStock - 1;
    serverStock.set(dropId, remainingStock);

    return {
      dropId,
      claimId,
      remainingStock,
    };
  })();

  processedClaims.set(claimId, claimPromise);

  return claimPromise.catch((error: unknown) => {
    // Request bị huỷ không được xem là claim đã xử lý.
    if (signal.aborted) {
      processedClaims.delete(claimId);
    }

    throw error;
  });
}
