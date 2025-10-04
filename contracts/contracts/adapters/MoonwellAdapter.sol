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
 * @notice Adapter for HabitTracker to create yield stakes in Moonwell on Moonbeam
 * @dev Supports native GLMR staking via mGLMR market
 * 
 * @dev Terminology:
 * - Yield Stake: User rewards from successful habits staked here (userStakes)
 * - Yield Rewards: Additional rewards generated from Moonwell (WELL tokens + supply APY)
 * 
 * @dev When user completes a habit successfully, their reward is sent here as a yield stake
 * to generate additional yield rewards over time
 */
contract MoonwellAdapter is IStakingAdapter {
    address public immutable mToken;        // mGLMR address
    address public immutable comptroller;   // Moonwell Comptroller
    address public immutable habitTracker;  // Only HabitTracker can call

    mapping(address => uint256) public userStakes; // Track per-user yield stakes (principal)

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
     * @notice Create yield stake by staking user rewards into Moonwell
     * @param user Address of the user whose rewards are being staked
     * @param amount Amount of GLMR to stake (user's earned reward)
     * @dev msg.value must equal amount (native token)
     * @dev This converts user rewards into yield stakes that generate yield rewards
     */
    function stake(address user, uint256 amount) external payable onlyHabitTracker {
        if (msg.value != amount) revert InvalidAmount();
        if (amount == 0) revert InvalidAmount();

        // Mint mGLMR by sending GLMR (creates yield stake)
        IMTokenNative(mToken).mint{value: amount}();

        // Track user's yield stake (principal amount)
        userStakes[user] += amount;

        emit Staked(user, amount, IMTokenNative(mToken).balanceOf(address(this)));
    }

    /**
     * @notice Unstake GLMR from Moonwell (redeem yield stake + accumulated yield rewards)
     * @param user Address of the user whose rewards are being unstaked
     * @param amount Amount of underlying GLMR to unstake
     * @dev Redeems mGLMR and sends GLMR back to HabitTracker
     * @dev Returns both yield stake principal and any accumulated yield rewards
     */
    function unstake(address user, uint256 amount) external onlyHabitTracker {
        if (amount == 0) revert InvalidAmount();

        // Redeem underlying GLMR (yield stake + yield rewards)
        uint256 err = IMTokenNative(mToken).redeemUnderlying(amount);
        if (err != 0) revert RedeemFailed();

        // Update user's yield stake principal
        userStakes[user] -= amount;

        // Send GLMR back to HabitTracker (includes yield rewards if amount > principal)
        (bool success, ) = habitTracker.call{value: amount}("");
        if (!success) revert RedeemFailed();

        emit Unstaked(user, amount, IMTokenNative(mToken).balanceOf(address(this)));
    }

    /**
     * @notice Claim yield rewards (WELL tokens) from Moonwell
     * @param user Address of the user (unused in Moonwell - claims for entire protocol)
     * @return claimed Amount of yield rewards claimed (0 if none)
     * @dev Best-effort claim; returns 0 if rewards not active
     * @dev Yield rewards = WELL tokens earned from supplying to Moonwell
     * @dev Note: Moonwell claims are protocol-wide, not per-user
     */
    function claimRewards(address user) external onlyHabitTracker returns (uint256 claimed) {
        address[] memory markets = new address[](1);
        markets[0] = mToken;

        // Try to claim WELL yield rewards (rewardType 0)
        try IComptroller(comptroller).claimReward(0, address(this), markets) {
            // If successful, WELL yield rewards sent to this adapter
            // HabitTracker can sweep them later
            emit RewardsClaimed(user, 0);
            return 0; // Don't track WELL tokens for now
        } catch {
            return 0; // Yield rewards not active or failed
        }
    }

    /**
     * @notice Get user's yield stake amount (in underlying GLMR)
     * @param who Address to check
     * @return staked Amount of GLMR in yield stake (principal only, excludes yield rewards)
     */
    function getStakedAmount(address who) external view returns (uint256 staked) {
        // Return user's tracked yield stake principal
        // Note: This tracks only principal, not current value including yield rewards
        return userStakes[who];
    }

    /**
     * @notice Get pending yield rewards (not supported by Moonwell directly)
     * @return pending Always returns 0
     * @dev Moonwell doesn't expose claimable yield rewards on-chain; use off-chain calculation
     * @dev Yield rewards accumulate automatically in mToken exchange rate
     */
    function getPendingRewards(address /* who */) external pure returns (uint256 pending) {
        return 0; // Not easily accessible on-chain
    }

    /**
     * @notice Allow receiving GLMR from Moonwell redemptions
     */
    receive() external payable {}
}

