/**
 * Type definitions for HabitTracker
 */

export type Habit = {
  id: number;
  owner: `0x${string}`;
  text: string;
  createdAtEpoch: bigint;
  archived: boolean;
};

export type DailyStatus = {
  funded: boolean;
  checked: boolean;
  settled: boolean;
};

export type UserState = {
  depositBalance: bigint;
  blockedBalance: bigint;
  claimableBalance: bigint;
  activeHabitCount: number;
};

