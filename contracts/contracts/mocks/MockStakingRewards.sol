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

    function stake(address user, uint256 amount) external payable onlyHabitTracker {
        if (msg.value != amount) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        _updateRewards(user);
        deposits[user] += amount;

        emit Staked(user, amount);
    }

    function unstake(address user, uint256 amount) external onlyHabitTracker {
        if (amount == 0) revert InvalidAmount();
        if (deposits[user] < amount) revert InsufficientBalance();

        _updateRewards(user);
        deposits[user] -= amount;

        // Send back to HabitTracker
        (bool success, ) = habitTracker.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Unstaked(user, amount);
    }

    function claimRewards(address user) external onlyHabitTracker returns (uint256 claimed) {
        claimed = _pendingRewards(user);
        
        // Safety: Check contract has funds
        uint256 balance = address(this).balance;
        if (balance == 0) return 0;
        
        // Safety: Cap at 10% of balance per claim
        uint256 maxClaim = balance / 10;
        if (claimed > maxClaim) claimed = maxClaim;
        
        // Safety: Can only claim what's available
        if (claimed > balance) claimed = balance;
        
        if (claimed > 0) {
            lastUpdateTime[user] = block.timestamp;
            (bool success, ) = habitTracker.call{value: claimed}("");
            if (!success) revert TransferFailed();
            emit RewardsClaimed(user, claimed);
        }
        
        return claimed;
    }

    function getStakedAmount(address who) external view returns (uint256) {
        return deposits[who];
    }

    function getPendingRewards(address who) external view returns (uint256) {
        return _pendingRewards(who);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
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

