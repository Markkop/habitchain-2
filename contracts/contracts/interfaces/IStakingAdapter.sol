// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IStakingAdapter
 * @notice Chain-agnostic interface for external staking protocols
 * @dev Allows HabitTracker to integrate with any staking protocol
 * 
 * @dev Terminology:
 * - Yield Stake: User rewards staked in external protocol (principal)
 * - Yield Rewards: Additional rewards generated from external protocol
 */
interface IStakingAdapter {
    /**
     * @notice Create yield stake by staking user rewards into external protocol
     * @param user Address of the user whose rewards are being staked
     * @param amount Amount to stake (user's earned rewards)
     * @dev For native token staking, msg.value should equal amount
     */
    function stake(address user, uint256 amount) external payable;

    /**
     * @notice Unstake from external protocol (yield stake + yield rewards)
     * @param user Address of the user whose rewards are being unstaked
     * @param amount Amount to unstake
     * @dev Unstaked tokens (principal + yield rewards) should be sent back to HabitTracker
     */
    function unstake(address user, uint256 amount) external;

    /**
     * @notice Claim accumulated yield rewards from external protocol for a specific user
     * @param user Address of the user whose yield rewards to claim
     * @return claimed Amount of yield rewards claimed
     * @dev Returns 0 if no yield rewards available or not supported
     * @dev Claimed rewards should be sent back to HabitTracker
     */
    function claimRewards(address user) external returns (uint256 claimed);

    /**
     * @notice Get total yield stake amount for an address (principal only)
     * @param who Address to check
     * @return staked Total yield stake by address (excludes yield rewards)
     */
    function getStakedAmount(address who) external view returns (uint256 staked);

    /**
     * @notice Get pending unclaimed yield rewards for an address
     * @param who Address to check
     * @return pending Pending yield rewards
     * @dev Returns 0 if not supported by protocol
     */
    function getPendingRewards(address who) external view returns (uint256 pending);
}

