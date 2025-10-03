import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  habitTrackerAddress,
  habitTrackerAbi,
  useReadHabitTrackerUserStates,
  useReadHabitTrackerEpochNow,
} from "../generated";
import { formatEther, parseEther } from "viem";

export function HabitTracker() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [depositAmount, setDepositAmount] = useState("");
  const [habitText, setHabitText] = useState("");
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);

  const contractAddress =
    habitTrackerAddress[chainId as keyof typeof habitTrackerAddress];

  // Read user state using the public mapping getter
  const { data: userStateRaw, refetch: refetchUserState, error: userStateError, isLoading: userStateLoading } =
    useReadHabitTrackerUserStates({
      address: contractAddress,
      chainId: chainId,
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!contractAddress,
      },
    });

  // Convert the tuple response to a more usable format
  const userState = userStateRaw ? {
    depositBalance: userStateRaw[0],
    blockedBalance: userStateRaw[1],
    claimableBalance: userStateRaw[2],
    activeHabitCount: userStateRaw[3],
  } : null;

  // For active habits, we'll fetch them individually when needed
  // For now, we just show the count from userState

  // Read current epoch
  const { data: currentEpoch } = useReadHabitTrackerEpochNow({
    address: contractAddress,
    chainId: chainId,
    query: {
      enabled: !!contractAddress,
    },
  });

  // Write contracts
  const {
    writeContract: deposit,
    data: depositHash,
    isPending: isDepositPending,
  } = useWriteContract();
  const {
    writeContract: createHabit,
    data: createHabitHash,
    isPending: isCreateHabitPending,
  } = useWriteContract();
  const {
    writeContract: prepareDay,
    data: prepareDayHash,
    isPending: isPrepareDayPending,
  } = useWriteContract();
  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();

  // Wait for transaction receipts
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  const { isSuccess: isCreateHabitSuccess } = useWaitForTransactionReceipt({
    hash: createHabitHash,
  });
  const { isSuccess: isPrepareDaySuccess } = useWaitForTransactionReceipt({
    hash: prepareDayHash,
  });
  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Refetch data after successful transactions
  useEffect(() => {
    if (
      isDepositSuccess ||
      isCreateHabitSuccess ||
      isPrepareDaySuccess ||
      isWithdrawSuccess
    ) {
      refetchUserState();
    }
  }, [
    isDepositSuccess,
    isCreateHabitSuccess,
    isPrepareDaySuccess,
    isWithdrawSuccess,
    refetchUserState,
  ]);

  // Handle deposit success - show notification and clear input
  useEffect(() => {
    if (isDepositSuccess) {
      setShowDepositSuccess(true);
      setDepositAmount("");
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowDepositSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess]);

  // Debug logging
  useEffect(() => {
    console.log('HabitTracker Debug:', {
      address,
      chainId,
      contractAddress,
      userStateLoading,
      userStateError: userStateError?.message,
      userState,
    });
  }, [address, chainId, contractAddress, userStateLoading, userStateError, userState]);

  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="card">
        <h2>⚠️ HabitTracker Contract Not Deployed</h2>
        <p>
          The HabitTracker contract is only deployed on Passet Hub (Chain ID: 420420422).
        </p>
        <p>
          Current network: Chain ID {chainId}
        </p>
        <p>
          Please switch to Passet Hub network to use this feature.
        </p>
      </div>
    );
  }

  const handleDeposit = () => {
    if (!depositAmount || !address) return;
    deposit({
      address: contractAddress,
      abi: habitTrackerAbi,
      functionName: "deposit",
      value: parseEther(depositAmount),
    });
  };

  const handleCreateHabit = () => {
    if (!habitText || !address) return;
    createHabit({
      address: contractAddress,
      abi: habitTrackerAbi,
      functionName: "createHabit",
      args: [habitText],
    });
    setHabitText("");
  };

  const handlePrepareDay = () => {
    if (!address || !currentEpoch) return;
    prepareDay({
      address: contractAddress,
      abi: habitTrackerAbi,
      functionName: "prepareDay",
      args: [currentEpoch],
    });
  };

  const handleWithdraw = (amount: string) => {
    if (!amount || !address) return;
    withdraw({
      address: contractAddress,
      abi: habitTrackerAbi,
      functionName: "withdraw",
      args: [parseEther(amount)],
    });
  };

  return (
    <div className="habit-tracker-container">
      <div className="showcase-message">
        <h2>🎯 HabitChain - Track Your Habits with Financial Commitment</h2>
        <p>
          Stake tokens daily for each habit. Check in to claim rewards, or lose
          your stake!
        </p>
      </div>

      {/* User Balances */}
      <div 
        className="card" 
        style={{ 
          marginBottom: "20px",
          backgroundColor: "#f0f9ff",
          border: "2px solid #0ea5e9",
          padding: "20px"
        }}
      >
        <h3 style={{ marginTop: 0 }}>💰 Your Balances</h3>
        
        {/* Error display */}
        {userStateError && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            backgroundColor: "#fee2e2",
            border: "2px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
          }}>
            <strong>Error loading balances:</strong> {userStateError.message}
          </div>
        )}

        {userStateLoading && !userState && (
          <div style={{ color: "#666", padding: "20px", textAlign: "center" }}>
            <div style={{ marginBottom: "10px" }}>Loading balances...</div>
            <div style={{ fontSize: "12px" }}>Chain ID: {chainId}</div>
            <div style={{ fontSize: "12px" }}>Contract: {contractAddress}</div>
            <div style={{ fontSize: "12px" }}>User: {address}</div>
          </div>
        )}

        {userState ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginTop: "15px"
          }}>
            <div style={{
              padding: "15px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #bae6fd",
            }}>
              <div style={{ fontSize: "14px", color: "#0369a1", fontWeight: "600" }}>
                Available to Stake
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0284c7", marginTop: "5px" }}>
                {formatEther(userState.depositBalance)} PAS
              </div>
            </div>
            <div style={{
              padding: "15px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #fed7aa",
            }}>
              <div style={{ fontSize: "14px", color: "#c2410c", fontWeight: "600" }}>
                Currently Staked
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ea580c", marginTop: "5px" }}>
                {formatEther(userState.blockedBalance)} PAS
              </div>
            </div>
            <div style={{
              padding: "15px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            }}>
              <div style={{ fontSize: "14px", color: "#15803d", fontWeight: "600" }}>
                Rewards
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a", marginTop: "5px" }}>
                {formatEther(userState.claimableBalance)} PAS
              </div>
            </div>
            <div style={{
              padding: "15px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e9d5ff",
            }}>
              <div style={{ fontSize: "14px", color: "#7c3aed", fontWeight: "600" }}>
                Active Habits
              </div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#8b5cf6", marginTop: "5px" }}>
                {userState.activeHabitCount.toString()}
              </div>
            </div>
          </div>
        ) : !userStateLoading && !userStateError ? (
          <div style={{ color: "#666", padding: "20px", textAlign: "center" }}>
            No balance data available. Make sure you're connected to the correct network.
          </div>
        ) : null}
      </div>

      {/* Deposit Section */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h3>💵 Deposit Funds</h3>
        
        {/* Success notification */}
        {showDepositSuccess && (
          <div style={{
            padding: "12px",
            marginBottom: "15px",
            backgroundColor: "#d1fae5",
            border: "2px solid #10b981",
            borderRadius: "8px",
            color: "#065f46",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <div>Deposit successful!</div>
              <div style={{ fontSize: "12px", fontWeight: "normal", marginTop: "2px" }}>
                Your balance has been updated above.
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Amount in PAS"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            disabled={isDepositPending}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              flex: 1,
            }}
          />
          <button
            onClick={handleDeposit}
            disabled={isDepositPending || !depositAmount}
            className="card"
            style={{
              backgroundColor: isDepositPending ? "#ccc" : "#0070f3",
              color: "white",
              cursor: isDepositPending || !depositAmount ? "not-allowed" : "pointer",
            }}
          >
            {isDepositPending ? "Depositing..." : "Deposit"}
          </button>
        </div>
        {userState && userState.depositBalance > 0n && (
          <button
            onClick={() =>
              handleWithdraw(formatEther(userState.depositBalance))
            }
            disabled={isWithdrawPending}
            className="card"
            style={{
              marginTop: "10px",
              backgroundColor: isWithdrawPending ? "#ccc" : "#ff6b35",
              color: "white",
            }}
          >
            {isWithdrawPending ? "Withdrawing..." : "Withdraw All"}
          </button>
        )}
      </div>

      {/* Create Habit Section */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h3>✨ Create New Habit</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Habit description (3-100 chars)"
            value={habitText}
            onChange={(e) => setHabitText(e.target.value)}
            disabled={isCreateHabitPending}
            maxLength={100}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              flex: 1,
            }}
          />
          <button
            onClick={handleCreateHabit}
            disabled={
              isCreateHabitPending || !habitText || habitText.length < 3
            }
            className="card"
            style={{
              backgroundColor:
                isCreateHabitPending || !habitText || habitText.length < 3
                  ? "#ccc"
                  : "#10b981",
              color: "white",
              cursor:
                isCreateHabitPending || !habitText || habitText.length < 3
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isCreateHabitPending ? "Creating..." : "Create Habit"}
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          💡 Each habit costs 10 PAS per day to maintain
        </p>
      </div>

      {/* Prepare Day Section */}
      {userState && userState.activeHabitCount > 0 && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3>🌅 Prepare Today</h3>
          <p style={{ fontSize: "14px", marginBottom: "10px" }}>
            Lock funds for today's habits (Epoch: {currentEpoch?.toString()})
          </p>
          <button
            onClick={handlePrepareDay}
            disabled={isPrepareDayPending}
            className="card"
            style={{
              backgroundColor: isPrepareDayPending ? "#ccc" : "#8b5cf6",
              color: "white",
            }}
          >
            {isPrepareDayPending ? "Preparing..." : "Prepare Day"}
          </button>
        </div>
      )}

      {/* Active Habits Info */}
      <div className="card">
        <h3>📋 Your Active Habits</h3>
        {userState && userState.activeHabitCount > 0 ? (
          <div>
            <p style={{ color: "#666" }}>
              You have <strong>{userState.activeHabitCount.toString()}</strong> active habit(s).
            </p>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
              💡 Use "Prepare Day" above to lock funds for today, then check in to each habit to avoid losing your stake!
            </p>
          </div>
        ) : (
          <p style={{ color: "#666" }}>No active habits yet. Create one above!</p>
        )}
      </div>
    </div>
  );
}

