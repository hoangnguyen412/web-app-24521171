import { useCallback, useEffect, useRef, useState } from 'react';
import { ClaimError, claimCrate } from '../api/mockServer';
import type { PubgCrateDrop } from '../types';

interface UseOptimisticClaimResult {
  drops: readonly PubgCrateDrop[];
  claimingDropIds: readonly string[];
  claimStatus: string;
  claim: (dropId: string, canClaim: boolean) => Promise<void>;
}

export function useOptimisticClaim(
  initialDrops: readonly PubgCrateDrop[],
): UseOptimisticClaimResult {
  const [drops, setDrops] = useState<readonly PubgCrateDrop[]>(initialDrops);
  const [claimingDropIds, setClaimingDropIds] = useState<string[]>([]);
  const [claimStatus, setClaimStatus] = useState('');

  const inFlightRef = useRef(new Set<string>());
  const controllersRef = useRef(new Map<string, AbortController>());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const controllers = controllersRef.current;
    const inFlight = inFlightRef.current;

    return () => {
      mountedRef.current = false;

      controllers.forEach((controller) => {
        controller.abort();
      });

      controllers.clear();
      inFlight.clear();
    };
  }, []);

  const claim = useCallback(
    async (dropId: string, canClaim: boolean): Promise<void> => {
      if (!canClaim || inFlightRef.current.has(dropId)) {
        return;
      }

      const selectedDrop = drops.find((drop) => drop.id === dropId);

      if (!selectedDrop || selectedDrop.remainingStock <= 0) {
        return;
      }

      const claimId = crypto.randomUUID();
      const controller = new AbortController();

      inFlightRef.current.add(dropId);
      controllersRef.current.set(dropId, controller);

      setClaimingDropIds((current) => [...current, dropId]);
      setClaimStatus(`Claiming ${selectedDrop.title}...`);

      // Optimistic update
      setDrops((currentDrops) =>
        currentDrops.map((drop) =>
          drop.id === dropId
            ? {
                ...drop,
                remainingStock: drop.remainingStock - 1,
              }
            : drop,
        ),
      );

      try {
        await claimCrate(dropId, claimId, controller.signal);

        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        setClaimStatus(`Successfully claimed ${selectedDrop.title}!`);
      } catch (error) {
        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        // Rollback optimistic update
        setDrops((currentDrops) =>
          currentDrops.map((drop) =>
            drop.id === dropId
              ? {
                  ...drop,
                  remainingStock: drop.remainingStock + 1,
                }
              : drop,
          ),
        );

        if (error instanceof ClaimError && error.status === 409) {
          setClaimStatus(`${selectedDrop.title}: Looted Out`);
        } else {
          setClaimStatus(`${selectedDrop.title}: Claim failed.`);
        }
      } finally {
        inFlightRef.current.delete(dropId);
        controllersRef.current.delete(dropId);

        if (mountedRef.current) {
          setClaimingDropIds((current) =>
            current.filter((id) => id !== dropId),
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