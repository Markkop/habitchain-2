// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IStakingAdapter.sol";

/**
 * @title HabitTracker
 * @notice Gamified habit tracking with financial commitment and yield generation
 * @dev Uses epoch-based time (86400-second days) for daily cycles
 * @dev Integrates with external staking via IStakingAdapter
 * 
 * @dev Two types of stakes:
 * - Funded Stake: User deposits locked during day (blockedBalance)
 * - Yield Stake: Successful rewards staked externally for yield generation
 * 
 * @dev Two types of rewards:
 * - User Rewards: Base rewards from successful habit completion (claimableBalance)
 * - Yield Rewards: Additional rewards generated from external staking (tracked in adapter)
 * 
 * @author HabitChain Team
 */
contract HabitTracker {
    uint256 public constant STAKE_PER_DAY = 10 ether;
    uint256 private constant SECONDS_PER_DAY = 60 * 60 * 24;
    address public immutable treasury;
    IStakingAdapter public stakingAdapter;
    address public owner;
    
    // Balance type identifiers
    uint8 private constant BALANCE_DEPOSIT = 0;
    uint8 private constant BALANCE_CLAIMABLE = 1;
    uint8 private constant BALANCE_EXTERNAL = 2;
    
    // ============ Structs ============
    
    struct UserState {
        uint256 depositBalance;      // Available funds for staking on habits
        uint256 blockedBalance;      // Funded stake: locked during active day
        uint256 claimableBalance;    // User rewards: earned from successful habits
        uint32 activeHabitCount;
    }
    
    struct Habit {
        bytes32 text;
        uint64 createdAtEpoch;
        bool archived;
    }
    
    mapping(address => UserState) public userStates;
    mapping(address => mapping(uint32 => Habit)) public habits;
    mapping(address => uint32) public userHabitCounters;
    
    // Bitmap storage: each bit represents a habitId (supports 256 habits per user per epoch)
    mapping(address => mapping(uint64 => uint256)) public funded;
    mapping(address => mapping(uint64 => uint256)) public checked;
    mapping(address => mapping(uint64 => uint256)) public settled;
    
    event Deposited(address indexed user, uint256 amount);
    event BalanceMoved(address indexed user, uint8 indexed from, uint8 indexed to, uint256 amount);
    event HabitCreated(address indexed user, uint32 indexed habitId, bytes32 text);
    event HabitArchived(address indexed user, uint32 indexed habitId);
    event DayPrepared(address indexed user, uint64 indexed epoch, uint32 fundedCount, uint32 insufficientCount);
    event CheckedIn(address indexed user, uint32 indexed habitId, uint64 indexed epoch);
    event SettledSuccess(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 reward);
    event SettledFail(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 slashed);
    event StakingAdapterUpdated(address indexed oldAdapter, address indexed newAdapter);
    
    error InvalidTreasury();
    error InvalidAmount();
    error InsufficientBalance();
    error InvalidBalanceType();
    error HabitNotFound();
    error HabitAlreadyArchived();
    error InvalidEpoch();
    error DayNotFunded();
    error AlreadyCheckedIn();
    error AlreadySettled();
    error CannotSettleCurrentDay();
    error TransferFailed();
    error HabitTextTooLong();
    error OnlyOwner();
    error InvalidStakingAdapter();
    error HabitIdTooLarge();
    
    function _checkOwner() private view {
        if (msg.sender != owner) revert OnlyOwner();
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
    
    function setStakingAdapter(address _newAdapter) external {
        _checkOwner();
        if (_newAdapter == address(0)) revert InvalidStakingAdapter();
        address oldAdapter = address(stakingAdapter);
        stakingAdapter = IStakingAdapter(_newAdapter);
        emit StakingAdapterUpdated(oldAdapter, _newAdapter);
    }
    
    function transferOwnership(address newOwner) external {
        _checkOwner();
        if (newOwner == address(0)) revert InvalidTreasury();
        owner = newOwner;
    }
    
    // ============ Balance Management ============
    
    function deposit() external payable {
        if (msg.value == 0) revert InvalidAmount();
        userStates[msg.sender].depositBalance += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Move funds between balance types
     * @param from Source balance type (0=deposit, 1=claimable)
     * @param to Destination balance type (0=deposit, 1=claimable, 2=external/withdraw)
     * @param amount Amount to move
     * @dev Examples: withdraw from deposit: move(0,2,amt), claim: move(1,2,amt), redeposit: move(1,0,amt)
     */
    function move(uint8 from, uint8 to, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (from == to) revert InvalidBalanceType();
        if (from > BALANCE_CLAIMABLE || to > BALANCE_EXTERNAL) revert InvalidBalanceType();
        
        UserState storage state = userStates[msg.sender];
        
        // Deduct from source
        if (from == BALANCE_DEPOSIT) {
            if (state.depositBalance < amount) revert InsufficientBalance();
            unchecked { state.depositBalance -= amount; }
        } else { // BALANCE_CLAIMABLE
            if (state.claimableBalance < amount) revert InsufficientBalance();
            unchecked { state.claimableBalance -= amount; }
        }
        
        // Add to destination
        if (to == BALANCE_DEPOSIT) {
            unchecked { state.depositBalance += amount; }
        } else if (to == BALANCE_CLAIMABLE) {
            unchecked { state.claimableBalance += amount; }
        } else { // BALANCE_EXTERNAL
            _transfer(msg.sender, amount);
        }
        
        emit BalanceMoved(msg.sender, from, to, amount);
    }
    
    function _transfer(address to, uint256 amount) private {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    // ============ Habit Management Functions ============
    
    /**
     * @notice Create a new habit
     * @param text Description of the habit (up to 32 bytes)
     * @return habitId The ID of the newly created habit
     */
    function createHabit(bytes32 text) external returns (uint32) {
        if (text == bytes32(0)) revert HabitTextTooLong();
        
        uint32 habitId = ++userHabitCounters[msg.sender];
        if (habitId > 255) revert HabitIdTooLarge(); // Bitmap limit
        
        habits[msg.sender][habitId] = Habit({
            text: text,
            createdAtEpoch: epochNow(),
            archived: false
        });
        
        unchecked { userStates[msg.sender].activeHabitCount++; }
        
        emit HabitCreated(msg.sender, habitId, text);
        return habitId;
    }
    
    /**
     * @notice Archive a habit (soft delete)
     * @param habitId ID of the habit to archive
     */
    function archiveHabit(uint32 habitId) external {
        Habit storage habit = habits[msg.sender][habitId];
        if (habit.createdAtEpoch == 0) revert HabitNotFound();
        if (habit.archived) revert HabitAlreadyArchived();
        habit.archived = true;
        unchecked { userStates[msg.sender].activeHabitCount--; }
        emit HabitArchived(msg.sender, habitId);
    }
    
    // ============ Daily Cycle Functions ============
    
    /**
     * @notice Prepare the day by locking funds (funded stake) for active habits
     * @param epoch The epoch to prepare (must be current day)
     * @dev Moves funds from depositBalance to blockedBalance (funded stake)
     */
    function prepareDay(uint64 epoch) external {
        if (epoch != epochNow()) revert InvalidEpoch();
        
        UserState storage state = userStates[msg.sender];
        uint32 count = userHabitCounters[msg.sender];
        uint32 fundedCount;
        uint32 insufficientCount;
        uint256 fundedBitmap = funded[msg.sender][epoch];
        
        for (uint32 i = 1; i <= count;) {
            Habit storage habit = habits[msg.sender][i];
            
            if (!habit.archived && habit.createdAtEpoch != 0) {
                uint256 mask = 1 << i;
                
                if (fundedBitmap & mask == 0) { // Check if not already funded
                    if (state.depositBalance >= STAKE_PER_DAY) {
                        unchecked {
                            state.depositBalance -= STAKE_PER_DAY;
                            state.blockedBalance += STAKE_PER_DAY; // Funded stake
                            fundedCount++;
                        }
                        fundedBitmap |= mask; // Set funded bit
                    } else {
                        unchecked { insufficientCount++; }
                    }
                }
            }
            unchecked { i++; }
        }
        
        funded[msg.sender][epoch] = fundedBitmap;
        emit DayPrepared(msg.sender, epoch, fundedCount, insufficientCount);
    }
    
    /**
     * @notice Check in to a habit for the current day
     * @param habitId ID of the habit
     * @param epoch The epoch to check in (must be current day)
     */
    function checkIn(uint32 habitId, uint64 epoch) external {
        if (epoch != epochNow()) revert InvalidEpoch();
        Habit storage habit = habits[msg.sender][habitId];
        if (habit.createdAtEpoch == 0 || habit.archived) revert HabitNotFound();
        
        uint256 mask = 1 << habitId;
        if (funded[msg.sender][epoch] & mask == 0) revert DayNotFunded();
        if (checked[msg.sender][epoch] & mask != 0) revert AlreadyCheckedIn();
        
        checked[msg.sender][epoch] |= mask;
        emit CheckedIn(msg.sender, habitId, epoch);
    }
    
    /**
     * @notice Settle a specific habit for a past day
     * @param user Address of habit owner
     * @param epoch The epoch to settle (must be past day)
     * @param habitId ID of the habit to settle
     */
    function settle(address user, uint64 epoch, uint32 habitId) public {
        if (epoch >= epochNow()) revert CannotSettleCurrentDay();
        _settleInternal(user, epoch, habitId);
    }
    
    /**
     * @notice Force settle a specific habit without epoch validation (TESTING ONLY)
     * @dev Bypasses the "cannot settle current day" check - use with caution
     * @param user Address of habit owner
     * @param epoch The epoch to settle (can be any epoch, including current)
     * @param habitId ID of the habit to settle
     */
    function forceSettle(address user, uint64 epoch, uint32 habitId) public {
        _settleInternal(user, epoch, habitId);
    }
    
    /**
     * @notice Internal settlement logic without epoch validation
     * @param user Address of habit owner
     * @param epoch The epoch to settle
     * @param habitId ID of the habit to settle
     * @dev Settlement flow:
     * - SUCCESS: User reward is staked externally (yield stake) to generate yield rewards
     * - FAIL: Funded stake is sent to treasury (slashed)
     */
    function _settleInternal(address user, uint64 epoch, uint32 habitId) private {
        if (habits[user][habitId].createdAtEpoch == 0) revert HabitNotFound();
        
        uint256 mask = 1 << habitId;
        if (funded[user][epoch] & mask == 0) revert DayNotFunded();
        if (settled[user][epoch] & mask != 0) revert AlreadySettled();
        
        settled[user][epoch] |= mask;
        UserState storage state = userStates[user];
        
        // Release funded stake from blocked balance
        if (state.blockedBalance < STAKE_PER_DAY) revert InsufficientBalance();
        unchecked { state.blockedBalance -= STAKE_PER_DAY; }
        
        if (checked[user][epoch] & mask != 0) {
            // SUCCESS: Create yield stake by staking user rewards externally
            // This generates yield rewards on top of the base user reward
            if (address(stakingAdapter) != address(0)) {
                stakingAdapter.stake{value: STAKE_PER_DAY}(user, STAKE_PER_DAY);
            } else {
                // Fallback: add user reward to claimable balance (no yield generation)
                unchecked { state.claimableBalance += STAKE_PER_DAY; }
            }
            emit SettledSuccess(user, habitId, epoch, STAKE_PER_DAY);
        } else {
            // FAIL: Slash funded stake - send to treasury
            _transfer(treasury, STAKE_PER_DAY);
            emit SettledFail(user, habitId, epoch, STAKE_PER_DAY);
        }
    }
    
    // ============ Yield Rewards Functions ============
    
    /**
     * @notice Claim yield rewards only (not principal)
     */
    function claimYieldRewards() external returns (uint256) {
        if (address(stakingAdapter) == address(0)) revert InvalidStakingAdapter();
        uint256 claimed = stakingAdapter.claimRewards(msg.sender);
        if (claimed > 0) _transfer(msg.sender, claimed);
        return claimed;
    }
    
    /**
     * @notice Claim everything: unstake principal + yield rewards + user rewards
     */
    function claimAll() external returns (uint256 total) {
        UserState storage state = userStates[msg.sender];
        
        // Unstake + claim yield from adapter
        if (address(stakingAdapter) != address(0)) {
            uint256 staked = stakingAdapter.getStakedAmount(msg.sender);
            if (staked > 0) {
                stakingAdapter.unstake(msg.sender, staked);
                total = staked;
            }
            uint256 yieldRewards = stakingAdapter.claimRewards(msg.sender);
            total += yieldRewards;
        }
        
        // Withdraw user rewards
        uint256 claimable = state.claimableBalance;
        if (claimable > 0) {
            state.claimableBalance = 0;
            emit BalanceMoved(msg.sender, BALANCE_CLAIMABLE, BALANCE_EXTERNAL, claimable);
            total += claimable;
        }
        
        if (total > 0) _transfer(msg.sender, total);
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Allow receiving native tokens from staking adapter
     */
    receive() external payable {}
}

