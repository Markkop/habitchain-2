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

  // HabitTracker address - Auto-detected from latest deployment or manually provided
  const autoDetectedAddress = getLatestHabitTrackerAddress();

  // Validate that a real address was auto-detected (if no parameter is provided)
  if (autoDetectedAddress === "0x0000000000000000000000000000000000000000") {
    console.warn(
      "\n⚠️  WARNING: Could not auto-detect HabitTracker deployment!\n" +
      "If deployment fails, ensure HabitTracker is deployed first or provide address manually.\n"
    );
  } else {
    console.log(`📦 Deploying MoonwellAdapter with HabitTracker: ${autoDetectedAddress}`);
  }

  const habitTrackerAddress = m.getParameter("habitTracker", autoDetectedAddress);

  const adapter = m.contract("MoonwellAdapter", [
    mGLMR,
    comptroller,
    habitTrackerAddress,
  ]);

  return { adapter };
});

export default MoonwellAdapterModule;

