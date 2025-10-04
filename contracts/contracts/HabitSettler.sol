// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HabitSettler
 * @notice Helper contract for batch settlement operations on HabitTracker
 * @dev Extracted from HabitTracker to reduce main contract bytecode size
 * @author HabitChain Team
 */

interface IHabitTracker {
    function settle(address user, uint64 epoch, uint32 habitId) external;
    function forceSettle(address user, uint64 epoch, uint32 habitId) external;
    function epochNow() external view returns (uint64);
    function userHabitCounters(address user) external view returns (uint32);
    function habits(address user, uint32 habitId) external view returns (bytes32 text, uint64 createdAtEpoch, bool archived);
    function funded(address user, uint64 epoch) external view returns (uint256);
    function settled(address user, uint64 epoch) external view returns (uint256);
}

contract HabitSettler {
    IHabitTracker public immutable habitTracker;
    uint32 private constant MAX_SETTLE_BATCH = 50;
    
    error InvalidBatchSize();
    error CannotSettleCurrentDay();
    
    constructor(address _habitTracker) {
        habitTracker = IHabitTracker(_habitTracker);
    }
    
    /**
     * @notice Settle all funded habits for a user for a specific past day
     * @param user Address of habit owner
     * @param epoch The epoch to settle (must be past day)
     * @param maxCount Maximum number of habits to settle (gas limit protection)
     * @return settledCount Number of habits actually settled
     */
    function settleAll(address user, uint64 epoch, uint32 maxCount) external returns (uint32 settledCount) {
        if (epoch >= habitTracker.epochNow()) revert CannotSettleCurrentDay();
        if (maxCount == 0 || maxCount > MAX_SETTLE_BATCH) revert InvalidBatchSize();
        
        uint32 count = habitTracker.userHabitCounters(user);
        uint256 fundedBitmap = habitTracker.funded(user, epoch);
        uint256 settledBitmap = habitTracker.settled(user, epoch);
        
        for (uint32 i = 1; i <= count && settledCount < maxCount;) {
            uint256 mask = 1 << i;
            if ((fundedBitmap & mask != 0) && (settledBitmap & mask == 0)) {
                (, uint64 createdAtEpoch, bool archived) = habitTracker.habits(user, i);
                if (createdAtEpoch != 0 && !archived) {
                    habitTracker.settle(user, epoch, i);
                    unchecked { settledCount++; }
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
     * @return settledCount Number of habits actually settled
     */
    function forceSettleDay(address user, uint64 epoch, uint32 maxCount) external returns (uint32 settledCount) {
        if (maxCount == 0 || maxCount > MAX_SETTLE_BATCH) revert InvalidBatchSize();
        
        uint32 count = habitTracker.userHabitCounters(user);
        uint256 fundedBitmap = habitTracker.funded(user, epoch);
        uint256 settledBitmap = habitTracker.settled(user, epoch);
        
        for (uint32 i = 1; i <= count && settledCount < maxCount;) {
            uint256 mask = 1 << i;
            if ((fundedBitmap & mask != 0) && (settledBitmap & mask == 0)) {
                (, uint64 createdAtEpoch, bool archived) = habitTracker.habits(user, i);
                if (createdAtEpoch != 0 && !archived) {
                    habitTracker.forceSettle(user, epoch, i);
                    unchecked { settledCount++; }
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
     * @return settledCount Number of habits actually settled
     */
    function forceSettleAllEpochs(address user, uint64 startEpoch, uint32 maxSettlements) external returns (uint32 settledCount) {
        if (maxSettlements == 0 || maxSettlements > MAX_SETTLE_BATCH) revert InvalidBatchSize();
        
        uint32 habitCount = habitTracker.userHabitCounters(user);
        uint64 currentEpoch = habitTracker.epochNow();
        
        for (uint32 habitId = 1; habitId <= habitCount && settledCount < maxSettlements;) {
            (, uint64 createdAtEpoch, bool archived) = habitTracker.habits(user, habitId);
            
            if (createdAtEpoch != 0 && !archived) {
                uint64 scanStart = startEpoch > createdAtEpoch ? startEpoch : createdAtEpoch;
                
                for (uint64 epoch = scanStart; epoch < currentEpoch && settledCount < maxSettlements;) {
                    uint256 mask = 1 << habitId;
                    
                    if ((habitTracker.funded(user, epoch) & mask != 0) && (habitTracker.settled(user, epoch) & mask == 0)) {
                        habitTracker.forceSettle(user, epoch, habitId);
                        unchecked { settledCount++; }
                    }
                    unchecked { epoch++; }
                }
            }
            unchecked { habitId++; }
        }
    }
    
    /**
     * @notice Settle multiple specific habits
     * @param user Address of habit owner
     * @param epochs Array of epochs to settle
     * @param habitIds Array of habit IDs to settle (must match epochs length)
     * @return settledCount Number of habits actually settled
     */
    function settleBatch(
        address user,
        uint64[] calldata epochs,
        uint32[] calldata habitIds
    ) external returns (uint32 settledCount) {
        uint256 length = epochs.length;
        if (length == 0 || length > MAX_SETTLE_BATCH) revert InvalidBatchSize();
        if (length != habitIds.length) revert InvalidBatchSize();
        
        for (uint256 i = 0; i < length;) {
            try habitTracker.settle(user, epochs[i], habitIds[i]) {
                unchecked { settledCount++; }
            } catch {
                // Skip failed settlements
            }
            unchecked { i++; }
        }
    }
}

