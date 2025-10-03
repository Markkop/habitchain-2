export const SetupTestnet = () => {
  const addPolkadotTestnetToWallet = async () => {
    // Check if MetaMask/wallet is available
    if (!window.ethereum) {
      alert(
        "No Ethereum wallet detected! Please install MetaMask or another Web3 wallet."
      );
      return;
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
      alert("✅ Polkadot Hub TestNet has been added to your wallet!");
    } catch (error: any) {
      console.error("Error adding network:", error);

      // Handle specific error cases
      if (error.code === 4001) {
        alert("❌ You rejected the request to add the network.");
      } else if (error.code === -32002) {
        alert("⏳ Please check your wallet - there may be a pending request.");
      } else {
        alert(`❌ Failed to add network: ${error.message}`);
      }
    }
  };

  return (
    <div>
      <button
        onClick={addPolkadotTestnetToWallet}
        className="card setup-testnet-button"
      >
        Setup Polkadot Hub TestNet
      </button>
    </div>
  );
};
