import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("HabitTracker with Staking Integration", function () {
  it("should auto-stake rewards and earn yield", async function () {
    const [deployer, user] = await ethers.getSigners();

    // Deploy contracts
    const MockStaking = await ethers.getContractFactory("MockStakingRewards");
    const HabitTracker = await ethers.getContractFactory("HabitTracker");
    const HabitSettler = await ethers.getContractFactory("HabitSettler");

    // Deploy HabitTracker first (with no adapter)
    const habitTracker = await HabitTracker.deploy(
      deployer.address,
      ethers.ZeroAddress
    );

    // Deploy HabitSettler helper
    const habitSettler = await HabitSettler.deploy(
      await habitTracker.getAddress()
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

    // Advance time and settle using HabitSettler
    await time.increase(86400);
    await habitSettler.forceSettleDay(user.address, epoch, 10);

    // Check staked balance in adapter (accounting is now externalized)
    const stakedAmount = await mockStaking.getStakedAmount(await habitTracker.getAddress());
    expect(stakedAmount).to.equal(ethers.parseEther("10"));

    // Advance time to earn yield (30 days)
    await time.increase(86400 * 30);

    // Check pending yield directly from adapter
    const pendingYield = await mockStaking.getPendingRewards(await habitTracker.getAddress());
    expect(pendingYield).to.be.gt(0);

    // Claim rewards through adapter (now user must interact with adapter directly)
    const balanceBefore = await ethers.provider.getBalance(await habitTracker.getAddress());
    await mockStaking.claimRewards();
    const balanceAfter = await ethers.provider.getBalance(await habitTracker.getAddress());

    // HabitTracker should have received the yield
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("should fallback to claimable balance when no adapter set", async function () {
    const [deployer, user] = await ethers.getSigners();

    const HabitTracker = await ethers.getContractFactory("HabitTracker");
    const HabitSettler = await ethers.getContractFactory("HabitSettler");

    const habitTracker = await HabitTracker.deploy(
      deployer.address,
      ethers.ZeroAddress // No staking adapter
    );

    // Deploy HabitSettler helper
    const habitSettler = await HabitSettler.deploy(
      await habitTracker.getAddress()
    );

    // User deposits
    await habitTracker
      .connect(user)
      .deposit({ value: ethers.parseEther("100") });

    // Create habit
    await habitTracker
      .connect(user)
      .createHabit(ethers.encodeBytes32String("Exercise"));

    // Prepare day and check in
    const epoch = await habitTracker.epochNow();
    await habitTracker.connect(user).prepareDay(epoch);
    await habitTracker.connect(user).checkIn(1, epoch);

    // Advance time and settle using HabitSettler
    await time.increase(86400);
    await habitSettler.forceSettleDay(user.address, epoch, 10);

    // Check that rewards went to claimable balance (fallback behavior)
    const userState = await habitTracker.userStates(user.address);
    expect(userState.claimableBalance).to.equal(ethers.parseEther("10"));
  });

  it("should allow owner to update staking adapter", async function () {
    const [deployer, user] = await ethers.getSigners();

    const MockStaking = await ethers.getContractFactory("MockStakingRewards");
    const HabitTracker = await ethers.getContractFactory("HabitTracker");

    const habitTracker = await HabitTracker.deploy(
      deployer.address,
      ethers.ZeroAddress
    );

    const mockStaking = await MockStaking.deploy(
      ethers.parseUnits("0.0001", 18),
      await habitTracker.getAddress()
    );

    // Set staking adapter
    await expect(
      habitTracker.setStakingAdapter(await mockStaking.getAddress())
    )
      .to.emit(habitTracker, "StakingAdapterUpdated")
      .withArgs(ethers.ZeroAddress, await mockStaking.getAddress());

    // Non-owner should not be able to update
    await expect(
      habitTracker.connect(user).setStakingAdapter(await mockStaking.getAddress())
    ).to.be.revertedWithCustomError(habitTracker, "OnlyOwner");
  });
});

