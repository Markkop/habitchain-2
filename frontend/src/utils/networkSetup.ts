/**
 * Utility for handling network setup and switching
 */

export const setupPolkadotTestnet = async (): Promise<boolean> => {
  // Check if MetaMask/wallet is available
  if (!window.ethereum) {
    console.error(
      "No Ethereum wallet detected! Please install MetaMask or another Web3 wallet."
    );
    return false;
  }

  const chainConfig = {
    chainId: `0x${Number(420420422).toString(16)}`, // Convert to hex: 0x1911f0a6
    chainName: "Polkadot Hub TestNet",
    rpcUrls: ["https://testnet-passet-hub-eth-rpc.polkadot.io"],
    nativeCurrency: {
      name: "PAS",
      symbol: "PAS",
      decimals: 18,
    },
    blockExplorerUrls: [
      "https://blockscout-passet-hub.parity-testnet.parity.io/",
    ],
  };

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [chainConfig],
    });

    console.log("✅ Polkadot Hub TestNet added successfully!");
    return true;
  } catch (error: any) {
    console.error("Error adding network:", error);

    // Handle specific error cases
    if (error.code === 4001) {
      console.log("❌ User rejected the request to add the network.");
    } else if (error.code === -32002) {
      console.log("⏳ Pending request - check your wallet.");
    } else {
      console.error(`❌ Failed to add network: ${error.message}`);
    }
    return false;
  }
};

