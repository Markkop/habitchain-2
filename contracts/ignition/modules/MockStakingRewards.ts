import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as fs from "fs";
import * as path from "path";

/**
 * Automatically find the latest HabitTracker deployment for the current network
 */
function getLatestHabitTrackerAddress(networkId?: string): string {
  try {
    const deploymentsPath = path.join(__dirname, "..", "deployments");

    if (!fs.existsSync(deploymentsPath)) {
      return "0x0000000000000000000000000000000000000000";
    }

    // Find all chain directories
    const chainDirs = fs.readdirSync(deploymentsPath)
      .filter(dir => fs.statSync(path.join(deploymentsPath, dir)).isDirectory());

    // Try each chain directory
    for (const chainDir of chainDirs) {
      const addressesFile = path.join(deploymentsPath, chainDir, "deployed_addresses.json");

      if (fs.existsSync(addressesFile)) {
        const addresses = JSON.parse(fs.readFileSync(addressesFile, "utf-8"));
        const habitTrackerKey = Object.keys(addresses).find(key =>
          key.includes("HabitTracker") && key.includes("#HabitTracker")
        );

        if (habitTrackerKey) {
          console.log(`✅ Found HabitTracker deployment: ${addresses[habitTrackerKey]}`);
          return addresses[habitTrackerKey];
        }
      }
    }
  } catch (error) {
    console.warn("⚠️  Could not auto-detect HabitTracker address:", error);
  }

  return "0x0000000000000000000000000000000000000000";
}

const MockStakingRewardsModule = buildModule(
  "MockStakingRewardsModule",
  (m) => {
    // Mock reward rate: Reduced 100x for realistic rewards
    // 3.5e13 = generates ~0.0001 PAS in 30 seconds for 0.1 PAS stake (100x slower than before)
    const ratePerSecond = m.getParameter("ratePerSecond", "35000000000000"); // 3.5e13

    // HabitTracker address - Auto-detected from latest deployment or manually provided
    const autoDetectedAddress = getLatestHabitTrackerAddress();

    // Validate that a real address was auto-detected (if no parameter is provided)
    if (autoDetectedAddress === "0x0000000000000000000000000000000000000000") {
      console.warn(
        "\n⚠️  WARNING: Could not auto-detect HabitTracker deployment!\n" +
        "If deployment fails, ensure HabitTracker is deployed first or provide address manually.\n"
      );
    } else {
      console.log(`📦 Deploying MockStakingRewards with HabitTracker: ${autoDetectedAddress}`);
    }

    const habitTrackerAddress = m.getParameter("habitTracker", autoDetectedAddress);

    const mockStaking = m.contract("MockStakingRewards", [
      ratePerSecond,
      habitTrackerAddress,
    ]);

    // Fund contract with 1 PAS for reward pool
    console.log("💰 Funding MockStakingRewards with 1 PAS...");
    m.send("fundMockStaking", mockStaking, BigInt("1000000000000000000")); // 1 PAS (1e18 wei)

    return { mockStaking };
  }
);

export default MockStakingRewardsModule;

