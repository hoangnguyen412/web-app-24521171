import { useCallback, useEffect, useRef, useState } from 'react';
import type { PubgCrateDrop } from '../types';
import { ClaimError, claimCrate } from '../api/mockServer';

interface UseOptimisticClaimResult {
  readonly drops: PubgCrateDrop[];
  readonly claimingDropIds: string[];
  readonly claimStatus: string;
  readonly claim: (dropId: string, canClaim: boolean) => Promise<void>;
}

export function useOptimisticClaim(
  initialDrops: readonly PubgCrateDrop[],
): UseOptimisticClaimResult {
  const [drops, setDrops] = useState<PubgCrateDrop[]>(() =>
    initialDrops.map((drop) => ({ ...drop })),
  );

  const [claimingDropIds, setClaimingDropIds] = useState<string[]>([]);
  const [claimStatus, setClaimStatus] = useState('');

  // Khóa đồng bộ để ngăn double-click trước khi React cập nhật state.
  const inFlightRef = useRef<Set<string>>(new Set());

  // Lưu AbortController của các request đang chạy.
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  // Theo dõi component đã unmount hay chưa.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      controllersRef.current.forEach((controller) => {
        controller.abort();
      });

      controllersRef.current.clear();
      inFlightRef.current.clear();
    };
  }, []);

  const claim = useCallback(
    async (dropId: string, canClaim: boolean): Promise<void> => {
      if (!canClaim || inFlightRef.current.has(dropId)) {
        return;
      }

      const targetDrop = drops.find((drop) => drop.id === dropId);

      if (!targetDrop || targetDrop.remainingStock <= 0) {
        return;
      }

      const claimId = crypto.randomUUID();
      const controller = new AbortController();

      inFlightRef.current.add(dropId);
      controllersRef.current.set(dropId, controller);

      // Optimistic update: giảm stock ngay trên UI.
      setDrops((currentDrops) =>
        currentDrops.map((drop) =>
          drop.id === dropId
            ? { ...drop, remainingStock: drop.remainingStock - 1 }
            : drop,
        ),
      );

      setClaimingDropIds((currentIds) => [...currentIds, dropId]);
      setClaimStatus(`Đang xử lý claim: ${targetDrop.title}...`);

      try {
        await claimCrate(dropId, claimId, controller.signal);

        if (!mountedRef.current) {
          return;
        }

        setClaimStatus(`Claim thành công: ${targetDrop.title}`);
      } catch (error: unknown) {
        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        // Rollback: hoàn lại đúng 1 stock đã giảm trước đó.
        setDrops((currentDrops) =>
          currentDrops.map((drop) =>
            drop.id === dropId
              ? { ...drop, remainingStock: drop.remainingStock + 1 }
              : drop,
          ),
        );

        if (error instanceof ClaimError && error.status === 409) {
          setClaimStatus(`${targetDrop.title}: Looted Out`);
        } else {
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          setClaimStatus(`Claim thất bại: ${message}`);
        }
      } finally {
        inFlightRef.current.delete(dropId);
        controllersRef.current.delete(dropId);

        if (mountedRef.current) {
          setClaimingDropIds((currentIds) =>
            currentIds.filter((id) => id !== dropId),
          );
        }
      }
    },
    [drops],
  );

  return {
    drops,
    claimingDropIds,
    claimStatus,
    claim,
  };
}