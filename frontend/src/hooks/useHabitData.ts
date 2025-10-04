import { useState, useEffect, useCallback } from "react";
import { useConfig } from "wagmi";
import { readContract } from "wagmi/actions";
import { habitTrackerAbi } from "../generated";
import { bytes32ToText, parseDailyStatus } from "../utils/habitHelpers";
import type { Habit, DailyStatus } from "../types/habit";

/**
 * Hook to fetch and manage habit data from the contract
 */
export function useHabitData(
  address: `0x${string}` | undefined,
  contractAddress: `0x${string}` | undefined,
  habitCounter: number | undefined,
  currentEpoch: bigint | undefined
) {
  const config = useConfig();
  const [habits, setHabits] = useState<Record<number, Habit>>({});
  const [habitStatuses, setHabitStatuses] = useState<
    Record<number, DailyStatus>
  >({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchHabits = useCallback(async () => {
    if (!address || !contractAddress || !habitCounter || !config) return;

    const count = Number(habitCounter);
    const newHabits: Record<number, Habit> = {};
    const newStatuses: Record<number, DailyStatus> = {};

    for (let i = 1; i <= count; i++) {
      try {
        // Fetch habit using the public mapping getter
        const habitData: any = await readContract(config, {
          address: contractAddress,
          abi: habitTrackerAbi,
          functionName: "habits",
          args: [address, i],
        });

        if (
          habitData &&
          habitData[1] !== "0x0000000000000000000000000000000000000000"
        ) {
          newHabits[i] = {
            id: Number(habitData[0]),
            owner: habitData[1] as `0x${string}`,
            text: bytes32ToText(habitData[2] as `0x${string}`),
            createdAtEpoch: habitData[3] as bigint,
            archived: habitData[4] as boolean,
          };

          // Fetch daily status if we have current epoch
          if (currentEpoch && !habitData[4]) {
            const statusData: any = await readContract(config, {
              address: contractAddress,
              abi: habitTrackerAbi,
              functionName: "dailyStatuses",
              args: [address, currentEpoch, i],
            });

            if (statusData !== undefined) {
              newStatuses[i] = parseDailyStatus(Number(statusData));
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching habit ${i}:`, error);
      }
    }

    setHabits(newHabits);
    setHabitStatuses(newStatuses);
  }, [address, contractAddress, habitCounter, currentEpoch, config]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits, refetchTrigger]);

  const refetchHabits = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  return { habits, habitStatuses, refetchHabits };
}

