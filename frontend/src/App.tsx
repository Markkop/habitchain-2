import "./App.css";
import {
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3Auth,
} from "@web3auth/modal/react";
import { useAccount, useChainId } from "wagmi";
import { HabitTracker } from "./components/HabitTracker";
import { passetHub } from "./wagmi-config";
import { habitTrackerAddress } from "./generated";
import { logConnection } from "./utils/logger";
import { setupPolkadotTestnet } from "./utils/networkSetup";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";

function App() {
  const {
    connect,
    isConnected,
    loading: connectLoading,
  } = useWeb3AuthConnect();
  const { disconnect, loading: disconnectLoading } = useWeb3AuthDisconnect();
  const { web3Auth } = useWeb3Auth();
  const { address } = useAccount();
  const chainId = useChainId();

  // Provider readiness states
  const [providerReady, setProviderReady] = useState(false);
  const [providerLoading, setProviderLoading] = useState(true);

  // Track Web3Auth provider initialization
  useEffect(() => {
    const checkProviderStatus = () => {
      if (web3Auth) {
        try {
          const isInitialized = web3Auth.status === "ready";
          const isNotConnecting = !connectLoading;
          const canLogin = isInitialized && isNotConnecting;

          setProviderReady(canLogin);
          setProviderLoading(web3Auth.status !== "ready");

          if (canLogin) {
            return true;
          }
        } catch (error) {
          console.error("Error checking Web3Auth status:", error);
          setProviderReady(false);
          setProviderLoading(true);
        }
      } else {
        setProviderReady(false);
        setProviderLoading(true);
      }
      return false;
    };

    if (checkProviderStatus()) {
      return;
    }

    const interval = setInterval(() => {
      if (checkProviderStatus()) {
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.warn("Web3Auth initialization timeout");
      setProviderLoading(false);
      setProviderReady(false);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [web3Auth, connectLoading]);

  // Log connection status on page load and wallet connect/disconnect
  useEffect(() => {
    const contractAddress =
      habitTrackerAddress[chainId as keyof typeof habitTrackerAddress];
    logConnection(address, chainId, contractAddress);
  }, [address, chainId, isConnected]);

  const getFaucetUrl = (chainId: number, address: string) => {
    const faucetUrls = {
      [passetHub.id]: `https://faucet.polkadot.io/?parachain=1111&address=${address}`,
    };
    return faucetUrls[chainId as keyof typeof faucetUrls];
  };

  const handleConnect = () => {
    if (
      web3Auth &&
      web3Auth.status === "ready" &&
      !connectLoading &&
      !isConnected
    ) {
      console.log("🔌 Connecting wallet...");
      connect();
    }
  };

  const handleFaucetClick = () => {
    if (!address) return;
    const faucetUrl = getFaucetUrl(chainId, address);
    if (faucetUrl) {
      window.open(faucetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSetupTestnet = async () => {
    const success = await setupPolkadotTestnet();

    // After successful network setup/switch, trigger wallet connection
    if (success && !isConnected) {
      console.log("🔗 Network setup successful, connecting wallet...");
      // Small delay to ensure network is ready
      setTimeout(() => {
        handleConnect();
      }, 500);
    }
  };

  return (
    <div className="container">
      <Toaster position="top-right" richColors expand={false} />
      <h1 className="title">HabitChain</h1>

      {/* Stats bar at the top */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Wallet</span>
          <span className="stat-value">
            {isConnected && address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not Connected"}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Network</span>
          <span className="stat-value">
            {chainId === passetHub.id ? "Passet Hub" : `Chain ${chainId}`}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        {!isConnected ? (
          <>
            <button
              onClick={handleConnect}
              className="btn-primary"
              disabled={!providerReady || connectLoading || providerLoading}
            >
              {providerLoading
                ? "Initializing..."
                : connectLoading
                  ? "Connecting..."
                  : "Connect Wallet"}
            </button>
            <button onClick={handleSetupTestnet} className="btn-secondary">
              Setup Wallet Testnet
            </button>
          </>
        ) : (
          <>
            <button onClick={handleFaucetClick} className="btn-secondary">
              Get Test Tokens
            </button>
            <button
              onClick={() => {
                console.log("🔌 Disconnecting wallet...");
                disconnect();
              }}
              className="btn-secondary"
              disabled={disconnectLoading}
            >
              {disconnectLoading ? "Disconnecting..." : "Disconnect"}
            </button>
            {chainId !== passetHub.id && (
              <button onClick={handleSetupTestnet} className="btn-secondary">
                Switch to Testnet
              </button>
            )}
          </>
        )}
      </div>

      {/* Main content - HabitTracker always visible */}
      <HabitTracker isConnected={isConnected} onConnect={handleConnect} />
    </div>
  );
}

export default App;
