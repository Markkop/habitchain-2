import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HabitTracker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const habitTrackerAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_treasury', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AlreadyCheckedIn' },
  { type: 'error', inputs: [], name: 'AlreadySettled' },
  { type: 'error', inputs: [], name: 'CannotSettleCurrentDay' },
  { type: 'error', inputs: [], name: 'DayNotFunded' },
  { type: 'error', inputs: [], name: 'HabitAlreadyArchived' },
  { type: 'error', inputs: [], name: 'HabitNotFound' },
  { type: 'error', inputs: [], name: 'HabitTextTooLong' },
  { type: 'error', inputs: [], name: 'HabitTextTooShort' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidAmount' },
  { type: 'error', inputs: [], name: 'InvalidBatchSize' },
  { type: 'error', inputs: [], name: 'InvalidEpoch' },
  { type: 'error', inputs: [], name: 'InvalidTreasury' },
  { type: 'error', inputs: [], name: 'NotHabitOwner' },
  { type: 'error', inputs: [], name: 'TransferFailed' },
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
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Claimed',
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
      { name: 'text', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'HabitCreated',
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
    name: 'RedepositedFromClaimable',
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
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawn',
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
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'text', internalType: 'string', type: 'string' }],
    name: 'createHabit',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint64', type: 'uint64' },
      { name: '', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'dailyStatuses',
    outputs: [
      { name: 'funded', internalType: 'bool', type: 'bool' },
      { name: 'checked', internalType: 'bool', type: 'bool' },
      { name: 'settled', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
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
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'getActiveHabits',
    outputs: [
      {
        name: '',
        internalType: 'struct HabitTracker.Habit[]',
        type: 'tuple[]',
        components: [
          { name: 'id', internalType: 'uint32', type: 'uint32' },
          { name: 'owner', internalType: 'address', type: 'address' },
          { name: 'text', internalType: 'string', type: 'string' },
          { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
          { name: 'archived', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'getAllHabits',
    outputs: [
      {
        name: '',
        internalType: 'struct HabitTracker.Habit[]',
        type: 'tuple[]',
        components: [
          { name: 'id', internalType: 'uint32', type: 'uint32' },
          { name: 'owner', internalType: 'address', type: 'address' },
          { name: 'text', internalType: 'string', type: 'string' },
          { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
          { name: 'archived', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
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
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'getDailyStatus',
    outputs: [
      {
        name: '',
        internalType: 'struct HabitTracker.DailyStatus',
        type: 'tuple',
        components: [
          { name: 'funded', internalType: 'bool', type: 'bool' },
          { name: 'checked', internalType: 'bool', type: 'bool' },
          { name: 'settled', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'habitId', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'getHabit',
    outputs: [
      {
        name: '',
        internalType: 'struct HabitTracker.Habit',
        type: 'tuple',
        components: [
          { name: 'id', internalType: 'uint32', type: 'uint32' },
          { name: 'owner', internalType: 'address', type: 'address' },
          { name: 'text', internalType: 'string', type: 'string' },
          { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
          { name: 'archived', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'getTotalUserFunds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'user', internalType: 'address', type: 'address' }],
    name: 'getUserState',
    outputs: [
      {
        name: '',
        internalType: 'struct HabitTracker.UserState',
        type: 'tuple',
        components: [
          { name: 'depositBalance', internalType: 'uint256', type: 'uint256' },
          { name: 'blockedBalance', internalType: 'uint256', type: 'uint256' },
          {
            name: 'claimableBalance',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'activeHabitCount', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
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
      { name: 'id', internalType: 'uint32', type: 'uint32' },
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'text', internalType: 'string', type: 'string' },
      { name: 'createdAtEpoch', internalType: 'uint64', type: 'uint64' },
      { name: 'archived', internalType: 'bool', type: 'bool' },
    ],
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
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'redepositFromClaimable',
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
      { name: 'user', internalType: 'address', type: 'address' },
      { name: 'epoch', internalType: 'uint64', type: 'uint64' },
      { name: 'maxCount', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'settleAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalTreasuryReceived',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
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
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 *
 */
export const habitTrackerAddress = {
  420420422: '0x0000000000000000000000000000000000000000',
} as const

/**
 *
 */
export const habitTrackerConfig = {
  address: habitTrackerAddress,
  abi: habitTrackerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"dailyStatuses"`
 *
 *
 */
export const useReadHabitTrackerDailyStatuses =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'dailyStatuses',
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getActiveHabits"`
 *
 *
 */
export const useReadHabitTrackerGetActiveHabits =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getActiveHabits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getAllHabits"`
 *
 *
 */
export const useReadHabitTrackerGetAllHabits =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getAllHabits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getContractBalance"`
 *
 *
 */
export const useReadHabitTrackerGetContractBalance =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getContractBalance',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getDailyStatus"`
 *
 *
 */
export const useReadHabitTrackerGetDailyStatus =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getDailyStatus',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getHabit"`
 *
 *
 */
export const useReadHabitTrackerGetHabit = /*#__PURE__*/ createUseReadContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'getHabit',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getTotalUserFunds"`
 *
 *
 */
export const useReadHabitTrackerGetTotalUserFunds =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getTotalUserFunds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"getUserState"`
 *
 *
 */
export const useReadHabitTrackerGetUserState =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'getUserState',
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"totalTreasuryReceived"`
 *
 *
 */
export const useReadHabitTrackerTotalTreasuryReceived =
  /*#__PURE__*/ createUseReadContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'totalTreasuryReceived',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claim"`
 *
 *
 */
export const useWriteHabitTrackerClaim = /*#__PURE__*/ createUseWriteContract({
  abi: habitTrackerAbi,
  address: habitTrackerAddress,
  functionName: 'claim',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"redepositFromClaimable"`
 *
 *
 */
export const useWriteHabitTrackerRedepositFromClaimable =
  /*#__PURE__*/ createUseWriteContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'redepositFromClaimable',
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
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"settleAll"`
 *
 *
 */
export const useWriteHabitTrackerSettleAll =
  /*#__PURE__*/ createUseWriteContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'settleAll',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"withdraw"`
 *
 *
 */
export const useWriteHabitTrackerWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'withdraw',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"claim"`
 *
 *
 */
export const useSimulateHabitTrackerClaim =
  /*#__PURE__*/ createUseSimulateContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'claim',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"redepositFromClaimable"`
 *
 *
 */
export const useSimulateHabitTrackerRedepositFromClaimable =
  /*#__PURE__*/ createUseSimulateContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'redepositFromClaimable',
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
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"settleAll"`
 *
 *
 */
export const useSimulateHabitTrackerSettleAll =
  /*#__PURE__*/ createUseSimulateContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'settleAll',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link habitTrackerAbi}__ and `functionName` set to `"withdraw"`
 *
 *
 */
export const useSimulateHabitTrackerWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    functionName: 'withdraw',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"Claimed"`
 *
 *
 */
export const useWatchHabitTrackerClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    eventName: 'Claimed',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"RedepositedFromClaimable"`
 *
 *
 */
export const useWatchHabitTrackerRedepositedFromClaimableEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    eventName: 'RedepositedFromClaimable',
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
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link habitTrackerAbi}__ and `eventName` set to `"Withdrawn"`
 *
 *
 */
export const useWatchHabitTrackerWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: habitTrackerAbi,
    address: habitTrackerAddress,
    eventName: 'Withdrawn',
  })
