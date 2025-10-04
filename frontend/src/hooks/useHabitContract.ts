import { useAccount, useChainId } from "wagmi";
import {
  habitTrackerAddress,
  habitTrackerAbi,
  useReadHabitTrackerUserStates,
  useReadHabitTrackerEpochNow,
  useReadHabitTrackerUserHabitCounters,
} from "../generated";
import type { UserState } from "../types/habit";

/**
 * Hook to interact with HabitTracker contract reads
 */
export function useHabitContract() {
  const { address } = useAccount();
  const chainId = useChainId();

  const contractAddress =
    habitTrackerAddress[chainId as keyof typeof habitTrackerAddress];

  // Read user state
  const {
    data: userStateRaw,
    refetch: refetchUserState,
    error: userStateError,
    isLoading: userStateLoading,
  } = useReadHabitTrackerUserStates({
    chainId: chainId as keyof typeof habitTrackerAddress,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Convert tuple response to UserState
  const userState: UserState | null = userStateRaw
    ? {
      depositBalance: userStateRaw[0],
      blockedBalance: userStateRaw[1],
      claimableBalance: userStateRaw[2],
      activeHabitCount: userStateRaw[3],
    }
    : null;

  // Read habit counter
  const { data: habitCounter, refetch: refetchHabitCounter } =
    useReadHabitTrackerUserHabitCounters({
      chainId: chainId as keyof typeof habitTrackerAddress,
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!contractAddress,
      },
    });

  // Read current epoch
  const { data: currentEpoch, refetch: refetchEpoch } =
    useReadHabitTrackerEpochNow({
      chainId: chainId as keyof typeof habitTrackerAddress,
      query: {
        enabled: !!contractAddress,
      },
    });

  return {
    address,
    chainId,
    contractAddress,
    userState,
    userStateError,
    userStateLoading,
    habitCounter,
    currentEpoch,
    refetchUserState,
    refetchHabitCounter,
    refetchEpoch,
    abi: habitTrackerAbi,
  };
}

