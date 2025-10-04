/**
 * Deployment Configuration
 * Central configuration for all contract deployments across networks
 */

export interface NetworkConfig {
  // HabitTracker config
  treasuryAddress?: string; // Defaults to deployer if not set
  initialStakingAdapter?: string; // Address(0) if not deploying MockStakingRewards

  // MockStakingRewards config
  deployMockStaking?: boolean;
  mockStakingRatePerSecond?: string; // Reward rate (default: 3.5e15)
  mockStakingFundAmount?: string; // Initial funding (default: 1 PAS)

  // HabitSettler config
  deploySettler?: boolean;

  // MoonwellAdapter config (Moonbeam only)
  deployMoonwellAdapter?: boolean;
  mTokenAddress?: string;
  comptrollerAddress?: string;

  // Deployment options
  autoUpdateStakingAdapter?: boolean; // Update HabitTracker with deployed adapter
  confirmBeforeDeploy?: boolean; // Prompt for confirmation
  verifyContracts?: boolean; // Verify on block explorer
  waitBetweenDeployments?: number; // Seconds to wait between deployments (default: 20)
  deploymentRetries?: number; // Number of retries for failed deployments (default: 3)
}

export const deploymentConfig: Record<string, NetworkConfig> = {
  // ========== TESTNETS ==========

  polkadotHubTestnet: {
    // Treasury defaults to deployer
    deployMockStaking: true,
    mockStakingRatePerSecond: "35000000000000", // 3.5e13 - 100x slower, more realistic
    mockStakingFundAmount: "1000000000000000000", // 1 PAS
    deploySettler: true,
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: false, // Auto-confirm for CI/CD
    verifyContracts: false, // Explorer verification not available yet
    waitBetweenDeployments: 20, // Wait 20s between deployments for confirmations
    deploymentRetries: 3, // Retry up to 3 times on IGN403 errors
  },

  passetHub: {
    // Same as polkadotHubTestnet (alias)
    deployMockStaking: true,
    mockStakingRatePerSecond: "35000000000000",
    mockStakingFundAmount: "1000000000000000000",
    deploySettler: true,
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: false,
    verifyContracts: false,
    waitBetweenDeployments: 20,
    deploymentRetries: 3,
  },

  moonbaseAlpha: {
    // Moonbeam testnet - can use real Moonwell
    deployMockStaking: false, // Optional: use MoonwellAdapter instead
    deploySettler: true,
    deployMoonwellAdapter: false, // Set to true if Moonwell is available
    // mTokenAddress: "0x...", // mGLMR on Moonbase
    // comptrollerAddress: "0x...", // Comptroller on Moonbase
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: true,
    verifyContracts: true,
  },

  // ========== PRODUCTION ==========

  moonbeam: {
    // Production Moonbeam - use real Moonwell
    deployMockStaking: false,
    deploySettler: true,
    deployMoonwellAdapter: true,
    // Production Moonwell addresses (update with real addresses)
    mTokenAddress: "0x091608f4e4a15335145be0A279483C0f8E4c7955", // mGLMR
    comptrollerAddress: "0x8E00D5e02E65A19337Cdba98bbA9F84d4186a180", // Comptroller
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: true, // Always confirm on production
    verifyContracts: true,
  },

  localhost: {
    // Local development
    deployMockStaking: true,
    mockStakingRatePerSecond: "35000000000000",
    mockStakingFundAmount: "1000000000000000000",
    deploySettler: true,
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: false,
    verifyContracts: false,
  },

  hardhat: {
    // Hardhat network
    deployMockStaking: true,
    mockStakingRatePerSecond: "35000000000000",
    mockStakingFundAmount: "1000000000000000000",
    deploySettler: true,
    autoUpdateStakingAdapter: true,
    confirmBeforeDeploy: false,
    verifyContracts: false,
  },
};

/**
 * Get deployment config for a network
 * Falls back to sensible defaults if network not configured
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = deploymentConfig[networkName];

  if (!config) {
    console.warn(`⚠️  No config found for network: ${networkName}, using defaults`);
    return {
      deployMockStaking: true,
      mockStakingRatePerSecond: "35000000000000",
      mockStakingFundAmount: "1000000000000000000",
      deploySettler: true,
      autoUpdateStakingAdapter: true,
      confirmBeforeDeploy: true,
      verifyContracts: false,
    };
  }

  return config;
}

/**
 * Override config with environment variables
 */
export function applyEnvOverrides(config: NetworkConfig): NetworkConfig {
  return {
    ...config,
    treasuryAddress: process.env.TREASURY_ADDRESS || config.treasuryAddress,
    mockStakingRatePerSecond: process.env.MOCK_RATE_PER_SECOND || config.mockStakingRatePerSecond,
    deployMockStaking: process.env.DEPLOY_MOCK_STAKING === "false" ? false : config.deployMockStaking,
    deploySettler: process.env.DEPLOY_SETTLER === "false" ? false : config.deploySettler,
    autoUpdateStakingAdapter: process.env.AUTO_UPDATE_ADAPTER === "false" ? false : config.autoUpdateStakingAdapter,
    confirmBeforeDeploy: process.env.CONFIRM_DEPLOY === "true" ? true : config.confirmBeforeDeploy,
  };
}

