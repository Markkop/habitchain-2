// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HabitTracker
 * @notice Gamified habit tracking with financial commitment
 * @dev Uses epoch-based time (86400-second days) for daily cycles
 * @author HabitChain Team
 */
contract HabitTracker {
    uint256 public constant STAKE_PER_DAY = 10 ether;
    uint256 private constant SECONDS_PER_DAY = 86400;
    uint32 private constant MAX_SETTLE_BATCH = 50;
    address public immutable treasury;
    
    // ============ Structs ============
    
    struct UserState {
        uint256 depositBalance;
        uint256 blockedBalance;
        uint256 claimableBalance;
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
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event RedepositedFromClaimable(address indexed user, uint256 amount);
    event HabitCreated(address indexed user, uint32 indexed habitId, bytes32 text);
    event HabitArchived(address indexed user, uint32 indexed habitId);
    event DayPrepared(address indexed user, uint64 indexed epoch, uint32 fundedCount, uint32 insufficientCount);
    event CheckedIn(address indexed user, uint32 indexed habitId, uint64 indexed epoch);
    event SettledSuccess(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 reward);
    event SettledFail(address indexed user, uint32 indexed habitId, uint64 indexed epoch, uint256 slashed);
    
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
    
    modifier onlyHabitOwner(uint32 habitId) {
        if (habits[msg.sender][habitId].owner != msg.sender) revert NotHabitOwner();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _treasury) {
        if (_treasury == address(0)) revert InvalidTreasury();
        treasury = _treasury;
    }
    
    function epochNow() public view returns (uint64) {
        return uint64(block.timestamp / SECONDS_PER_DAY);
    }
    
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
    
    // ============ Habit Management Functions ============
    
    /**
     * @notice Create a new habit
     * @param text Description of the habit (up to 32 bytes)
     * @return habitId The ID of the newly created habit
     */
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
    
    /**
     * @notice Archive a habit (soft delete)
     * @param habitId ID of the habit to archive
     */
    function archiveHabit(uint32 habitId) external onlyHabitOwner(habitId) {
        Habit storage habit = habits[msg.sender][habitId];
        if (habit.archived) revert HabitAlreadyArchived();
        habit.archived = true;
        unchecked { userStates[msg.sender].activeHabitCount--; }
        emit HabitArchived(msg.sender, habitId);
    }
    
    // ============ Daily Cycle Functions ============
    
    /**
     * @notice Prepare the day by locking funds for active habits
     * @param epoch The epoch to prepare (must be current day)
     */
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
                
                if (status.flags & 1 == 0) { // Check if funded bit is 0
                    if (state.depositBalance >= STAKE_PER_DAY) {
                        unchecked {
                            state.depositBalance -= STAKE_PER_DAY;
                            state.blockedBalance += STAKE_PER_DAY;
                            fundedCount++;
                        }
                        status.flags |= 1; // Set funded bit
                    } else {
                        unchecked { insufficientCount++; }
                    }
                }
            }
            unchecked { i++; }
        }
        
        emit DayPrepared(msg.sender, epoch, fundedCount, insufficientCount);
    }
    
    /**
     * @notice Check in to a habit for the current day
     * @param habitId ID of the habit
     * @param epoch The epoch to check in (must be current day)
     */
    function checkIn(uint32 habitId, uint64 epoch) external onlyHabitOwner(habitId) {
        if (epoch != epochNow()) revert InvalidEpoch();
        if (habits[msg.sender][habitId].archived) revert HabitNotFound();
        
        DailyStatus storage status = dailyStatuses[msg.sender][epoch][habitId];
        if (status.flags & 1 == 0) revert DayNotFunded(); // Check funded bit
        if (status.flags & 2 != 0) revert AlreadyCheckedIn(); // Check checked bit
        
        status.flags |= 2; // Set checked bit
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
     * @notice Internal settlement logic without epoch validation
     * @param user Address of habit owner
     * @param epoch The epoch to settle
     * @param habitId ID of the habit to settle
     */
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
            unchecked { state.claimableBalance += STAKE_PER_DAY; }
            emit SettledSuccess(user, habitId, epoch, STAKE_PER_DAY);
        } else {
            _transfer(treasury, STAKE_PER_DAY);
            emit SettledFail(user, habitId, epoch, STAKE_PER_DAY);
        }
    }
    
    /**
     * @notice Settle all funded habits for a user for a specific past day
     * @param user Address of habit owner
     * @param epoch The epoch to settle (must be past day)
     * @param maxCount Maximum number of habits to settle (gas limit protection)
     */
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
    
    /**
     * @notice Force settle a specific day without epoch validation (TESTING ONLY)
     * @dev Same as settleAll but bypasses the "cannot settle current day" check
     * @param user Address of habit owner
     * @param epoch The epoch to settle (can be any epoch, including current)
     * @param maxCount Maximum number of habits to settle (gas limit protection)
     */
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
    
    /**
     * @notice Force settle all unsettled habits across all past epochs (TESTING ONLY)
     * @dev Scans all habits and all past epochs to find and settle any funded but unsettled days
     * @param user Address of habit owner
     * @param startEpoch Starting epoch to scan from (usually habit creation epoch or 0)
     * @param maxSettlements Maximum number of settlements to process (gas limit protection)
     */
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
}

