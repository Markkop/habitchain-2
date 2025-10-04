/**
 * Type definitions for HabitTracker
 * 
 * Terminology:
 * - Funded Stake: User deposits locked during the day (blockedBalance)
 * - Yield Stake: Successful rewards staked externally for yield generation
 * - User Rewards: Base rewards from successful habit completion (claimableBalance)
 * - Yield Rewards: Additional rewards generated from external staking (Moonwell)
 */

export type Habit = {
  text: string;
  createdAtEpoch: bigint;
  archived: boolean;
};

export type DailyStatus = {
  funded: boolean;  // Has funded stake locked for this day
  checked: boolean; // User checked in
  settled: boolean; // Day has been settled
};

export type UserState = {
  depositBalance: bigint;      // Available funds for staking on habits
  blockedBalance: bigint;       // Funded stake: locked during active day
  claimableBalance: bigint;     // User rewards: earned from successful habits (only if no adapter)
  activeHabitCount: number;     // Number of active (non-archived) habits
  yieldRewards: bigint;         // Pending yield rewards from staking adapter
  stakedAmount: bigint;         // User's staked principal in adapter (their successful habit rewards)
};

