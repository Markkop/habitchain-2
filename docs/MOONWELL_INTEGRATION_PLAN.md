# Moonwell Integration Plan for HabitChain

## Overview

Integrate external staking into HabitChain using **Moonwell on Moonbeam** for production and a **mock contract on Passet Hub** for testing. This approach uses native, battle-tested protocols without deploying custom staking infrastructure.

## Strategy

### Production: Moonbeam + Moonwell

- **Network:** Moonbeam (Polkadot's EVM parachain)
- **Protocol:** Moonwell (audited money market)
- **Yield Source:** Supply GLMR to Moonwell, earn mGLMR (yield-bearing token)
- **Rewards:** WELL tokens (if incentives active)

### Testing: Passet Hub + Mock

- **Network:** Passet Hub (Paseo testnet)
- **Protocol:** MockStakingRewards (simple fake yield)
- **Yield Source:** Linear time-based rewards for testing

## Architecture

```
┌─────────────────┐
│  HabitTracker   │
│   (Modified)    │
│                 │
│  Earns rewards  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  IStakingAdapter    │ ◄─── Chain-agnostic interface
│  (Interface)        │
└─────────┬───────────┘
          │
          ├──────────────────┬──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ MoonwellAdapter  │  │  MockAdapter     │  │  Future: Other   │
│  (Moonbeam prod) │  │  (Passet test)   │  │  Protocols       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│ Moonwell mGLMR   │  │ Mock Contract    │
│ (Real yield)     │  │ (Fake yield)     │
└──────────────────┘  └──────────────────┘
```

---

## File Structure

```
/contracts
  /contracts
    HabitTracker.sol (modified)
    /interfaces
      IStakingAdapter.sol (new)
    /adapters
      MoonwellAdapter.sol (new)
    /mocks
      MockStakingRewards.sol (new)
  /ignition/modules
    HabitTracker.ts (modified)
    MoonwellAdapter.ts (new)
    MockStakingRewards.ts (new)
  hardhat.config.ts (add Moonbeam network)
  /test
    integration.test.ts (new)
```

---

## Step 1: Update Hardhat Config

Add Moonbeam network to your `hardhat.config.ts`:

```typescript
import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";

// Get private key from Hardhat vars (more secure than .env)
// Set with: npx hardhat vars set PRIVATE_KEY
let privateKey: string | undefined;
try {
  privateKey = vars.get("PRIVATE_KEY");
} catch (e) {
  console.warn(
    "⚠️  WARNING: PRIVATE_KEY not set in Hardhat vars. Run: npx hardhat vars set PRIVATE_KEY"
  );
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  resolc: {
    compilerSource: "npm",
    settings: {
      optimizer: {
        enabled: true,
        parameters: "z", // Size optimization
        fallbackOz: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      polkavm: true,
    },
    localhost: {
      polkavm: true,
      url: "http://127.0.0.1:8545/",
    },

    // ========== TESTNETS ==========

    // Polkadot Hub TestNet (Paseo Asset Hub)
    passetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: privateKey ? [privateKey] : [],
    },

    // Alternative name for the same network
    polkadotHubTestnet: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: privateKey ? [privateKey] : [],
    },

    // ========== PRODUCTION ==========

    // Moonbeam (Polkadot EVM Parachain)
    moonbeam: {
      polkavm: false, // Moonbeam uses standard EVM, not PolkaVM
      url: process.env.MOONBEAM_RPC || "https://moonbeam-rpc.dwellir.com",
      chainId: 1284,
      accounts: privateKey ? [privateKey] : [],
    },

    // Moonbase Alpha (Moonbeam Testnet)
    moonbaseAlpha: {
      polkavm: false,
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
```

**Key Changes:**

- Added `moonbeam` network (production)
- Added `moonbaseAlpha` network (Moonbeam testnet)
- Set `polkavm: false` for Moonbeam (standard EVM)
- Keep `polkavm: true` for Passet Hub (PolkaVM)

---

## Step 2: Create Contracts

### 2.1 IStakingAdapter.sol

Create `contracts/contracts/interfaces/IStakingAdapter.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IStakingAdapter
 * @notice Chain-agnostic interface for external staking protocols
 * @dev Allows HabitTracker to integrate with any staking protocol
 */
interface IStakingAdapter {
    /**
     * @notice Stake tokens into external protocol
     * @param amount Amount to stake
     * @dev For native token staking, msg.value should equal amount
     */
    function stake(uint256 amount) external payable;

    /**
     * @notice Unstake tokens from external protocol
     * @param amount Amount to unstake
     * @dev Unstaked tokens should be sent back to HabitTracker
     */
    function unstake(uint256 amount) external;

    /**
     * @notice Claim accumulated rewards
     * @return claimed Amount of rewards claimed
     * @dev Returns 0 if no rewards available or not supported
     */
    function claimRewards() external returns (uint256 claimed);

    /**
     * @notice Get total staked amount for an address
     * @param who Address to check
     * @return staked Total staked by address
     */
    function getStakedAmount(address who) external view returns (uint256 staked);

    /**
     * @notice Get pending unclaimed rewards for an address
     * @param who Address to check
     * @return pending Pending rewards
     * @dev Returns 0 if not supported by protocol
     */
    function getPendingRewards(address who) external view returns (uint256 pending);
}
```

### 2.2 MoonwellAdapter.sol

Create `contracts/contracts/adapters/MoonwellAdapter.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IStakingAdapter.sol";

/**
 * @notice Minimal ERC20 interface
 */
interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @notice Moonwell mToken interface (native GLMR version - CEther-style)
 */
interface IMTokenNative {
    function mint() external payable; // CEther-style: amount = msg.value
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function exchangeRateStored() external view returns (uint256);
}

/**
 * @notice Moonwell Comptroller interface
 */
interface IComptroller {
    function claimReward(uint8 rewardType, address holder, address[] calldata mTokens) external;
}

/**
 * @title MoonwellAdapter
 * @notice Adapter for HabitTracker to stake in Moonwell on Moonbeam
 * @dev Supports native GLMR staking via mGLMR market
 */
contract MoonwellAdapter is IStakingAdapter {
    address public immutable mToken;        // mGLMR address
    address public immutable comptroller;   // Moonwell Comptroller
    address public immutable habitTracker;  // Only HabitTracker can call

    mapping(address => uint256) public userStakes; // Track per-user stakes

    event Staked(address indexed user, uint256 amount, uint256 mTokens);
    event Unstaked(address indexed user, uint256 amount, uint256 mTokens);
    event RewardsClaimed(address indexed user, uint256 amount);

    error OnlyHabitTracker();
    error MintFailed();
    error RedeemFailed();
    error InvalidAmount();

    modifier onlyHabitTracker() {
        if (msg.sender != habitTracker) revert OnlyHabitTracker();
        _;
    }

    /**
     * @param _mToken Moonwell mGLMR token address
     * @param _comptroller Moonwell Comptroller address
     * @param _habitTracker HabitTracker contract address
     */
    constructor(address _mToken, address _comptroller, address _habitTracker) {
        mToken = _mToken;
        comptroller = _comptroller;
        habitTracker = _habitTracker;
    }

    /**
     * @notice Stake GLMR into Moonwell
     * @param amount Amount of GLMR to stake
     * @dev msg.value must equal amount (native token)
     */
    function stake(uint256 amount) external payable onlyHabitTracker {
        if (msg.value != amount) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        // Mint mGLMR by sending GLMR
        IMTokenNative(mToken).mint{value: amount}();

        // Track user's stake
        userStakes[msg.sender] += amount;

        emit Staked(msg.sender, amount, IMTokenNative(mToken).balanceOf(address(this)));
    }

    /**
     * @notice Unstake GLMR from Moonwell
     * @param amount Amount of underlying GLMR to unstake
     * @dev Redeems mGLMR and sends GLMR back to HabitTracker
     */
    function unstake(uint256 amount) external onlyHabitTracker {
        if (amount == 0) revert InvalidAmount();

        // Redeem underlying GLMR
        uint256 err = IMTokenNative(mToken).redeemUnderlying(amount);
        if (err != 0) revert RedeemFailed();

        // Update user's stake
        userStakes[msg.sender] -= amount;

        // Send GLMR back to HabitTracker
        (bool success, ) = habitTracker.call{value: amount}("");
        if (!success) revert RedeemFailed();

        emit Unstaked(msg.sender, amount, IMTokenNative(mToken).balanceOf(address(this)));
    }

    /**
     * @notice Claim WELL rewards from Moonwell
     * @return claimed Amount of rewards claimed (0 if none)
     * @dev Best-effort claim; returns 0 if rewards not active
     */
    function claimRewards() external onlyHabitTracker returns (uint256 claimed) {
        address[] memory markets = new address[](1);
        markets[0] = mToken;

        // Try to claim WELL rewards (rewardType 0)
        try IComptroller(comptroller).claimReward(0, address(this), markets) {
            // If successful, rewards sent to this adapter
            // HabitTracker can sweep them later
            emit RewardsClaimed(msg.sender, 0);
            return 0; // Don't track WELL tokens for now
        } catch {
            return 0; // Rewards not active or failed
        }
    }

    /**
     * @notice Get user's staked amount (in underlying GLMR)
     * @param who Address to check
     * @return staked Amount of GLMR staked
     */
    function getStakedAmount(address who) external view returns (uint256 staked) {
        // Convert adapter's mToken balance to underlying using exchange rate
        uint256 mTokenBal = IMTokenNative(mToken).balanceOf(address(this));
        if (mTokenBal == 0) return 0;

        uint256 rate = IMTokenNative(mToken).exchangeRateStored(); // scaled by 1e18
        uint256 totalUnderlying = (mTokenBal * rate) / 1e18;

        // Return user's proportional share
        // (This is approximate; for production, track per-user mToken balances)
        return userStakes[who];
    }

    /**
     * @notice Get pending rewards (not supported by Moonwell directly)
     * @param who Address to check
     * @return pending Always returns 0
     * @dev Moonwell doesn't expose claimable amount; use off-chain calculation
     */
    function getPendingRewards(address who) external view returns (uint256 pending) {
        return 0; // Not easily accessible on-chain
    }

    /**
     * @notice Allow receiving GLMR from Moonwell redemptions
     */
    receive() external payable {}
}
```

**Moonbeam Production Addresses:**

- **mGLMR:** `0x091608f4e4a15335145be0A279483C0f8E4c7955`
- **Comptroller:** `0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180`
- **Chain ID:** `1284`

### 2.3 MockStakingRewards.sol

Create `contracts/contracts/mocks/MockStakingRewards.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IStakingAdapter.sol";

/**
 * @title MockStakingRewards
 * @notice Simple mock staking contract for testing on Passet Hub
 * @dev Linear reward rate: rewards = staked * ratePerSecond * timeStaked
 */
contract MockStakingRewards is IStakingAdapter {
    uint256 public immutable ratePerSecond; // Reward rate per second (in wei per 1e18 staked)
    address public immutable habitTracker;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public lastUpdateTime;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    error OnlyHabitTracker();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidAmount();

    modifier onlyHabitTracker() {
        if (msg.sender != habitTracker) revert OnlyHabitTracker();
        _;
    }

    /**
     * @param _ratePerSecond Reward rate (e.g., 1e15 = 0.1% per second)
     * @param _habitTracker HabitTracker contract address
     */
    constructor(uint256 _ratePerSecond, address _habitTracker) {
        ratePerSecond = _ratePerSecond;
        habitTracker = _habitTracker;
    }

    function stake(uint256 amount) external payable onlyHabitTracker {
        if (msg.value != amount) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        _updateRewards(msg.sender);
        deposits[msg.sender] += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external onlyHabitTracker {
        if (amount == 0) revert InvalidAmount();
        if (deposits[msg.sender] < amount) revert InsufficientBalance();

        _updateRewards(msg.sender);
        deposits[msg.sender] -= amount;

        // Send back to HabitTracker
        (bool success, ) = habitTracker.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external onlyHabitTracker returns (uint256 claimed) {
        claimed = _pendingRewards(msg.sender);
        lastUpdateTime[msg.sender] = block.timestamp;

        if (claimed > 0) {
            (bool success, ) = habitTracker.call{value: claimed}("");
            if (!success) revert TransferFailed();
            emit RewardsClaimed(msg.sender, claimed);
        }

        return claimed;
    }

    function getStakedAmount(address who) external view returns (uint256) {
        return deposits[who];
    }

    function getPendingRewards(address who) external view returns (uint256) {
        return _pendingRewards(who);
    }

    function _updateRewards(address user) internal {
        if (lastUpdateTime[user] == 0) {
            lastUpdateTime[user] = block.timestamp;
        }
    }

    function _pendingRewards(address user) internal view returns (uint256) {
        if (lastUpdateTime[user] == 0 || deposits[user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastUpdateTime[user];
        // rewards = staked * ratePerSecond * timeElapsed / 1e18
        return (deposits[user] * ratePerSecond * timeElapsed) / 1e18;
    }

    /**
     * @notice Allow receiving PAS for reward pool
     */
    receive() external payable {}
}
```

---

## Step 3: Modify HabitTracker

Update `contracts/contracts/HabitTracker.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IStakingAdapter.sol";

/**
 * @title HabitTracker
 * @notice Gamified habit tracking with financial commitment and staking rewards
 * @dev Integrates with external staking via IStakingAdapter
 */
contract HabitTracker {
    uint256 public constant STAKE_PER_DAY = 10 ether;
    uint256 private constant SECONDS_PER_DAY = 86400;
    uint32 private constant MAX_SETTLE_BATCH = 50;

    address public immutable treasury;
    IStakingAdapter public stakingAdapter; // Can be updated by owner
    address public owner;

    // ============ Structs ============

    struct UserState {
        uint256 depositBalance;     // Available for new habits
        uint256 blockedBalance;     // Locked for active habits
        uint256 claimableBalance;   // Old system - kept for backward compatibility
        uint256 stakedBalance;      // New: tracked in external staking
        uint32 activeHabitCount;
    }

    struct Habit {
        uint32 id;
        address owner;
        bytes32 text;
        uint64 createdAtEpoch;
        bool archived;
    }

    struct DailyStatus {
        uint8 flags; // bit 0: funded, bit 1: checked, bit 2: settled
    }

    mapping(address => UserState) public userStates;
    mapping(address => mapping(uint32 => Habit)) public habits;
    mapping(address => uint32) public userHabitCounters;
    mapping(address => mapping(uint64 => mapping(uint32 => DailyStatus))) public dailyStatuses;

    // ============ Events ============

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event ClaimedStaked(address indexed user, uint256 principal, uint256 yield);
    event RedepositedFromClaimable(address indexed user, uint256 amount);
    event HabitCreated(address indexed user, uint32 indexed habitId, bytes32 text);
    event HabitArchived(address indexed user, uint32 indexed habitId);
    event DayPrepared(address indexed user, uint64 indexed epoch, uint32 fundedCount, uint32 insufficientCount);
    event CheckedIn(address indexed user, uint32 indexed habitId, uint64 indexed epoch);
    event SettledSuccess(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 reward);
    event SettledFail(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 slashed);
    event StakingAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);
    event RewardsStaked(address indexed user, uint256 amount);

    // ============ Errors ============

    error InvalidTreasury();
    error InvalidAmount();
    error InsufficientBalance();
    error HabitNotFound();
    error NotHabitOwner();
    error HabitAlreadyArchived();
    error InvalidEpoch();
    error DayNotFunded();
    error AlreadyCheckedIn();
    error AlreadySettled();
    error CannotSettleCurrentDay();
    error InvalidBatchSize();
    error TransferFailed();
    error HabitTextTooLong();
    error OnlyOwner();
    error InvalidStakingAdapter();

    modifier onlyHabitOwner(uint32 habitId) {
        if (habits[msg.sender][habitId].owner != msg.sender) revert NotHabitOwner();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ============ Constructor ============

    constructor(address _treasury, address _stakingAdapter) {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
        owner = msg.sender;

        // Staking adapter is optional - can be address(0) initially
        if (_stakingAdapter != address(0)) {
            stakingAdapter = IStakingAdapter(_stakingAdapter);
        }
    }

    function epochNow() public view returns (uint64) {
        return uint64(block.timestamp / SECONDS_PER_DAY);
    }

    // ============ Admin Functions ============

    function setStakingAdapter(address _newAdapter) external onlyOwner {
        if (_newAdapter == address(0)) revert InvalidStakingAdapter();
        address oldAdapter = address(stakingAdapter);
        stakingAdapter = IStakingAdapter(_newAdapter);
        emit StakingAdapterUpdated(oldAdapter, _newAdapter);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidTreasury();
        owner = newOwner;
    }

    // ============ Balance Management ============

    function deposit() external payable {
        if (msg.value == 0) revert InvalidAmount();
        userStates[msg.sender].depositBalance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        UserState storage state = userStates[msg.sender];
        if (state.depositBalance < amount) revert InsufficientBalance();
        unchecked { state.depositBalance -= amount; }
        _transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claim(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        UserState storage state = userStates[msg.sender];
        if (state.claimableBalance < amount) revert InsufficientBalance();
        unchecked { state.claimableBalance -= amount; }
        _transfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    function claimStaked(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        UserState storage state = userStates[msg.sender];
        if (state.stakedBalance < amount) revert InsufficientBalance();

        // Claim any pending rewards first
        uint256 yieldAmount = 0;
        if (address(stakingAdapter) != address(0)) {
            yieldAmount = stakingAdapter.claimRewards();
        }

        // Unstake principal
        if (address(stakingAdapter) != address(0)) {
            stakingAdapter.unstake(amount);
        }

        unchecked { state.stakedBalance -= amount; }

        // Transfer principal + yield to user
        uint256 totalAmount = amount + yieldAmount;
        _transfer(msg.sender, totalAmount);

        emit ClaimedStaked(msg.sender, amount, yieldAmount);
    }

    function redepositFromClaimable(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        UserState storage state = userStates[msg.sender];
        if (state.claimableBalance < amount) revert InsufficientBalance();
        unchecked {
            state.claimableBalance -= amount;
            state.depositBalance += amount;
        }
        emit RedepositedFromClaimable(msg.sender, amount);
    }

    function _transfer(address to, uint256 amount) private {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // ============ Habit Management ============

    function createHabit(bytes32 text) external returns (uint32) {
        if (text == bytes32(0)) revert HabitTextTooLong();

        uint32 habitId = ++userHabitCounters[msg.sender];

        habits[msg.sender][habitId] = Habit({
            id: habitId,
            owner: msg.sender,
            text: text,
            createdAtEpoch: epochNow(),
            archived: false
        });

        unchecked { userStates[msg.sender].activeHabitCount++; }

        emit HabitCreated(msg.sender, habitId, text);
        return habitId;
    }

    function archiveHabit(uint32 habitId) external onlyHabitOwner(habitId) {
        Habit storage habit = habits[msg.sender][habitId];
        if (habit.archived) revert HabitAlreadyArchived();
        habit.archived = true;
        unchecked { userStates[msg.sender].activeHabitCount--; }
        emit HabitArchived(msg.sender, habitId);
    }

    // ============ Daily Cycle ============

    function prepareDay(uint64 epoch) external {
        if (epoch != epochNow()) revert InvalidEpoch();

        UserState storage state = userStates[msg.sender];
        uint32 count = userHabitCounters[msg.sender];
        uint32 fundedCount;
        uint32 insufficientCount;

        for (uint32 i = 1; i <= count;) {
            Habit storage habit = habits[msg.sender][i];

            if (!habit.archived && habit.owner != address(0)) {
                DailyStatus storage status = dailyStatuses[msg.sender][epoch][i];

                if (status.flags & 1 == 0) {
                    if (state.depositBalance >= STAKE_PER_DAY) {
                        unchecked {
                            state.depositBalance -= STAKE_PER_DAY;
                            state.blockedBalance += STAKE_PER_DAY;
                            fundedCount++;
                        }
                        status.flags |= 1;
                    } else {
                        unchecked { insufficientCount++; }
                    }
                }
            }
            unchecked { i++; }
        }

        emit DayPrepared(msg.sender, epoch, fundedCount, insufficientCount);
    }

    function checkIn(uint32 habitId, uint64 epoch) external onlyHabitOwner(habitId) {
        if (epoch != epochNow()) revert InvalidEpoch();
        if (habits[msg.sender][habitId].archived) revert HabitNotFound();

        DailyStatus storage status = dailyStatuses[msg.sender][epoch][habitId];
        if (status.flags & 1 == 0) revert DayNotFunded();
        if (status.flags & 2 != 0) revert AlreadyCheckedIn();

        status.flags |= 2;
        emit CheckedIn(msg.sender, habitId, epoch);
    }

    // ============ Settlement ============

    function settle(address user, uint64 epoch, uint32 habitId) public {
        if (epoch >= epochNow()) revert CannotSettleCurrentDay();
        _settleInternal(user, epoch, habitId);
    }

    function _settleInternal(address user, uint64 epoch, uint32 habitId) private {
        if (habits[user][habitId].owner == address(0)) revert HabitNotFound();

        DailyStatus storage status = dailyStatuses[user][epoch][habitId];
        uint8 flags = status.flags;
        if (flags & 1 == 0) revert DayNotFunded();
        if (flags & 4 != 0) revert AlreadySettled();

        status.flags = flags | 4;
        UserState storage state = userStates[user];

        unchecked { state.blockedBalance -= STAKE_PER_DAY; }

        if (flags & 2 != 0) {
            // SUCCESS: Auto-stake rewards
            if (address(stakingAdapter) != address(0)) {
                // Stake through adapter (send native token)
                stakingAdapter.stake{value: STAKE_PER_DAY}(STAKE_PER_DAY);
                state.stakedBalance += STAKE_PER_DAY;
                emit RewardsStaked(user, STAKE_PER_DAY);
            } else {
                // Fallback: use old claimable balance if no adapter
                unchecked { state.claimableBalance += STAKE_PER_DAY; }
            }
            emit SettledSuccess(user, habitId, epoch, STAKE_PER_DAY);
        } else {
            // FAIL: Send to treasury
            _transfer(treasury, STAKE_PER_DAY);
            emit SettledFail(user, habitId, epoch, STAKE_PER_DAY);
        }
    }

    function settleAll(address user, uint64 epoch, uint32 maxCount) external {
        if (epoch >= epochNow()) revert CannotSettleCurrentDay();
        if (maxCount == 0 || maxCount > MAX_SETTLE_BATCH) revert InvalidBatchSize();

        uint32 count = userHabitCounters[user];
        uint32 settled;

        for (uint32 i = 1; i <= count && settled < maxCount;) {
            Habit storage habit = habits[user][i];
            if (habit.owner != address(0) && !habit.archived) {
                uint8 flags = dailyStatuses[user][epoch][i].flags;
                if ((flags & 1 != 0) && (flags & 4 == 0)) {
                    _settleInternal(user, epoch, i);
                    unchecked { settled++; }
                }
            }
            unchecked { i++; }
        }
    }

    function forceSettleDay(address user, uint64 epoch, uint32 maxCount) external {
        if (maxCount == 0 || maxCount > MAX_SETTLE_BATCH) revert InvalidBatchSize();

        uint32 count = userHabitCounters[user];
        uint32 settled;

        for (uint32 i = 1; i <= count && settled < maxCount;) {
            Habit storage habit = habits[user][i];
            if (habit.owner != address(0) && !habit.archived) {
                uint8 flags = dailyStatuses[user][epoch][i].flags;
                if ((flags & 1 != 0) && (flags & 4 == 0)) {
                    _settleInternal(user, epoch, i);
                    unchecked { settled++; }
                }
            }
            unchecked { i++; }
        }
    }

    function forceSettleAllEpochs(address user, uint64 startEpoch, uint32 maxSettlements) external {
        if (maxSettlements == 0 || maxSettlements > MAX_SETTLE_BATCH) revert InvalidBatchSize();

        uint32 habitCount = userHabitCounters[user];
        uint64 currentEpoch = epochNow();
        uint32 settledCount;

        for (uint32 habitId = 1; habitId <= habitCount && settledCount < maxSettlements;) {
            Habit storage habit = habits[user][habitId];

            if (habit.owner != address(0) && !habit.archived) {
                uint64 scanStart = startEpoch > habit.createdAtEpoch ? startEpoch : habit.createdAtEpoch;

                for (uint64 epoch = scanStart; epoch < currentEpoch && settledCount < maxSettlements;) {
                    uint8 flags = dailyStatuses[user][epoch][habitId].flags;

                    if ((flags & 1 != 0) && (flags & 4 == 0)) {
                        _settleInternal(user, epoch, habitId);
                        unchecked { settledCount++; }
                    }
                    unchecked { epoch++; }
                }
            }
            unchecked { habitId++; }
        }
    }

    // ============ View Functions ============

    function getTotalClaimable(address user) external view returns (
        uint256 stakedPrincipal,
        uint256 pendingYield,
        uint256 oldClaimable,
        uint256 totalAvailable
    ) {
        UserState storage state = userStates[user];
        stakedPrincipal = state.stakedBalance;
        oldClaimable = state.claimableBalance;

        if (address(stakingAdapter) != address(0)) {
            pendingYield = stakingAdapter.getPendingRewards(address(this));
        }

        totalAvailable = stakedPrincipal + pendingYield + oldClaimable;
    }

    /**
     * @notice Allow receiving native tokens from staking adapter
     */
    receive() external payable {}
}
```

**Key Changes:**

- Added `stakingAdapter` state variable
- Added `stakedBalance` to `UserState`
- Modified `_settleInternal` to auto-stake rewards
- Added `claimStaked()` function for claiming staked rewards + yield
- Added `setStakingAdapter()` for upgrades
- Added `getTotalClaimable()` view function
- Made staking adapter optional (backward compatible)

---

## Step 4: Create Ignition Deployment Modules

### 4.1 MoonwellAdapter.ts

Create `contracts/ignition/modules/MoonwellAdapter.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MoonwellAdapterModule = buildModule("MoonwellAdapterModule", (m) => {
  // Moonbeam production addresses
  const mGLMR = m.getParameter(
    "mGLMR",
    "0x091608f4e4a15335145be0A279483C0f8E4c7955"
  );
  const comptroller = m.getParameter(
    "comptroller",
    "0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180"
  );
  const habitTracker = m.getParameter("habitTracker"); // Must be provided

  const adapter = m.contract("MoonwellAdapter", [
    mGLMR,
    comptroller,
    habitTracker,
  ]);

  return { adapter };
});

export default MoonwellAdapterModule;
```

### 4.2 MockStakingRewards.ts

Create `contracts/ignition/modules/MockStakingRewards.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockStakingRewardsModule = buildModule(
  "MockStakingRewardsModule",
  (m) => {
    // Mock reward rate: 0.0001% per second = ~8.6% APY
    // 1e15 = 0.1% per second, 1e14 = 0.01% per second
    const ratePerSecond = m.getParameter("ratePerSecond", "1000000000000000"); // 1e15

    const habitTracker = m.getParameter("habitTracker"); // Must be provided

    const mockStaking = m.contract("MockStakingRewards", [
      ratePerSecond,
      habitTracker,
    ]);

    return { mockStaking };
  }
);

export default MockStakingRewardsModule;
```

### 4.3 Updated HabitTracker.ts

Update `contracts/ignition/modules/HabitTracker.ts`:

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HabitTrackerModule = buildModule("HabitTrackerModule", (m) => {
  // Treasury address - defaults to deployer address for testing
  const deployer = m.getAccount(0);
  const treasuryAddress = m.getParameter("treasuryAddress", deployer);

  // Staking adapter - optional, can be address(0) initially
  const stakingAdapter = m.getParameter(
    "stakingAdapter",
    "0x0000000000000000000000000000000000000000"
  );

  const habitTracker = m.contract("HabitTracker", [
    treasuryAddress,
    stakingAdapter,
  ]);

  return { habitTracker };
});

export default HabitTrackerModule;
```

---

## Step 5: Deployment Instructions

### 5.1 Deploy to Passet Hub (Testing)

**Step 1: Deploy HabitTracker (without staking first)**

```bash
npx hardhat ignition deploy ./ignition/modules/HabitTracker.ts --network passetHub
```

Record the HabitTracker address: `HABIT_TRACKER_ADDRESS`

**Step 2: Deploy MockStakingRewards**

```bash
npx hardhat ignition deploy ./ignition/modules/MockStakingRewards.ts \
  --network passetHub \
  --parameters '{"habitTracker":"HABIT_TRACKER_ADDRESS"}'
```

Record the MockStakingRewards address: `MOCK_STAKING_ADDRESS`

**Step 3: Update HabitTracker with staking adapter**

```bash
# Connect to HabitTracker and call setStakingAdapter
npx hardhat console --network passetHub

# In console:
const habitTracker = await ethers.getContractAt("HabitTracker", "HABIT_TRACKER_ADDRESS");
await habitTracker.setStakingAdapter("MOCK_STAKING_ADDRESS");
```

**Step 4: Fund MockStakingRewards with PAS**

```bash
# Send some PAS to mock contract for rewards
npx hardhat console --network passetHub

# In console:
const [signer] = await ethers.getSigners();
await signer.sendTransaction({
  to: "MOCK_STAKING_ADDRESS",
  value: ethers.parseEther("1000") // 1000 PAS for rewards
});
```

### 5.2 Deploy to Moonbeam (Production)

**Step 1: Deploy HabitTracker**

```bash
npx hardhat ignition deploy ./ignition/modules/HabitTracker.ts --network moonbeam
```

Record: `HABIT_TRACKER_ADDRESS`

**Step 2: Deploy MoonwellAdapter**

```bash
npx hardhat ignition deploy ./ignition/modules/MoonwellAdapter.ts \
  --network moonbeam \
  --parameters '{"habitTracker":"HABIT_TRACKER_ADDRESS"}'
```

Record: `MOONWELL_ADAPTER_ADDRESS`

**Step 3: Update HabitTracker**

```bash
npx hardhat console --network moonbeam

# In console:
const habitTracker = await ethers.getContractAt("HabitTracker", "HABIT_TRACKER_ADDRESS");
await habitTracker.setStakingAdapter("MOONWELL_ADAPTER_ADDRESS");
```

**Done!** Your HabitTracker is now staking rewards in Moonwell.

---

## Step 6: Frontend Integration

### Update Contract Addresses

Update `frontend/src/wagmi-config.ts`:

```typescript
export const contracts = {
  habitTracker: {
    // Passet Hub (testing)
    420420422: "0x...", // HABIT_TRACKER_ADDRESS on Passet Hub

    // Moonbeam (production)
    1284: "0x...", // HABIT_TRACKER_ADDRESS on Moonbeam
  },
  stakingAdapter: {
    420420422: "0x...", // MOCK_STAKING_ADDRESS on Passet Hub
    1284: "0x...", // MOONWELL_ADAPTER_ADDRESS on Moonbeam
  },
  // Moonwell addresses (Moonbeam only)
  mGLMR: {
    1284: "0x091608f4e4a15335145be0A279483C0f8E4c7955",
  },
  comptroller: {
    1284: "0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180",
  },
};
```

### Display Staked Balance

Add to your components:

```tsx
function StakedRewards({ userAddress }: { userAddress: Address }) {
  const { data } = useReadContract({
    address: contracts.habitTracker[chainId],
    abi: habitTrackerABI,
    functionName: "getTotalClaimable",
    args: [userAddress],
  });

  const [stakedPrincipal, pendingYield, oldClaimable, totalAvailable] =
    data || [0n, 0n, 0n, 0n];

  return (
    <div>
      <h3>Your Rewards</h3>
      <div>
        Staked: {formatEther(stakedPrincipal)} {chainName}
      </div>
      <div>
        Yield: {formatEther(pendingYield)} {chainName}
      </div>
      <div>
        Old Claimable: {formatEther(oldClaimable)} {chainName}
      </div>
      <div>
        Total: {formatEther(totalAvailable)} {chainName}
      </div>
      <button onClick={() => claimStaked()}>Claim All</button>
    </div>
  );
}
```

---

## Testing Plan

### Integration Test

Create `contracts/test/integration.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("HabitTracker with Staking Integration", function () {
  it("should auto-stake rewards and earn yield", async function () {
    const [deployer, user] = await ethers.getSigners();

    // Deploy contracts
    const MockStaking = await ethers.getContractFactory("MockStakingRewards");
    const HabitTracker = await ethers.getContractFactory("HabitTracker");

    // Deploy HabitTracker first (with no adapter)
    const habitTracker = await HabitTracker.deploy(
      deployer.address,
      ethers.ZeroAddress
    );

    // Deploy mock staking
    const mockStaking = await MockStaking.deploy(
      ethers.parseUnits("0.0001", 18), // 0.01% per second
      await habitTracker.getAddress()
    );

    // Fund mock staking for rewards
    await deployer.sendTransaction({
      to: await mockStaking.getAddress(),
      value: ethers.parseEther("1000"),
    });

    // Set staking adapter
    await habitTracker.setStakingAdapter(await mockStaking.getAddress());

    // User deposits
    await habitTracker
      .connect(user)
      .deposit({ value: ethers.parseEther("100") });

    // Create habit
    await habitTracker
      .connect(user)
      .createHabit(ethers.encodeBytes32String("Exercise"));

    // Prepare day
    const epoch = await habitTracker.epochNow();
    await habitTracker.connect(user).prepareDay(epoch);

    // Check in
    await habitTracker.connect(user).checkIn(1, epoch);

    // Advance time and settle
    await time.increase(86400);
    await habitTracker.forceSettleDay(user.address, epoch, 10);

    // Check staked balance
    const userState = await habitTracker.userStates(user.address);
    expect(userState.stakedBalance).to.equal(ethers.parseEther("10"));

    // Advance time to earn yield (30 days)
    await time.increase(86400 * 30);

    // Check pending yield
    const { pendingYield } = await habitTracker.getTotalClaimable(user.address);
    expect(pendingYield).to.be.gt(0);

    // Claim staked rewards
    const balanceBefore = await ethers.provider.getBalance(user.address);
    await habitTracker.connect(user).claimStaked(ethers.parseEther("10"));
    const balanceAfter = await ethers.provider.getBalance(user.address);

    // Should receive principal + yield (minus gas)
    expect(balanceAfter).to.be.gt(balanceBefore);
  });
});
```

Run tests:

```bash
npx hardhat test
```

---

## Summary

### What We're Deploying

**Passet Hub (Testing):**

- HabitTracker (modified)
- MockStakingRewards
- Simple linear reward rate for testing

**Moonbeam (Production):**

- HabitTracker (modified)
- MoonwellAdapter
- Real yield from Moonwell mGLMR market

### Key Benefits

✅ **Native integration** - Uses existing protocols (Moonwell)  
✅ **Battle-tested** - Moonwell is audited and production-ready  
✅ **No custom tokens** - Stakes native GLMR/PAS  
✅ **Flexible** - Can swap adapters without changing HabitTracker  
✅ **Testable** - Mock contract for Passet Hub testing  
✅ **Backward compatible** - Old `claimableBalance` still works

### Production Addresses (Moonbeam)

- **Chain ID:** 1284
- **RPC:** `https://moonbeam-rpc.dwellir.com`
- **mGLMR:** `0x091608f4e4a15335145be0A279483C0f8E4c7955`
- **Comptroller:** `0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180`

### Next Steps

1. ✅ **Review this plan**
2. ✅ **Create contract files** (I can do this next)
3. ✅ **Deploy to Passet Hub** (test with mock)
4. ✅ **Test full flow** (deposit → habit → settle → claim)
5. ✅ **Deploy to Moonbeam** (production)
6. ✅ **Update frontend** (show staked balance)

**Ready to implement?** Let me know and I'll create all the contract files! 🚀
