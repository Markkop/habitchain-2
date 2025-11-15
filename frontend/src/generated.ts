import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HabitSettler
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const habitSettlerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_habitTracker', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'CannotSettleCurrentDay' },
  { type: 'error', inputs: [], name: 'InvalidBatchSize' },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'startEpoch', internalType: 'uint64', type: 'uint64' },
      { name: 'maxSettlements', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'forceSettleAllEpochs',
    outputs: [{ name: 'settledCount', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'maxCount', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'forceSettleDay',
    outputs: [{ name: 'settledCount', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'habitTracker',
    outputs: [
      { name: '', internalType: 'contract IHabitTracker', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'maxCount', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'settleAll',
    outputs: [{ name: 'settledCount', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epochs', internalType: 'uint64[]', type: 'uint64[]' },
      { name: 'habitIds', internalType: 'uint32[]', type: 'uint32[]' },
    ],
    name: 'settleBatch',
    outputs: [{ name: 'settledCount', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 *
 */
export const habitSettlerAddress = {
  420420422: '0x4Ec071E3F329AFc3dC866Af30089Ed201Ad5fC97',
} as const

/**
 *
 */
export const habitSettlerConfig = {
  address: habitSettlerAddress,
  abi: habitSettlerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HabitTracker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const habitTrackerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_treasury', internalType: 'address', type: 'address' },
      { name: '_stakingAdapter', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AlreadyCheckedIn' },
  { type: 'error', inputs: [], name: 'AlreadySettled' },
  { type: 'error', inputs: [], name: 'CannotSettleCurrentDay' },
  { type: 'error', inputs: [], name: 'DayNotFunded' },
  { type: 'error', inputs: [], name: 'HabitAlreadyArchived' },
  { type: 'error', inputs: [], name: 'HabitIdTooLarge' },
  { type: 'error', inputs: [], name: 'HabitNotFound' },
  { type: 'error', inputs: [], name: 'HabitTextTooLong' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidAmount' },
  { type: 'error', inputs: [], name: 'InvalidBalanceType' },
  { type: 'error', inputs: [], name: 'InvalidEpoch' },
  { type: 'error', inputs: [], name: 'InvalidStakingAdapter' },
  { type: 'error', inputs: [], name: 'InvalidTreasury' },
  { type: 'error', inputs: [], name: 'OnlyOwner' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      { name: 'from', internalType: 'uint8', type: 'uint8', indexed: true },
      { name: 'to', internalType: 'uint8', type: 'uint8', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BalanceMoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'habitId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      { name: 'epoch', internalType: 'uint64', type: 'uint64', indexed: true },
    ],
    name: 'CheckedIn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      { name: 'epoch', internalType: 'uint64', type: 'uint64', indexed: true },
      {
        name: 'fundedCount',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'insufficientCount',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
    ],
    name: 'DayPrepared',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'habitId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
    ],
    name: 'HabitArchived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'habitId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      {
        name: 'text',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'HabitCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'habitId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      { name: 'epoch', internalType: 'uint64', type: 'uint64', indexed: true },
      {
        name: 'slashed',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SettledFail',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'habitId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      { name: 'epoch', internalType: 'uint64', type: 'uint64', indexed: true },
      {
        name: 'reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SettledSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAdapter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAdapter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'StakingAdapterUpdated',
  },
  {
    type: 'function',
    inputs: [],
    name: 'STAKE_PER_DAY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'habitId', internalType: 'uint32', type: 'uint32' }],
    name: 'archiveHabit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'checked',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'claimAll',
    outputs: [{ name: 'total', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'claimYieldRewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'text', internalType: 'bytes32', type: 'bytes32' }],
    name: 'createHabit',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'epochNow',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'forceSettle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'funded',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'habits',
    outputs: [
      { name: 'text', internalType: 'bytes32', type: 'bytes32' },
      { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
      { name: 'archived', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'uint8', type: 'uint8' },
      { name: 'to', internalType: 'uint8', type: 'uint8' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'move',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'epoch', internalType: 'uint64', type: 'uint64' }],
    name: 'prepareDay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_newAdapter', internalType: 'address', type: 'address' }],
    name: 'setStakingAdapter',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'settle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'settled',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'stakingAdapter',
    outputs: [
      { name: '', internalType: 'contract IStakingAdapter', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'userHabitCounters',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'userStates',
    outputs: [
      { name: 'depositBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'blockedBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'claimableBalance', internalType: 'uint256', type: 'uint256' },
      { name: 'activeHabitCount', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'view',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 *
 */
export const habitTrackerAddress = {
  420420422: '0x021df1E1B082b667291433753541747907C28E33',
} as const

/**
 *
 */
export const habitTrackerConfig = {
  address: habitTrackerAddress,
  abi: habitTrackerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IComptroller
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iComptrollerAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'rewardType', internalType: 'uint8', type: 'uint8' },
      { name: 'holder', internalType: 'address', type: 'address' },
      { name: 'mTokens', internalType: 'address[]', type: 'address[]' },
    ],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20Abi = [
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IHabitTracker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iHabitTrackerAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'epochNow',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'forceSettle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'funded',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'habits',
    outputs: [
      { name: 'text', internalType: 'bytes32', type: 'bytes32' },
      { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
      { name: 'archived', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'settle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'settled',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'userHabitCounters',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMTokenNative
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const imTokenNativeAbi = [
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exchangeRateStored',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'redeemTokens', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'redeem',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'redeemAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'redeemUnderlying',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IStakingAdapter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iStakingAdapterAbi = [
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'claimRewards',
    outputs: [{ name: 'claimed', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'who', internalType: 'address', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ name: 'pending', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'who', internalType: 'address', type: 'address' }],
    name: 'getStakedAmount',
    outputs: [{ name: 'staked', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MockStakingRewards
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const mockStakingRewardsAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_ratePerSecond', internalType: 'uint256', type: 'uint256' },
      { name: '_habitTracker', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidAmount' },
  { type: 'error', inputs: [], name: 'OnlyHabitTracker' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardsClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Staked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Unstaked',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'claimRewards',
    outputs: [{ name: 'claimed', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'deposits',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getContractBalance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'who', internalType: 'address', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'who', internalType: 'address', type: 'address' }],
    name: 'getStakedAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'habitTracker',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'lastUpdateTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ratePerSecond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 *
 */
export const mockStakingRewardsAddress = {
  420420422: '0x3506fE17674B11d316Aa3b1754455549863ab108',
} as const

/**
 *
 */
export const mockStakingRewardsConfig = {
  address: mockStakingRewardsAddress,
  abi: mockStakingRewardsAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MoonwellAdapter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const moonwellAdapterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_mToken', internalType: 'address', type: 'address' },
      { name: '_comptroller', internalType: 'address', type: 'address' },
      { name: '_habitTracker', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'InvalidAmount' },
  { type: 'error', inputs: [], name: 'MintFailed' },
  { type: 'error', inputs: [], name: 'OnlyHabitTracker' },
  { type: 'error', inputs: [], name: 'RedeemFailed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardsClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'mTokens',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Staked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'mTokens',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Unstaked',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'claimRewards',
    outputs: [{ name: 'claimed', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'comptroller',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'getPendingRewards',
    outputs: [{ name: 'pending', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'who', internalType: 'address', type: 'address' }],
    name: 'getStakedAmount',
    outputs: [{ name: 'staked', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'habitTracker',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'userStakes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitSettlerAbi}__
 *
 *
 */
export const useReadHabitSettler = /*#__PURE__*/ createUseReadContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"habitTracker"`
 *
 *
 */
export const useReadHabitSettlerHabitTracker =
  /*#__PURE__*/ createUseReadContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'habitTracker',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitSettlerAbi}__
 *
 *
 */
export const useWriteHabitSettler = /*#__PURE__*/ createUseWriteContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"forceSettleAllEpochs"`
 *
 *
 */
export const useWriteHabitSettlerForceSettleAllEpochs =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'forceSettleAllEpochs',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"forceSettleDay"`
 *
 *
 */
export const useWriteHabitSettlerForceSettleDay =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'forceSettleDay',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"settleAll"`
 *
 *
 */
export const useWriteHabitSettlerSettleAll =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'settleAll',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"settleBatch"`
 *
 *
 */
export const useWriteHabitSettlerSettleBatch =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'settleBatch',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitSettlerAbi}__
 *
 *
 */
export const useSimulateHabitSettler = /*#__PURE__*/ createUseSimulateContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"forceSettleAllEpochs"`
 *
 *
 */
export const useSimulateHabitSettlerForceSettleAllEpochs =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'forceSettleAllEpochs',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"forceSettleDay"`
 *
 *
 */
export const useSimulateHabitSettlerForceSettleDay =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'forceSettleDay',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"settleAll"`
 *
 *
 */
export const useSimulateHabitSettlerSettleAll =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'settleAll',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitSettlerAbi}__ and `functionName` set to `"settleBatch"`
 *
 *
 */
export const useSimulateHabitSettlerSettleBatch =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitSettlerAbi,
  address: habitSettlerAddress,
  functionName: 'settleBatch',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__
 *
 *
 */
export const useReadHabitTracker = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"STAKE_PER_DAY"`
 *
 *
 */
export const useReadHabitTrackerStakePerDay =
  /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'STAKE_PER_DAY',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"checked"`
 *
 *
 */
export const useReadHabitTrackerChecked = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'checked',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"epochNow"`
 *
 *
 */
export const useReadHabitTrackerEpochNow = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'epochNow',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"funded"`
 *
 *
 */
export const useReadHabitTrackerFunded = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'funded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"habits"`
 *
 *
 */
export const useReadHabitTrackerHabits = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'habits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadHabitTrackerOwner = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"settled"`
 *
 *
 */
export const useReadHabitTrackerSettled = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'settled',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"stakingAdapter"`
 *
 *
 */
export const useReadHabitTrackerStakingAdapter =
  /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'stakingAdapter',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"treasury"`
 *
 *
 */
export const useReadHabitTrackerTreasury = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'treasury',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"userHabitCounters"`
 *
 *
 */
export const useReadHabitTrackerUserHabitCounters =
  /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'userHabitCounters',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"userStates"`
 *
 *
 */
export const useReadHabitTrackerUserStates =
  /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'userStates',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__
 *
 *
 */
export const useWriteHabitTracker = /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"archiveHabit"`
 *
 *
 */
export const useWriteHabitTrackerArchiveHabit =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'archiveHabit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"checkIn"`
 *
 *
 */
export const useWriteHabitTrackerCheckIn = /*#__PURE__*/ createUseWriteContract(
  {
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'checkIn',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claimAll"`
 *
 *
 */
export const useWriteHabitTrackerClaimAll =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'claimAll',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claimYieldRewards"`
 *
 *
 */
export const useWriteHabitTrackerClaimYieldRewards =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'claimYieldRewards',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"createHabit"`
 *
 *
 */
export const useWriteHabitTrackerCreateHabit =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'createHabit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const useWriteHabitTrackerDeposit = /*#__PURE__*/ createUseWriteContract(
  {
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'deposit',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"forceSettle"`
 *
 *
 */
export const useWriteHabitTrackerForceSettle =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'forceSettle',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"move"`
 *
 *
 */
export const useWriteHabitTrackerMove = /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'move',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"prepareDay"`
 *
 *
 */
export const useWriteHabitTrackerPrepareDay =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'prepareDay',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"setStakingAdapter"`
 *
 *
 */
export const useWriteHabitTrackerSetStakingAdapter =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'setStakingAdapter',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"settle"`
 *
 *
 */
export const useWriteHabitTrackerSettle = /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'settle',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteHabitTrackerTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__
 *
 *
 */
export const useSimulateHabitTracker = /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"archiveHabit"`
 *
 *
 */
export const useSimulateHabitTrackerArchiveHabit =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'archiveHabit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"checkIn"`
 *
 *
 */
export const useSimulateHabitTrackerCheckIn =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'checkIn',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claimAll"`
 *
 *
 */
export const useSimulateHabitTrackerClaimAll =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'claimAll',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claimYieldRewards"`
 *
 *
 */
export const useSimulateHabitTrackerClaimYieldRewards =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'claimYieldRewards',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"createHabit"`
 *
 *
 */
export const useSimulateHabitTrackerCreateHabit =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'createHabit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const useSimulateHabitTrackerDeposit =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"forceSettle"`
 *
 *
 */
export const useSimulateHabitTrackerForceSettle =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'forceSettle',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"move"`
 *
 *
 */
export const useSimulateHabitTrackerMove =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'move',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"prepareDay"`
 *
 *
 */
export const useSimulateHabitTrackerPrepareDay =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'prepareDay',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"setStakingAdapter"`
 *
 *
 */
export const useSimulateHabitTrackerSetStakingAdapter =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'setStakingAdapter',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"settle"`
 *
 *
 */
export const useSimulateHabitTrackerSettle =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'settle',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateHabitTrackerTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__
 *
 *
 */
export const useWatchHabitTrackerEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"BalanceMoved"`
 *
 *
 */
export const useWatchHabitTrackerBalanceMovedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'BalanceMoved',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"CheckedIn"`
 *
 *
 */
export const useWatchHabitTrackerCheckedInEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'CheckedIn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"DayPrepared"`
 *
 *
 */
export const useWatchHabitTrackerDayPreparedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'DayPrepared',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"Deposited"`
 *
 *
 */
export const useWatchHabitTrackerDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"HabitArchived"`
 *
 *
 */
export const useWatchHabitTrackerHabitArchivedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'HabitArchived',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"HabitCreated"`
 *
 *
 */
export const useWatchHabitTrackerHabitCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'HabitCreated',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"SettledFail"`
 *
 *
 */
export const useWatchHabitTrackerSettledFailEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'SettledFail',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"SettledSuccess"`
 *
 *
 */
export const useWatchHabitTrackerSettledSuccessEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'SettledSuccess',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"StakingAdapterUpdated"`
 *
 *
 */
export const useWatchHabitTrackerStakingAdapterUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  eventName: 'StakingAdapterUpdated',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iComptrollerAbi}__
 */
export const useWriteIComptroller = /*#__PURE__*/ createUseWriteContract({
  abi: iComptrollerAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iComptrollerAbi}__ and `functionName` set to `"claimReward"`
 */
export const useWriteIComptrollerClaimReward =
  /*#__PURE__*/ createUseWriteContract({
  abi: iComptrollerAbi,
  functionName: 'claimReward',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iComptrollerAbi}__
 */
export const useSimulateIComptroller = /*#__PURE__*/ createUseSimulateContract({
  abi: iComptrollerAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iComptrollerAbi}__ and `functionName` set to `"claimReward"`
 */
export const useSimulateIComptrollerClaimReward =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iComptrollerAbi,
  functionName: 'claimReward',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ierc20Abi}__
 */
export const useReadIerc20 = /*#__PURE__*/ createUseReadContract({
  abi: ierc20Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ierc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIerc20BalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: ierc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link ierc20Abi}__
 */
export const useWriteIerc20 = /*#__PURE__*/ createUseWriteContract({
  abi: ierc20Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link ierc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteIerc20Approve = /*#__PURE__*/ createUseWriteContract({
  abi: ierc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link ierc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useWriteIerc20Transfer = /*#__PURE__*/ createUseWriteContract({
  abi: ierc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link ierc20Abi}__
 */
export const useSimulateIerc20 = /*#__PURE__*/ createUseSimulateContract({
  abi: ierc20Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link ierc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateIerc20Approve = /*#__PURE__*/ createUseSimulateContract(
  { abi: ierc20Abi, functionName: 'approve' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link ierc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateIerc20Transfer =
  /*#__PURE__*/ createUseSimulateContract({
  abi: ierc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__
 */
export const useReadIHabitTracker = /*#__PURE__*/ createUseReadContract({
  abi: iHabitTrackerAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"epochNow"`
 */
export const useReadIHabitTrackerEpochNow = /*#__PURE__*/ createUseReadContract(
  { abi: iHabitTrackerAbi, functionName: 'epochNow' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"funded"`
 */
export const useReadIHabitTrackerFunded = /*#__PURE__*/ createUseReadContract({
  abi: iHabitTrackerAbi,
  functionName: 'funded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"habits"`
 */
export const useReadIHabitTrackerHabits = /*#__PURE__*/ createUseReadContract({
  abi: iHabitTrackerAbi,
  functionName: 'habits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"settled"`
 */
export const useReadIHabitTrackerSettled = /*#__PURE__*/ createUseReadContract({
  abi: iHabitTrackerAbi,
  functionName: 'settled',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"userHabitCounters"`
 */
export const useReadIHabitTrackerUserHabitCounters =
  /*#__PURE__*/ createUseReadContract({
  abi: iHabitTrackerAbi,
  functionName: 'userHabitCounters',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iHabitTrackerAbi}__
 */
export const useWriteIHabitTracker = /*#__PURE__*/ createUseWriteContract({
  abi: iHabitTrackerAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"forceSettle"`
 */
export const useWriteIHabitTrackerForceSettle =
  /*#__PURE__*/ createUseWriteContract({
  abi: iHabitTrackerAbi,
  functionName: 'forceSettle',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"settle"`
 */
export const useWriteIHabitTrackerSettle = /*#__PURE__*/ createUseWriteContract(
  { abi: iHabitTrackerAbi, functionName: 'settle' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iHabitTrackerAbi}__
 */
export const useSimulateIHabitTracker = /*#__PURE__*/ createUseSimulateContract(
  { abi: iHabitTrackerAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"forceSettle"`
 */
export const useSimulateIHabitTrackerForceSettle =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iHabitTrackerAbi,
  functionName: 'forceSettle',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iHabitTrackerAbi}__ and `functionName` set to `"settle"`
 */
export const useSimulateIHabitTrackerSettle =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iHabitTrackerAbi,
  functionName: 'settle',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link imTokenNativeAbi}__
 */
export const useReadImTokenNative = /*#__PURE__*/ createUseReadContract({
  abi: imTokenNativeAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadImTokenNativeBalanceOf =
  /*#__PURE__*/ createUseReadContract({
  abi: imTokenNativeAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"exchangeRateStored"`
 */
export const useReadImTokenNativeExchangeRateStored =
  /*#__PURE__*/ createUseReadContract({
  abi: imTokenNativeAbi,
  functionName: 'exchangeRateStored',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link imTokenNativeAbi}__
 */
export const useWriteImTokenNative = /*#__PURE__*/ createUseWriteContract({
  abi: imTokenNativeAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"mint"`
 */
export const useWriteImTokenNativeMint = /*#__PURE__*/ createUseWriteContract({
  abi: imTokenNativeAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"redeem"`
 */
export const useWriteImTokenNativeRedeem = /*#__PURE__*/ createUseWriteContract(
  { abi: imTokenNativeAbi, functionName: 'redeem' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"redeemUnderlying"`
 */
export const useWriteImTokenNativeRedeemUnderlying =
  /*#__PURE__*/ createUseWriteContract({
  abi: imTokenNativeAbi,
  functionName: 'redeemUnderlying',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link imTokenNativeAbi}__
 */
export const useSimulateImTokenNative = /*#__PURE__*/ createUseSimulateContract(
  { abi: imTokenNativeAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateImTokenNativeMint =
  /*#__PURE__*/ createUseSimulateContract({
  abi: imTokenNativeAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"redeem"`
 */
export const useSimulateImTokenNativeRedeem =
  /*#__PURE__*/ createUseSimulateContract({
  abi: imTokenNativeAbi,
  functionName: 'redeem',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link imTokenNativeAbi}__ and `functionName` set to `"redeemUnderlying"`
 */
export const useSimulateImTokenNativeRedeemUnderlying =
  /*#__PURE__*/ createUseSimulateContract({
  abi: imTokenNativeAbi,
  functionName: 'redeemUnderlying',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iStakingAdapterAbi}__
 */
export const useReadIStakingAdapter = /*#__PURE__*/ createUseReadContract({
  abi: iStakingAdapterAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"getPendingRewards"`
 */
export const useReadIStakingAdapterGetPendingRewards =
  /*#__PURE__*/ createUseReadContract({
  abi: iStakingAdapterAbi,
  functionName: 'getPendingRewards',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"getStakedAmount"`
 */
export const useReadIStakingAdapterGetStakedAmount =
  /*#__PURE__*/ createUseReadContract({
  abi: iStakingAdapterAbi,
  functionName: 'getStakedAmount',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iStakingAdapterAbi}__
 */
export const useWriteIStakingAdapter = /*#__PURE__*/ createUseWriteContract({
  abi: iStakingAdapterAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"claimRewards"`
 */
export const useWriteIStakingAdapterClaimRewards =
  /*#__PURE__*/ createUseWriteContract({
  abi: iStakingAdapterAbi,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"stake"`
 */
export const useWriteIStakingAdapterStake =
  /*#__PURE__*/ createUseWriteContract({
  abi: iStakingAdapterAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"unstake"`
 */
export const useWriteIStakingAdapterUnstake =
  /*#__PURE__*/ createUseWriteContract({
  abi: iStakingAdapterAbi,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iStakingAdapterAbi}__
 */
export const useSimulateIStakingAdapter =
  /*#__PURE__*/ createUseSimulateContract({ abi: iStakingAdapterAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"claimRewards"`
 */
export const useSimulateIStakingAdapterClaimRewards =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iStakingAdapterAbi,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"stake"`
 */
export const useSimulateIStakingAdapterStake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iStakingAdapterAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iStakingAdapterAbi}__ and `functionName` set to `"unstake"`
 */
export const useSimulateIStakingAdapterUnstake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: iStakingAdapterAbi,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__
 *
 *
 */
export const useReadMockStakingRewards = /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"deposits"`
 *
 *
 */
export const useReadMockStakingRewardsDeposits =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'deposits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"getContractBalance"`
 *
 *
 */
export const useReadMockStakingRewardsGetContractBalance =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'getContractBalance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"getPendingRewards"`
 *
 *
 */
export const useReadMockStakingRewardsGetPendingRewards =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'getPendingRewards',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"getStakedAmount"`
 *
 *
 */
export const useReadMockStakingRewardsGetStakedAmount =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'getStakedAmount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"habitTracker"`
 *
 *
 */
export const useReadMockStakingRewardsHabitTracker =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'habitTracker',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"lastUpdateTime"`
 *
 *
 */
export const useReadMockStakingRewardsLastUpdateTime =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'lastUpdateTime',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"ratePerSecond"`
 *
 *
 */
export const useReadMockStakingRewardsRatePerSecond =
  /*#__PURE__*/ createUseReadContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'ratePerSecond',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__
 *
 *
 */
export const useWriteMockStakingRewards = /*#__PURE__*/ createUseWriteContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"claimRewards"`
 *
 *
 */
export const useWriteMockStakingRewardsClaimRewards =
  /*#__PURE__*/ createUseWriteContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"stake"`
 *
 *
 */
export const useWriteMockStakingRewardsStake =
  /*#__PURE__*/ createUseWriteContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'stake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"unstake"`
 *
 *
 */
export const useWriteMockStakingRewardsUnstake =
  /*#__PURE__*/ createUseWriteContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__
 *
 *
 */
export const useSimulateMockStakingRewards =
  /*#__PURE__*/ createUseSimulateContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"claimRewards"`
 *
 *
 */
export const useSimulateMockStakingRewardsClaimRewards =
  /*#__PURE__*/ createUseSimulateContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"stake"`
 *
 *
 */
export const useSimulateMockStakingRewardsStake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'stake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `functionName` set to `"unstake"`
 *
 *
 */
export const useSimulateMockStakingRewardsUnstake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockStakingRewardsAbi}__
 *
 *
 */
export const useWatchMockStakingRewardsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `eventName` set to `"RewardsClaimed"`
 *
 *
 */
export const useWatchMockStakingRewardsRewardsClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  eventName: 'RewardsClaimed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `eventName` set to `"Staked"`
 *
 *
 */
export const useWatchMockStakingRewardsStakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  eventName: 'Staked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockStakingRewardsAbi}__ and `eventName` set to `"Unstaked"`
 *
 *
 */
export const useWatchMockStakingRewardsUnstakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: mockStakingRewardsAbi,
  address: mockStakingRewardsAddress,
  eventName: 'Unstaked',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__
 */
export const useReadMoonwellAdapter = /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"comptroller"`
 */
export const useReadMoonwellAdapterComptroller =
  /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
  functionName: 'comptroller',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"getPendingRewards"`
 */
export const useReadMoonwellAdapterGetPendingRewards =
  /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
  functionName: 'getPendingRewards',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"getStakedAmount"`
 */
export const useReadMoonwellAdapterGetStakedAmount =
  /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
  functionName: 'getStakedAmount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"habitTracker"`
 */
export const useReadMoonwellAdapterHabitTracker =
  /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
  functionName: 'habitTracker',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"mToken"`
 */
export const useReadMoonwellAdapterMToken = /*#__PURE__*/ createUseReadContract(
  { abi: moonwellAdapterAbi, functionName: 'mToken' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"userStakes"`
 */
export const useReadMoonwellAdapterUserStakes =
  /*#__PURE__*/ createUseReadContract({
  abi: moonwellAdapterAbi,
  functionName: 'userStakes',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link moonwellAdapterAbi}__
 */
export const useWriteMoonwellAdapter = /*#__PURE__*/ createUseWriteContract({
  abi: moonwellAdapterAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"claimRewards"`
 */
export const useWriteMoonwellAdapterClaimRewards =
  /*#__PURE__*/ createUseWriteContract({
  abi: moonwellAdapterAbi,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"stake"`
 */
export const useWriteMoonwellAdapterStake =
  /*#__PURE__*/ createUseWriteContract({
  abi: moonwellAdapterAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"unstake"`
 */
export const useWriteMoonwellAdapterUnstake =
  /*#__PURE__*/ createUseWriteContract({
  abi: moonwellAdapterAbi,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link moonwellAdapterAbi}__
 */
export const useSimulateMoonwellAdapter =
  /*#__PURE__*/ createUseSimulateContract({ abi: moonwellAdapterAbi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"claimRewards"`
 */
export const useSimulateMoonwellAdapterClaimRewards =
  /*#__PURE__*/ createUseSimulateContract({
  abi: moonwellAdapterAbi,
  functionName: 'claimRewards',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"stake"`
 */
export const useSimulateMoonwellAdapterStake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: moonwellAdapterAbi,
  functionName: 'stake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `functionName` set to `"unstake"`
 */
export const useSimulateMoonwellAdapterUnstake =
  /*#__PURE__*/ createUseSimulateContract({
  abi: moonwellAdapterAbi,
  functionName: 'unstake',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link moonwellAdapterAbi}__
 */
export const useWatchMoonwellAdapterEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: moonwellAdapterAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `eventName` set to `"RewardsClaimed"`
 */
export const useWatchMoonwellAdapterRewardsClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: moonwellAdapterAbi,
  eventName: 'RewardsClaimed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `eventName` set to `"Staked"`
 */
export const useWatchMoonwellAdapterStakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: moonwellAdapterAbi,
  eventName: 'Staked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link moonwellAdapterAbi}__ and `eventName` set to `"Unstaked"`
 */
export const useWatchMoonwellAdapterUnstakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
  abi: moonwellAdapterAbi,
  eventName: 'Unstaked',
})
