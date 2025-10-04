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
import { CopyButton } from "./components/CopyButton";
import { ExternalLink } from "lucide-react";
import { ThemeCustomizer } from "./components/ThemeCustomizer";

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
      <Toaster
        position="top-right"
        richColors
        expand={false}
        closeButton={true}
        duration={5000}
      />

      {/* Wallet and Network bar - compact, above title */}
      <div className="wallet-network-bar">
        <div className="wallet-network-left">
          <div className="wallet-network-item">
            <span className="wallet-network-label">Wallet:</span>
            <span className="wallet-network-value">
              {isConnected && address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not Connected"}
            </span>
            {isConnected && address && (
              <CopyButton
                textToCopy={address}
                label="Wallet address"
                size={11}
              />
            )}
          </div>
          <div className="wallet-network-divider">•</div>
          <div className="wallet-network-item">
            <span className="wallet-network-label">Network:</span>
            <span className="wallet-network-value">
              {chainId === passetHub.id ? "Passet Hub" : `Chain ${chainId}`}
            </span>
          </div>
          {chainId === passetHub.id &&
            habitTrackerAddress[
              chainId as keyof typeof habitTrackerAddress
            ] && (
              <>
                <div className="wallet-network-divider">•</div>
                <div className="wallet-network-item">
                  <span className="wallet-network-label">HabitTracker:</span>
                  <span className="wallet-network-value">
                    {`${habitTrackerAddress[chainId as keyof typeof habitTrackerAddress].slice(0, 6)}...${habitTrackerAddress[chainId as keyof typeof habitTrackerAddress].slice(-4)}`}
                  </span>
                  <CopyButton
                    textToCopy={
                      habitTrackerAddress[
                        chainId as keyof typeof habitTrackerAddress
                      ]
                    }
                    label="Contract address"
                    size={11}
                  />
                  <a
                    href={`${passetHub.blockExplorers.default.url}/address/${habitTrackerAddress[chainId as keyof typeof habitTrackerAddress]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-btn-inline"
                    title="View on block explorer"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </>
            )}
        </div>

        {/* Compact action buttons on the right */}
        <div className="wallet-network-actions">
          {!isConnected ? (
            <>
              <button
                onClick={handleConnect}
                className="btn-compact btn-compact-primary"
                disabled={!providerReady || connectLoading || providerLoading}
              >
                {providerLoading
                  ? "Initializing..."
                  : connectLoading
                    ? "Connecting..."
                    : "Connect"}
              </button>
              <button onClick={handleSetupTestnet} className="btn-compact">
                Setup
              </button>
            </>
          ) : (
            <>
              <button onClick={handleFaucetClick} className="btn-compact">
                Get Tokens
              </button>
              <button
                onClick={() => {
                  console.log("🔌 Disconnecting wallet...");
                  disconnect();
                }}
                className="btn-compact"
                disabled={disconnectLoading}
              >
                {disconnectLoading ? "..." : "Disconnect"}
              </button>
              {chainId !== passetHub.id && (
                <button onClick={handleSetupTestnet} className="btn-compact">
                  Switch
                </button>
              )}
            </>
          )}
          <ThemeCustomizer inline />
        </div>
      </div>

      <div className="title-container">
        <img
          src="/habitchain-logo.png"
          alt="HabitChain Logo"
          className="title-logo"
        />
        <h1 className="title">HabitChain</h1>
      </div>

      {/* Main content - HabitTracker always visible */}
      <HabitTracker isConnected={isConnected} onConnect={handleConnect} />
    </div>
  );
}

export default App;
