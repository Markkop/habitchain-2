#!/usr/bin/env node

/**
 * Comprehensive Deployment Script for HabitChain
 * 
 * Features:
 * - Configurable deployments per network
 * - Automatic dependency tracking
 * - Post-deployment verification
 * - Staking adapter auto-update
 * - Detailed logging and error handling
 * - Frontend ABI regeneration
 * 
 * Usage:
 *   npm run deploy:all -- --network polkadotHubTestnet
 *   npm run deploy:all -- --network moonbeam --confirm
 *   npm run deploy:all -- --network localhost --skip-mock
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { getNetworkConfig, applyEnvOverrides, type NetworkConfig } from "../deploy.config";

const execAsync = promisify(exec);

// ANSI colors for better logging
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

interface DeploymentResult {
  contract: string;
  address: string;
  txHash?: string;
  timestamp: number;
}

interface DeploymentState {
  networkName: string;
  chainId: number;
  deployer: string;
  results: DeploymentResult[];
  config: NetworkConfig;
  startTime: number;
  totalSteps: number;
  completedSteps: number;
  rpcUrl?: string;
}

interface BlockInfo {
  number: number;
  timestamp: number;
}

class DeploymentManager {
  private state: DeploymentState;
  private readonly ignitionPath = path.join(__dirname, "..", "ignition");

  constructor(networkName: string) {
    const config = applyEnvOverrides(getNetworkConfig(networkName));

    // Calculate total steps
    let totalSteps = 1; // HabitTracker
    if (config.deployMockStaking || config.deployMoonwellAdapter) totalSteps++;
    if (config.autoUpdateStakingAdapter && (config.deployMockStaking || config.deployMoonwellAdapter)) totalSteps++;
    if (config.deploySettler) totalSteps++;
    totalSteps++; // Frontend ABI generation

    this.state = {
      networkName,
      chainId: 0,
      deployer: "",
      results: [],
      config,
      startTime: Date.now(),
      totalSteps,
      completedSteps: 0,
      rpcUrl: this.getRpcUrl(networkName),
    };
  }

  private getRpcUrl(networkName: string): string | undefined {
    const urls: Record<string, string> = {
      polkadotHubTestnet: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      passetHub: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      moonbeam: "https://moonbeam-rpc.dwellir.com",
      moonbaseAlpha: "https://rpc.api.moonbase.moonbeam.network",
      localhost: "http://127.0.0.1:8545",
    };
    return urls[networkName];
  }

  // ========== Logging Helpers ==========

  private log(message: string, color: keyof typeof colors = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private logSection(title: string) {
    console.log("");
    this.log(`${"=".repeat(60)}`, "cyan");
    this.log(`  ${title}`, "bright");
    this.log(`${"=".repeat(60)}`, "cyan");
  }

  private logSuccess(message: string) {
    this.log(`✅ ${message}`, "green");
  }

  private logError(message: string) {
    this.log(`❌ ${message}`, "red");
  }

  private logWarning(message: string) {
    this.log(`⚠️  ${message}`, "yellow");
  }

  private logInfo(message: string) {
    this.log(`ℹ️  ${message}`, "blue");
  }

  private logStep(step: string) {
    this.log(`\n▶️  ${step}...`, "magenta");
  }

  private progressBar(percentage: number): string {
    const filled = Math.floor(percentage / 5); // 20 chars total
    const empty = 20 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }

  private completeStep() {
    this.state.completedSteps++;
  }

  // ========== Deployment Helpers ==========

  private async runCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: path.join(__dirname, ".."),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes("Warning") && !stderr.includes("npm WARN")) {
        console.error(stderr);
      }

      return stdout;
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  private async deployContract(
    moduleName: string,
    displayName: string
  ): Promise<string> {
    this.logStep(`Deploying ${displayName}`);

    const retries = 5; // Fixed: 5 retry attempts
    const retryDelays = [2.5, 5, 10, 20, 30]; // Retry delays in seconds
    const confirmFlag = this.state.config.confirmBeforeDeploy ? "" : "echo 'y' | ";
    const command = `${confirmFlag}npx hardhat ignition deploy ./ignition/modules/${moduleName}.ts --network ${this.state.networkName}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const output = await this.runCommand(command);

        // Parse deployed address from output
        const address = this.extractAddressFromOutput(output, displayName);

        if (address) {
          this.state.results.push({
            contract: displayName,
            address,
            timestamp: Date.now(),
          });

          this.logSuccess(`${displayName} deployed at: ${address}`);

          this.completeStep();

          // Wait for confirmations before next deployment
          await this.waitForConfirmations(displayName);

          return address;
        } else {
          throw new Error("Could not extract deployment address");
        }
      } catch (error: any) {
        const isIgnitionWaitError = error.message.includes("IGN403") ||
          error.message.includes("wait until they get") ||
          error.message.includes("confirmations");

        const isIgnitionDroppedTxError = error.message.includes("IGN401") ||
          error.message.includes("were dropped") ||
          error.message.includes("Please try rerunning");

        const isRetryableError = isIgnitionWaitError || isIgnitionDroppedTxError;

        if (isRetryableError && attempt < retries) {
          const waitTime = retryDelays[attempt - 1]; // Get delay from array: 2.5, 5, 10, 20, 30

          if (isIgnitionDroppedTxError) {
            this.logWarning(`Transaction dropped. Retry ${attempt}/${retries} in ${waitTime}s...`);
          } else {
            this.logWarning(`Ignition requires confirmations. Retry ${attempt}/${retries} in ${waitTime}s...`);
          }

          await this.sleepWithProgress(waitTime, `Waiting for retry ${attempt}`);
          continue;
        }

        this.logError(`Failed to deploy ${displayName}: ${error.message}`);
        throw error;
      }
    }

    throw new Error(`Failed to deploy ${displayName} after ${retries} attempts`);
  }

  private async waitForConfirmations(contractName: string): Promise<void> {
    // Wait for block confirmations (approximately 12 seconds per block on Polkadot)
    // 5 confirmations = ~60 seconds
    const waitSeconds = this.state.config.waitBetweenDeployments || 5;

    const startBlock = await this.getCurrentBlock();
    if (startBlock) {
      this.logInfo(`Current block: #${startBlock.number}`);
    }

    await this.sleepWithProgress(waitSeconds, "Waiting for block confirmations");

    const endBlock = await this.getCurrentBlock();
    if (startBlock && endBlock) {
      const confirmations = endBlock.number - startBlock.number;
      this.logSuccess(`${confirmations} block(s) confirmed (${startBlock.number} → ${endBlock.number})`);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async sleepWithProgress(seconds: number, message: string): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + (seconds * 1000);

    // Show countdown with spinner
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frame = 0;

    while (Date.now() < endTime) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);

      process.stdout.write(`\r   ${spinner[frame]} ${message}: ${remaining}s remaining...`);
      frame = (frame + 1) % spinner.length;

      await this.sleep(100);
    }

    process.stdout.write(`\r   ✓ ${message}: Complete!          \n`);
  }

  private async getCurrentBlock(): Promise<BlockInfo | null> {
    if (!this.state.rpcUrl) return null;

    try {
      const response = await this.rpcRequest(this.state.rpcUrl, {
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
      });

      if (response.result) {
        const blockNumber = parseInt(response.result, 16);
        return {
          number: blockNumber,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      // Silently fail - block tracking is optional
    }

    return null;
  }

  private async rpcRequest(url: string, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      const postData = JSON.stringify(body);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  private extractAddressFromOutput(output: string, contractName: string): string {
    // Try to read from deployed_addresses.json
    const address = this.getLatestDeployedAddress(contractName);
    if (address) return address;

    // Fallback: parse from output
    const match = output.match(/0x[a-fA-F0-9]{40}/);
    return match ? match[0] : "";
  }

  private getLatestDeployedAddress(contractName: string): string {
    try {
      const deploymentsPath = path.join(this.ignitionPath, "deployments");

      if (!fs.existsSync(deploymentsPath)) {
        return "";
      }

      const chainDirs = fs.readdirSync(deploymentsPath)
        .filter(dir => fs.statSync(path.join(deploymentsPath, dir)).isDirectory())
        .sort()
        .reverse(); // Get latest first

      for (const chainDir of chainDirs) {
        const addressesFile = path.join(deploymentsPath, chainDir, "deployed_addresses.json");

        if (fs.existsSync(addressesFile)) {
          const addresses = JSON.parse(fs.readFileSync(addressesFile, "utf-8"));
          const key = Object.keys(addresses).find(k => k.includes(contractName));

          if (key) {
            return addresses[key];
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read deployed address for ${contractName}:`, error);
    }

    return "";
  }

  private async updateStakingAdapter(
    habitTrackerAddress: string,
    adapterAddress: string
  ): Promise<void> {
    this.logStep("Updating HabitTracker staking adapter");

    try {
      // Create a simple script to call setStakingAdapter
      const script = `
        const hre = require("hardhat");
        async function main() {
          const habitTracker = await hre.ethers.getContractAt("HabitTracker", "${habitTrackerAddress}");
          const tx = await habitTracker.setStakingAdapter("${adapterAddress}");
          await tx.wait();
          console.log("✅ Staking adapter updated");
        }
        main().catch(console.error);
      `;

      const scriptPath = path.join(__dirname, "temp-update-adapter.js");
      fs.writeFileSync(scriptPath, script);

      await this.runCommand(`npx hardhat run ${scriptPath} --network ${this.state.networkName}`);

      fs.unlinkSync(scriptPath);

      this.logSuccess("Staking adapter updated in HabitTracker");
      this.completeStep();
    } catch (error: any) {
      this.logWarning(`Could not update staking adapter: ${error.message}`);
      this.logInfo("You may need to call setStakingAdapter() manually");
      this.completeStep();
    }
  }

  // ========== Main Deployment Flow ==========

  async cleanBeforeDeploy(): Promise<void> {
    this.logSection("Cleaning Old Deployments");
    await this.cleanDeployments();
  }

  async deploy(): Promise<void> {
    this.logSection("HabitChain Deployment");
    this.logInfo(`Network: ${this.state.networkName}`);
    this.logInfo(`Total steps: ${this.state.totalSteps}`);

    const startBlock = await this.getCurrentBlock();
    if (startBlock) {
      this.logInfo(`Starting at block: #${startBlock.number}`);
    }

    console.log("");

    try {
      // Step 1: Deploy HabitTracker (base contract)
      const habitTrackerAddress = await this.deployContract("HabitTracker", "HabitTracker");

      // Step 2: Deploy staking adapter (if configured)
      let adapterAddress = "";

      if (this.state.config.deployMockStaking) {
        adapterAddress = await this.deployContract("MockStakingRewards", "MockStakingRewards");
      } else if (this.state.config.deployMoonwellAdapter) {
        adapterAddress = await this.deployContract("MoonwellAdapter", "MoonwellAdapter");
      }

      // Step 3: Update HabitTracker with adapter address
      if (adapterAddress && this.state.config.autoUpdateStakingAdapter) {
        await this.updateStakingAdapter(habitTrackerAddress, adapterAddress);
      }

      // Step 4: Deploy HabitSettler (optional helper)
      if (this.state.config.deploySettler) {
        await this.deployContract("HabitSettler", "HabitSettler");
      }

      // Step 5: Regenerate frontend ABIs
      await this.regenerateFrontendABIs();

      // Step 6: Show summary
      this.showDeploymentSummary();

    } catch (error: any) {
      this.logError("Deployment failed");
      console.error(error);
      process.exit(1);
    }
  }

  private async cleanDeployments(): Promise<void> {
    this.logStep("Cleaning old deployment artifacts");

    const deploymentsPath = path.join(this.ignitionPath, "deployments");

    if (fs.existsSync(deploymentsPath)) {
      fs.rmSync(deploymentsPath, { recursive: true, force: true });
      this.logSuccess("Old deployments cleaned");
    } else {
      this.logInfo("No old deployments to clean");
    }
  }

  private async regenerateFrontendABIs(): Promise<void> {
    this.logStep("Regenerating frontend ABIs");

    try {
      const frontendPath = path.join(__dirname, "..", "..", "frontend");

      if (!fs.existsSync(frontendPath)) {
        this.logWarning("Frontend directory not found, skipping ABI generation");
        return;
      }

      await this.runCommand(`cd ${frontendPath} && npx wagmi generate`);
      this.logSuccess("Frontend ABIs regenerated");
      this.completeStep();
    } catch (error: any) {
      this.logWarning(`Could not regenerate frontend ABIs: ${error.message}`);
      this.completeStep();
    }
  }

  private showDeploymentSummary(): void {
    const duration = ((Date.now() - this.state.startTime) / 1000).toFixed(2);
    const avgTimePerStep = (parseFloat(duration) / this.state.completedSteps).toFixed(1);

    this.logSection("Deployment Summary");

    console.log("");
    this.log("📊 Statistics:", "bright");
    this.log(`   Total time: ${duration}s`, "cyan");
    this.log(`   Contracts deployed: ${this.state.results.length}`, "cyan");
    this.log(`   Steps completed: ${this.state.completedSteps}/${this.state.totalSteps}`, "cyan");
    this.log(`   Average time per step: ${avgTimePerStep}s`, "cyan");

    console.log("");
    this.log("📝 Deployed Contracts:", "bright");
    console.log("");

    for (const result of this.state.results) {
      this.log(`  ${result.contract}:`, "cyan");
      this.log(`    ${result.address}`, "green");
    }

    console.log("");
    this.logSuccess(`✨ Deployment completed successfully!`);
    this.logInfo(`Network: ${this.state.networkName}`);

    // Save deployment info to file
    this.saveDeploymentInfo();
  }

  private saveDeploymentInfo(): void {
    const outputPath = path.join(__dirname, "..", "deployments-summary.json");

    const summary = {
      network: this.state.networkName,
      timestamp: new Date().toISOString(),
      duration: ((Date.now() - this.state.startTime) / 1000).toFixed(2) + "s",
      contracts: this.state.results,
      config: this.state.config,
    };

    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    this.logInfo(`Deployment info saved to: deployments-summary.json`);
  }
}

// ========== CLI Entry Point ==========

async function main() {
  const args = process.argv.slice(2);

  // Parse network from args
  const networkIndex = args.findIndex(arg => arg === "--network");
  const networkName = networkIndex !== -1 ? args[networkIndex + 1] : "polkadotHubTestnet";

  if (!networkName) {
    console.error("❌ Network not specified. Use: --network <network-name>");
    process.exit(1);
  }

  // Check if clean flag is present
  const shouldClean = args.includes("--clean");

  const manager = new DeploymentManager(networkName);

  // Clean before deploy if requested
  if (shouldClean) {
    await manager.cleanBeforeDeploy();
  }

  await manager.deploy();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

