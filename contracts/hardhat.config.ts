import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";

// Get private key from Hardhat vars (more secure than .env)
// Set with: npx hardhat vars set PRIVATE_KEY
let privateKey: string | undefined;
try {
  privateKey = vars.get("PRIVATE_KEY");
} catch (e) {
  console.warn(
    "⚠️  WARNING: PRIVATE_KEY not set in Hardhat vars. Run: npx hardhat vars set PRIVATE_KEY"
  );
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  resolc: {
    compilerSource: "npm",
    settings: {
      optimizer: {
        enabled: true,
        parameters: "z", // Size optimization
        fallbackOz: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      polkavm: true,
      // Uncomment to fork Polkadot Hub TestNet for local testing
      // forking: {
      //   url: "https://testnet-passet-hub-eth-rpc.polkadot.io"
      // },
    },
    localhost: {
      polkavm: true,
      url: "http://127.0.0.1:8545/",
    },

    // ========== TESTNETS ==========

    // Polkadot Hub TestNet (Paseo Asset Hub)
    passetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: privateKey ? [privateKey] : [],
      gasMultiplier: 2,
    },
    // Alternative name for the same network
    polkadotHubTestnet: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: privateKey ? [privateKey] : [],
      gasMultiplier: 2,
    },

    // Moonbase Alpha (Moonbeam Testnet)
    moonbaseAlpha: {
      polkavm: false, // Standard EVM, not PolkaVM
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: privateKey ? [privateKey] : [],
    },

    // ========== PRODUCTION ==========

    // Moonbeam (Polkadot EVM Parachain)
    moonbeam: {
      polkavm: false, // Standard EVM, not PolkaVM
      url: process.env.MOONBEAM_RPC || "https://moonbeam-rpc.dwellir.com",
      chainId: 1284,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
