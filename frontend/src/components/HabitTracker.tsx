import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useConfig,
} from "wagmi";
import {
  habitTrackerAddress,
  habitTrackerAbi,
  useReadHabitTrackerUserStates,
  useReadHabitTrackerEpochNow,
  useReadHabitTrackerUserHabitCounters,
} from "../generated";
import { formatEther, parseEther, stringToHex, hexToString } from "viem";
import { readContract } from "wagmi/actions";

type Habit = {
  id: number;
  owner: string;
  text: string;
  createdAtEpoch: bigint;
  archived: boolean;
};

type DailyStatus = {
  funded: boolean;
  checked: boolean;
  settled: boolean;
};

// Utility functions for bytes32 text conversion
const textToBytes32 = (text: string): `0x${string}` => {
  // Trim to 32 characters max
  const trimmed = text.slice(0, 32);
  return stringToHex(trimmed, { size: 32 });
};

const bytes32ToText = (bytes32: string): string => {
  try {
    // Remove null bytes and decode
    return hexToString(bytes32 as `0x${string}`, { size: 32 }).replace(
      /\0/g,
      ""
    );
  } catch {
    return "";
  }
};

export function HabitTracker() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const [depositAmount, setDepositAmount] = useState("");
  const [habitText, setHabitText] = useState("");
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);
  const [prepareDayMessage, setPrepareDayMessage] = useState("");
  const [settleMessage, setSettleMessage] = useState("");
  const [settledEventReceived, setSettledEventReceived] = useState(false);
  const [habits, setHabits] = useState<Record<number, Habit>>({});
  const [habitStatuses, setHabitStatuses] = useState<
    Record<number, DailyStatus>
  >({});

  const contractAddress =
    habitTrackerAddress[chainId as keyof typeof habitTrackerAddress];

  // Read user state using the public mapping getter
  const {
    data: userStateRaw,
    refetch: refetchUserState,
    error: userStateError,
    isLoading: userStateLoading,
  } = useReadHabitTrackerUserStates({
    chainId: chainId as keyof typeof habitTrackerAddress,
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Convert the tuple response to a more usable format
  const userState = userStateRaw
    ? {
        depositBalance: userStateRaw[0],
        blockedBalance: userStateRaw[1],
        claimableBalance: userStateRaw[2],
        activeHabitCount: userStateRaw[3],
      }
    : null;

  // Read habit counter
  const { data: habitCounter, refetch: refetchHabitCounter } =
    useReadHabitTrackerUserHabitCounters({
      chainId: chainId as keyof typeof habitTrackerAddress,
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!contractAddress,
      },
    });

  // Read current epoch
  const { data: currentEpoch, refetch: refetchEpoch } =
    useReadHabitTrackerEpochNow({
      chainId: chainId as keyof typeof habitTrackerAddress,
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
  const {
    writeContract: checkIn,
    data: checkInHash,
    isPending: isCheckInPending,
  } = useWriteContract();
  const {
    writeContract: settleAll,
    data: settleAllHash,
    isPending: isSettleAllPending,
    error: settleError,
  } = useWriteContract();
  const {
    writeContract: forceSettleDay,
    data: forceSettleDayHash,
    isPending: isForceSettleDayPending,
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
  const { isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt({
    hash: checkInHash,
  });
  const { isSuccess: isSettleAllSuccess, isLoading: isSettleAllConfirming } =
    useWaitForTransactionReceipt({
      hash: settleAllHash,
    });
  const { isSuccess: isForceSettleDaySuccess } = useWaitForTransactionReceipt({
    hash: forceSettleDayHash,
  });

  // Fetch individual habits using the wagmi client
  useEffect(() => {
    const fetchHabits = async () => {
      if (!address || !contractAddress || !habitCounter || !config) return;

      const count = Number(habitCounter);
      const newHabits: Record<number, Habit> = {};
      const newStatuses: Record<number, DailyStatus> = {};

      for (let i = 1; i <= count; i++) {
        try {
          // Fetch habit using the public mapping getter (not getHabit, but habits)
          const habitData: any = await readContract(config, {
            address: contractAddress,
            abi: habitTrackerAbi,
            functionName: "habits",
            args: [address, i],
          });

          if (
            habitData &&
            habitData[1] !== "0x0000000000000000000000000000000000000000"
          ) {
            newHabits[i] = {
              id: Number(habitData[0]),
              owner: habitData[1] as string,
              text: bytes32ToText(habitData[2] as string),
              createdAtEpoch: habitData[3] as bigint,
              archived: habitData[4] as boolean,
            };

            // Fetch daily status if we have current epoch
            if (currentEpoch && !habitData[4]) {
              // Only for non-archived habits
              const statusData: any = await readContract(config, {
                address: contractAddress,
                abi: habitTrackerAbi,
                functionName: "dailyStatuses",
                args: [address, currentEpoch, i],
              });

              if (statusData !== undefined) {
                const flags = Number(statusData);
                newStatuses[i] = {
                  funded: (flags & 1) !== 0, // bit 0
                  checked: (flags & 2) !== 0, // bit 1
                  settled: (flags & 4) !== 0, // bit 2
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching habit ${i}:`, error);
        }
      }

      setHabits(newHabits);
      setHabitStatuses(newStatuses);
    };

    fetchHabits();
  }, [address, contractAddress, habitCounter, currentEpoch, config]);

  // Watch for DayPrepared event
  useWatchContractEvent({
    address: contractAddress,
    abi: habitTrackerAbi,
    eventName: "DayPrepared",
    chainId: chainId as keyof typeof habitTrackerAddress,
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
          const fundedCount = Number(log.args.fundedCount || 0);
          const insufficientCount = Number(log.args.insufficientCount || 0);

          if (fundedCount === 0 && insufficientCount === 0) {
            setPrepareDayMessage(
              "⚠️ No habits were prepared. They may already be prepared for today!"
            );
          } else if (fundedCount > 0 && insufficientCount === 0) {
            setPrepareDayMessage(
              `✅ Successfully prepared ${fundedCount} habit(s)!`
            );
          } else if (fundedCount > 0 && insufficientCount > 0) {
            setPrepareDayMessage(
              `⚠️ Prepared ${fundedCount} habit(s), but ${insufficientCount} had insufficient balance.`
            );
          } else {
            setPrepareDayMessage(
              `❌ Failed to prepare ${insufficientCount} habit(s) - insufficient balance!`
            );
          }

          // Hide message after 8 seconds
          setTimeout(() => setPrepareDayMessage(""), 8000);

          // Refetch data
          refetchUserState();
          refetchHabitCounter();
          refetchEpoch();
        }
      });
    },
  });

  // Watch for SettledSuccess event
  useWatchContractEvent({
    address: contractAddress,
    abi: habitTrackerAbi,
    eventName: "SettledSuccess",
    chainId: chainId as keyof typeof habitTrackerAddress,
    onLogs(logs) {
      const userSuccesses = logs.filter(
        (log) => log.args.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userSuccesses.length > 0) {
        setSettledEventReceived(true);
        const totalReward = userSuccesses.reduce(
          (sum, log) => sum + Number(log.args.reward || 0n),
          0
        );
        setSettleMessage(
          `✅ Successfully settled ${userSuccesses.length} habit(s)! ${formatEther(BigInt(totalReward))} PAS moved to claimable balance.`
        );
        setTimeout(() => {
          setSettleMessage("");
          setSettledEventReceived(false);
        }, 10000);
        refetchUserState();
      }
    },
  });

  // Watch for SettledFail event
  useWatchContractEvent({
    address: contractAddress,
    abi: habitTrackerAbi,
    eventName: "SettledFail",
    chainId: chainId as keyof typeof habitTrackerAddress,
    onLogs(logs) {
      const userFailures = logs.filter(
        (log) => log.args.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userFailures.length > 0) {
        setSettledEventReceived(true);
        const totalSlashed = userFailures.reduce(
          (sum, log) => sum + Number(log.args.slashed || 0n),
          0
        );
        setSettleMessage(
          `⚠️ Settled ${userFailures.length} habit(s) - ${formatEther(BigInt(totalSlashed))} PAS forfeited for missed check-ins.`
        );
        setTimeout(() => {
          setSettleMessage("");
          setSettledEventReceived(false);
        }, 10000);
        refetchUserState();
      }
    },
  });

  // Detect when settlement transaction completes but no events were emitted
  useEffect(() => {
    if (isSettleAllSuccess && !settledEventReceived) {
      // Transaction succeeded but no SettledSuccess or SettledFail events
      // This means no habits were settled (already settled or not funded for that epoch)
      setTimeout(() => {
        setSettleMessage(
          "⚠️ Transaction completed, but no habits were settled. They may already be settled, or weren't funded for that epoch."
        );
        setTimeout(() => setSettleMessage(""), 10000);
      }, 2000); // Wait 2 seconds for events to arrive
    }
  }, [isSettleAllSuccess, settledEventReceived]);

  // Show confirming message
  useEffect(() => {
    if (isSettleAllConfirming) {
      setSettleMessage("⏳ Transaction submitted, waiting for confirmation...");
    }
  }, [isSettleAllConfirming]);

  // Refetch data after successful transactions
  useEffect(() => {
    if (
      isDepositSuccess ||
      isCreateHabitSuccess ||
      isPrepareDaySuccess ||
      isWithdrawSuccess ||
      isCheckInSuccess ||
      isSettleAllSuccess
    ) {
      refetchUserState();
      refetchHabitCounter();
      refetchEpoch();
    }
  }, [
    isDepositSuccess,
    isCreateHabitSuccess,
    isPrepareDaySuccess,
    isWithdrawSuccess,
    isCheckInSuccess,
    isSettleAllSuccess,
    refetchUserState,
    refetchHabitCounter,
    refetchEpoch,
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
    console.log("HabitTracker Debug:", {
      address,
      chainId,
      contractAddress,
      userStateLoading,
      userStateError: userStateError?.message,
      userState,
    });
  }, [
    address,
    chainId,
    contractAddress,
    userStateLoading,
    userStateError,
    userState,
  ]);

  if (!contractAddress) {
    return (
      <div className="card">
        <h2>⚠️ HabitTracker Contract Not Deployed</h2>
        <p>
          The HabitTracker contract is only deployed on Passet Hub (Chain ID:
          420420422).
        </p>
        <p>Current network: Chain ID {chainId}</p>
        <p>Please switch to Passet Hub network to use this feature.</p>
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
      args: [textToBytes32(habitText)],
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

  const handleCheckIn = (habitId: number) => {
    if (!address || !currentEpoch) return;
    checkIn({
      address: contractAddress,
      abi: habitTrackerAbi,
      functionName: "checkIn",
      args: [habitId, currentEpoch],
    });
  };

  const handleSettleDay = () => {
    if (!address || !currentEpoch) return;

    // Settle yesterday (current epoch - 1)
    const yesterdayEpoch = Number(currentEpoch) - 1;

    if (yesterdayEpoch < 0) {
      setSettleMessage("❌ No previous day to settle!");
      setTimeout(() => setSettleMessage(""), 5000);
      return;
    }

    setSettleMessage("⏳ Submitting settlement transaction...");

    // Settle up to 50 habits (max batch size from contract)
    settleAll(
      {
        address: contractAddress,
        abi: habitTrackerAbi,
        functionName: "settleAll",
        args: [address, BigInt(yesterdayEpoch), 50],
      },
      {
        onError: (error: any) => {
          console.error("Settle error:", error);

          if (error.message?.includes("CannotSettleCurrentDay")) {
            setSettleMessage(
              "❌ Cannot settle the current day. Wait until tomorrow!"
            );
          } else if (
            error.message?.includes("User rejected") ||
            error.message?.includes("User denied")
          ) {
            setSettleMessage("❌ Transaction was rejected");
          } else {
            setSettleMessage(
              `❌ Settlement failed: ${error.shortMessage || error.message || "Unknown error"}`
            );
          }
          setTimeout(() => setSettleMessage(""), 8000);
        },
      }
    );
  };

  const handleForceSettleDay = () => {
    if (!address || !currentEpoch) return;

    // Force settle TODAY's epoch (for testing)
    const todayEpoch = Number(currentEpoch);

    setSettleMessage(
      `⚖️ Force settling TODAY (Epoch ${todayEpoch})... (bypassing all checks)`
    );

    // Use forceSettleDay which bypasses the epoch validation
    forceSettleDay(
      {
        address: contractAddress,
        abi: habitTrackerAbi,
        functionName: "forceSettleDay",
        args: [address, BigInt(todayEpoch), 50],
      },
      {
        onError: (error: any) => {
          console.error("Force settle error:", error);

          if (error.message?.includes("CannotSettleCurrentDay")) {
            setSettleMessage(
              `❌ Epoch ${todayEpoch} cannot be settled (contract validation failed)`
            );
          } else if (
            error.message?.includes("User rejected") ||
            error.message?.includes("User denied")
          ) {
            setSettleMessage("❌ Transaction was rejected");
          } else {
            // Show the full error for debugging
            const errorMsg =
              error.shortMessage || error.message || "Unknown error";
            setSettleMessage(`❌ Force settle failed: ${errorMsg}`);
            console.log("Full error:", error);
          }
          setTimeout(() => setSettleMessage(""), 10000);
        },
      }
    );
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
          padding: "20px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>💰 Your Balances</h3>

        {/* Error display */}
        {userStateError && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              backgroundColor: "#fee2e2",
              border: "2px solid #ef4444",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            <div
              style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #bae6fd",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#0369a1",
                  fontWeight: "600",
                }}
              >
                Available to Stake
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#0284c7",
                  marginTop: "5px",
                }}
              >
                {formatEther(userState.depositBalance)} PAS
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #fed7aa",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#c2410c",
                  fontWeight: "600",
                }}
              >
                Currently Staked
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#ea580c",
                  marginTop: "5px",
                }}
              >
                {formatEther(userState.blockedBalance)} PAS
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#15803d",
                  fontWeight: "600",
                }}
              >
                Rewards
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#16a34a",
                  marginTop: "5px",
                }}
              >
                {formatEther(userState.claimableBalance)} PAS
              </div>
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #e9d5ff",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#7c3aed",
                  fontWeight: "600",
                }}
              >
                Active Habits
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                  marginTop: "5px",
                }}
              >
                {userState.activeHabitCount.toString()}
              </div>
            </div>
          </div>
        ) : !userStateLoading && !userStateError ? (
          <div style={{ color: "#666", padding: "20px", textAlign: "center" }}>
            No balance data available. Make sure you're connected to the correct
            network.
          </div>
        ) : null}
      </div>

      {/* Deposit Section */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h3>💵 Deposit Funds</h3>

        {/* Success notification */}
        {showDepositSuccess && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              backgroundColor: "#d1fae5",
              border: "2px solid #10b981",
              borderRadius: "8px",
              color: "#065f46",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>✅</span>
            <div>
              <div>Deposit successful!</div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "normal",
                  marginTop: "2px",
                }}
              >
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
              cursor:
                isDepositPending || !depositAmount ? "not-allowed" : "pointer",
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
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Habit description (max 32 chars)"
              value={habitText}
              onChange={(e) => setHabitText(e.target.value)}
              disabled={isCreateHabitPending}
              maxLength={32}
              style={{
                padding: "8px",
                paddingRight: "45px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                width: "100%",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: habitText.length >= 30 ? "#ef4444" : "#666",
              }}
            >
              {habitText.length}/32
            </span>
          </div>
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

          {/* Prepare Day Message */}
          {prepareDayMessage && (
            <div
              style={{
                padding: "12px",
                marginBottom: "15px",
                backgroundColor: prepareDayMessage.includes("✅")
                  ? "#d1fae5"
                  : prepareDayMessage.includes("⚠️")
                    ? "#fef3c7"
                    : "#fee2e2",
                border: `2px solid ${
                  prepareDayMessage.includes("✅")
                    ? "#10b981"
                    : prepareDayMessage.includes("⚠️")
                      ? "#f59e0b"
                      : "#ef4444"
                }`,
                borderRadius: "8px",
                color: prepareDayMessage.includes("✅")
                  ? "#065f46"
                  : prepareDayMessage.includes("⚠️")
                    ? "#92400e"
                    : "#991b1b",
                fontWeight: "600",
              }}
            >
              {prepareDayMessage}
            </div>
          )}

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

      {/* Settle Day Section */}
      {userState && userState.activeHabitCount > 0 && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3>⚖️ Settle Previous Days</h3>
          <p style={{ fontSize: "14px", marginBottom: "10px" }}>
            Settle your habits from past days to claim rewards or accept losses
          </p>

          {/* Info box */}
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              backgroundColor: "#eff6ff",
              border: "1px solid #3b82f6",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#1e40af",
                marginBottom: "5px",
              }}
            >
              💡 How Settlement Works:
            </div>
            <ul
              style={{ margin: "5px 0", paddingLeft: "20px", color: "#1e3a8a" }}
            >
              <li>
                You can only settle <strong>past epochs</strong> (not today)
              </li>
              <li>
                You must have <strong>prepared</strong> the day first (locked
                funds)
              </li>
              <li>
                <strong>Checked in?</strong> → Stake moves to claimable rewards
              </li>
              <li>
                <strong>Missed check-in?</strong> → Stake is forfeited
              </li>
            </ul>
          </div>

          {/* Settle Message */}
          {settleMessage && (
            <div
              style={{
                padding: "12px",
                marginBottom: "15px",
                backgroundColor: settleMessage.includes("✅")
                  ? "#d1fae5"
                  : settleMessage.includes("⚠️")
                    ? "#fef3c7"
                    : "#fee2e2",
                border: `2px solid ${
                  settleMessage.includes("✅")
                    ? "#10b981"
                    : settleMessage.includes("⚠️")
                      ? "#f59e0b"
                      : "#ef4444"
                }`,
                borderRadius: "8px",
                color: settleMessage.includes("✅")
                  ? "#065f46"
                  : settleMessage.includes("⚠️")
                    ? "#92400e"
                    : "#991b1b",
                fontWeight: "600",
              }}
            >
              {settleMessage}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Settle Yesterday */}
            <div>
              <button
                onClick={handleSettleDay}
                disabled={isSettleAllPending}
                className="card"
                style={{
                  width: "100%",
                  backgroundColor: isSettleAllPending ? "#ccc" : "#f59e0b",
                  color: "white",
                }}
              >
                {isSettleAllPending
                  ? "Settling..."
                  : `⚖️ Settle Yesterday (Epoch ${currentEpoch ? Number(currentEpoch) - 1 : "?"})`}
              </button>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                Settles all funded habits from yesterday. You must have prepared
                and (optionally) checked in yesterday.
              </p>
            </div>

            {/* Force Settle Today (Testing) */}
            <div
              style={{
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                🔧 Force Settle (Testing)
              </label>
              <button
                onClick={handleForceSettleDay}
                disabled={isForceSettleDayPending}
                className="card"
                style={{
                  width: "100%",
                  backgroundColor: isForceSettleDayPending ? "#ccc" : "#ef4444",
                  color: "white",
                  cursor: isForceSettleDayPending ? "not-allowed" : "pointer",
                }}
              >
                {isForceSettleDayPending
                  ? "Force Settling..."
                  : `🔧 Force Settle Today (Epoch ${currentEpoch ? Number(currentEpoch) : "?"})`}
              </button>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                ⚠️ Testing only: Bypasses ALL validation including epoch checks.
                Settles today's funded habits immediately for testing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Habits List */}
      <div className="card">
        <h3>📋 Your Habits</h3>
        {Object.keys(habits).length > 0 ? (
          <div style={{ marginTop: "15px" }}>
            {Object.values(habits).map((habit) => {
              if (habit.archived) return null;

              const status = habitStatuses[habit.id];
              const hasStatus = !!status;

              return (
                <div
                  key={habit.id}
                  style={{
                    padding: "15px",
                    marginBottom: "10px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    border: `2px solid ${hasStatus && status.funded ? "#10b981" : "#e5e7eb"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "16px",
                          marginBottom: "5px",
                        }}
                      >
                        {habit.text}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        ID: {habit.id} | Created: Epoch{" "}
                        {habit.createdAtEpoch.toString()}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexWrap: "wrap",
                        marginLeft: "10px",
                      }}
                    >
                      {hasStatus && status.funded && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
                          }}
                        >
                          ✓ Funded
                        </span>
                      )}
                      {hasStatus && !status.funded && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                          }}
                        >
                          ✗ Not Funded
                        </span>
                      )}
                      {hasStatus && status.checked && (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                          }}
                        >
                          ✓ Checked In
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Check-in button */}
                  {hasStatus && status.funded && !status.checked && (
                    <div style={{ marginTop: "10px" }}>
                      <button
                        onClick={() => handleCheckIn(habit.id)}
                        disabled={isCheckInPending}
                        className="card"
                        style={{
                          width: "100%",
                          padding: "10px",
                          backgroundColor: isCheckInPending
                            ? "#ccc"
                            : "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: isCheckInPending ? "not-allowed" : "pointer",
                        }}
                      >
                        {isCheckInPending ? "Checking In..." : "✓ Check In Now"}
                      </button>
                    </div>
                  )}

                  {/* Already checked in message */}
                  {hasStatus && status.checked && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "8px",
                        backgroundColor: "#d1fae5",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#065f46",
                        fontWeight: "600",
                      }}
                    >
                      ✅ Checked in for today! Your stake is safe.
                    </div>
                  )}

                  {/* Reminder for unfunded habits */}
                  {hasStatus && status.funded && !status.checked && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px",
                        backgroundColor: "#fef3c7",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "#92400e",
                      }}
                    >
                      ⏰ Don't forget to check in before the day ends!
                    </div>
                  )}
                </div>
              );
            })}

            <p style={{ fontSize: "14px", color: "#666", marginTop: "15px" }}>
              💡 Tip: Use "Prepare Day" above to lock funds for all your habits,
              then check in to each one during the day!
            </p>
          </div>
        ) : userState && userState.activeHabitCount > 0 ? (
          <div style={{ color: "#666", padding: "20px", textAlign: "center" }}>
            Loading your habits...
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            No active habits yet. Create one above!
          </p>
        )}
      </div>
    </div>
  );
}
