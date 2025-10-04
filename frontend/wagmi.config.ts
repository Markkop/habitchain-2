import { defineConfig } from "@wagmi/cli";
import { react, hardhat } from "@wagmi/cli/plugins";
import * as fs from "fs";
import * as path from "path";

/**
 * Dynamically load deployed contract addresses from Hardhat Ignition deployments
 */
function loadDeployedAddresses() {
  try {
    const deploymentPath = path.join(
      __dirname,
      "../contracts/ignition/deployments/chain-420420422/deployed_addresses.json"
    );

    if (fs.existsSync(deploymentPath)) {
      const addresses = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

      const deployments: Record<string, Record<number, string>> = {};

      // Map deployment keys to contract names
      for (const [key, address] of Object.entries(addresses)) {
        // Extract contract name from "ModuleName#ContractName" format
        const contractName = key.split("#")[1];
        if (contractName) {
          deployments[contractName] = {
            420420422: address as string,
          };
        }
      }

      console.log("✅ Loaded deployed addresses:", deployments);
      return deployments;
    }
  } catch (error) {
    console.warn("⚠️  Could not load deployed addresses:", error);
  }

  return {};
}

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    hardhat({
      project: "../contracts",
      artifacts: "../contracts/artifacts-pvm",
      deployments: loadDeployedAddresses() as {
        [key: string]: `0x${string}` | Record<number, `0x${string}`> | undefined;
      },
    }),
  ],
});

