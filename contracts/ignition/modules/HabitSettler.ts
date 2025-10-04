import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as fs from "fs";
import * as path from "path";

/**
 * Automatically find the latest HabitTracker deployment for the current network
 */
function getLatestHabitTrackerAddress(): string {
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

const HabitSettlerModule = buildModule("HabitSettlerModule", (m) => {
  // HabitTracker address - Auto-detected from latest deployment or manually provided
  const autoDetectedAddress = getLatestHabitTrackerAddress();

  // Validate that a real address was auto-detected (if no parameter is provided)
  if (autoDetectedAddress === "0x0000000000000000000000000000000000000000") {
    console.warn(
      "\n⚠️  WARNING: Could not auto-detect HabitTracker deployment!\n" +
      "If deployment fails, ensure HabitTracker is deployed first or provide address manually.\n"
    );
  } else {
    console.log(`📦 Deploying HabitSettler with HabitTracker: ${autoDetectedAddress}`);
  }

  const habitTrackerAddress = m.getParameter("habitTrackerAddress", autoDetectedAddress);

  const habitSettler = m.contract("HabitSettler", [habitTrackerAddress]);

  return { habitSettler };
});

export default HabitSettlerModule;

