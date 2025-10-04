import { useAccount, useChainId } from "wagmi";
import {
  habitTrackerAddress,
  habitTrackerAbi,
  habitSettlerAddress,
  habitSettlerAbi,
  useReadHabitTrackerUserStates,
  useReadHabitTrackerEpochNow,
  useReadHabitTrackerUserHabitCounters,
  useReadHabitTrackerStakingAdapter,
  useReadIStakingAdapterGetPendingRewards,
  useReadIStakingAdapterGetStakedAmount,
} from "../generated";
import type { UserState } from "../types/habit";

/**
 * Hook to interact with HabitTracker and HabitSettler contracts
 * 
 * HabitTracker: Main contract for habits, funding, check-ins
 * HabitSettler: Separate contract for settlement operations (reduces bytecode size)
 */
export function useContracts() {
  const { address } = useAccount();
  const chainId = useChainId();

  const habitTrackerAddr =
    habitTrackerAddress[chainId as keyof typeof habitTrackerAddress];

  const habitSettlerAddr =
    habitSettlerAddress[chainId as keyof typeof habitSettlerAddress];

  // Read user state from HabitTracker
  const {
    data: userStateRaw,
    refetch: refetchUserState,
    error: userStateError,
    isLoading: userStateLoading,
  } = useReadHabitTrackerUserStates({
    chainId: chainId as keyof typeof habitTrackerAddress,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!habitTrackerAddr,
    },
  });

  // Read staking adapter address
  const { data: adapterAddress } = useReadHabitTrackerStakingAdapter({
    chainId: chainId as keyof typeof habitTrackerAddress,
    query: {
      enabled: !!habitTrackerAddr,
    },
  });

  // Read pending rewards from adapter
  const { data: pendingRewards } = useReadIStakingAdapterGetPendingRewards({
    address: adapterAddress,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!adapterAddress && adapterAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Read staked amount from adapter (user's staked principal)
  const { data: stakedAmount } = useReadIStakingAdapterGetStakedAmount({
    address: adapterAddress,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!adapterAddress && adapterAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Convert tuple response to UserState
  const userState: UserState | null = userStateRaw
    ? {
      depositBalance: userStateRaw[0],
      blockedBalance: userStateRaw[1],
      claimableBalance: userStateRaw[2],
      activeHabitCount: Number(userStateRaw[3]),
      yieldRewards: pendingRewards ?? 0n,
      stakedAmount: stakedAmount ?? 0n,
    }
    : null;

  // Read habit counter from HabitTracker
  const { data: habitCounter, refetch: refetchHabitCounter } =
    useReadHabitTrackerUserHabitCounters({
      chainId: chainId as keyof typeof habitTrackerAddress,
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!habitTrackerAddr,
      },
    });

  // Read current epoch from HabitTracker
  const { data: currentEpoch, refetch: refetchEpoch } =
    useReadHabitTrackerEpochNow({
      chainId: chainId as keyof typeof habitTrackerAddress,
      query: {
        enabled: !!habitTrackerAddr,
      },
    });

  return {
    address,
    chainId,
    // HabitTracker (for habits, funding, check-ins, claims)
    habitTracker: {
      address: habitTrackerAddr,
      abi: habitTrackerAbi,
    },
    // HabitSettler (for settlement operations)
    habitSettler: {
      address: habitSettlerAddr,
      abi: habitSettlerAbi,
    },
    // Shared state
    userState,
    userStateError,
    userStateLoading,
    habitCounter,
    currentEpoch,
    refetchUserState,
    refetchHabitCounter,
    refetchEpoch,
  };
}

