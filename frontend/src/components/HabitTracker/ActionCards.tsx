import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { logTransaction, logTxStatus } from "../../utils/logger";
import { formatEther } from "viem";
import type { DailyStatus } from "../../types/habit";

interface ActionCardsProps {
  isConnected: boolean;
  onConnect: () => void;
  address: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  abi: any;
  chainId: number;
  currentEpoch: bigint | undefined;
  habitStatuses: Record<number, DailyStatus>;
  onSuccess: () => void;
}

export function ActionCards({
  isConnected,
  onConnect,
  address,
  contractAddress,
  abi,
  chainId,
  currentEpoch,
  habitStatuses,
  onSuccess,
}: ActionCardsProps) {
  // Check if all habits are already funded
  const allHabitsFunded = useMemo(() => {
    const statuses = Object.values(habitStatuses);
    if (!statuses || statuses.length === 0) return false;
    return statuses.every((status) => status.funded);
  }, [habitStatuses]);

  // Check if at least one habit is funded (for settling)
  const hasAnyFundedHabit = useMemo(() => {
    const statuses = Object.values(habitStatuses);
    if (!statuses || statuses.length === 0) return false;
    return statuses.some((status) => status.funded);
  }, [habitStatuses]);
  // Prepare Day state
  const [prepareDayMessage, setPrepareDayMessage] = useState("");
  const [prepareToastId, setPrepareToastId] = useState<string | number>();
  const prepareHandledRef = useRef(false);

  // Settle Yesterday state
  const [settleMessage, setSettleMessage] = useState("");
  const [settledEventReceived, setSettledEventReceived] = useState(false);
  const [settleToastId, setSettleToastId] = useState<string | number>();
  const settleHandledRef = useRef(false);

  // Force Settle state
  const [forceSettleToastId, setForceSettleToastId] = useState<
    string | number
  >();
  const forceSettleHandledRef = useRef(false);

  // Prepare Day
  const {
    writeContract: prepareDay,
    data: prepareDayHash,
    isPending: isPrepareDayPending,
  } = useWriteContract();

  const { isSuccess: isPrepareDaySuccess } = useWaitForTransactionReceipt({
    hash: prepareDayHash,
  });

  // Settle Yesterday
  const {
    writeContract: settleAll,
    data: settleAllHash,
    isPending: isSettleAllPending,
  } = useWriteContract();

  const { isSuccess: isSettleAllSuccess, isLoading: isSettleAllConfirming } =
    useWaitForTransactionReceipt({
      hash: settleAllHash,
    });

  // Force Settle
  const {
    writeContract: forceSettleDay,
    data: forceSettleDayHash,
    isPending: isForceSettleDayPending,
  } = useWriteContract();

  const { isSuccess: isForceSettleDaySuccess } = useWaitForTransactionReceipt({
    hash: forceSettleDayHash,
  });

  // Watch for DayPrepared event
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: "DayPrepared",
    chainId,
    onLogs(logs) {
      logs.forEach((log: any) => {
        if (log.args?.user?.toLowerCase() === address?.toLowerCase()) {
          const fundedCount = Number(log.args?.fundedCount || 0);
          const insufficientCount = Number(log.args?.insufficientCount || 0);

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

          setTimeout(() => setPrepareDayMessage(""), 8000);
          onSuccess();
        }
      });
    },
  });

  // Watch for SettledSuccess event
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: "SettledSuccess",
    chainId,
    onLogs(logs) {
      const userSuccesses = logs.filter(
        (log: any) => log.args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userSuccesses.length > 0) {
        setSettledEventReceived(true);
        const totalReward = userSuccesses.reduce(
          (sum: number, log: any) => sum + Number(log.args?.reward || 0n),
          0
        );
        setSettleMessage(
          `✅ Successfully settled ${userSuccesses.length} habit(s)! ${formatEther(BigInt(totalReward))} PAS moved to claimable balance.`
        );
        setTimeout(() => {
          setSettleMessage("");
          setSettledEventReceived(false);
        }, 10000);
        onSuccess();
      }
    },
  });

  // Watch for SettledFail event
  useWatchContractEvent({
    address: contractAddress,
    abi,
    eventName: "SettledFail",
    chainId,
    onLogs(logs: any[]) {
      const userFailures = logs.filter(
        (log) => log.args?.user?.toLowerCase() === address?.toLowerCase()
      );
      if (userFailures.length > 0) {
        setSettledEventReceived(true);
        const totalSlashed = userFailures.reduce(
          (sum: number, log) => sum + Number(log.args?.slashed || 0n),
          0
        );
        setSettleMessage(
          `⚠️ Settled ${userFailures.length} habit(s) - ${formatEther(BigInt(totalSlashed))} PAS forfeited for missed check-ins.`
        );
        setTimeout(() => {
          setSettleMessage("");
          setSettledEventReceived(false);
        }, 10000);
        onSuccess();
      }
    },
  });

  // Prepare Day effects
  useEffect(() => {
    if (isPrepareDaySuccess && !prepareHandledRef.current) {
      prepareHandledRef.current = true;
      logTxStatus(
        "🌅",
        "Prepare Day",
        "success",
        "funds locked for today",
        prepareToastId
      );
      setPrepareToastId(undefined);
      onSuccess();
    }
  }, [isPrepareDaySuccess, prepareToastId, onSuccess]);

  // Settle effects
  useEffect(() => {
    if (isSettleAllConfirming) {
      setSettleMessage("⏳ Transaction submitted, waiting for confirmation...");
    }
  }, [isSettleAllConfirming]);

  useEffect(() => {
    if (isSettleAllSuccess && !settledEventReceived) {
      setTimeout(() => {
        setSettleMessage(
          "⚠️ Transaction completed, but no habits were settled. They may already be settled, or weren't funded for that epoch."
        );
        setTimeout(() => setSettleMessage(""), 10000);
      }, 2000);
    }
  }, [isSettleAllSuccess, settledEventReceived]);

  useEffect(() => {
    if (isSettleAllSuccess && !settleHandledRef.current) {
      settleHandledRef.current = true;
      logTxStatus(
        "⚖️",
        "Settle",
        "success",
        "settlement complete",
        settleToastId
      );
      setSettleToastId(undefined);
      onSuccess();
    }
  }, [isSettleAllSuccess, settleToastId, onSuccess]);

  // Force Settle effects
  useEffect(() => {
    if (isForceSettleDaySuccess && !forceSettleHandledRef.current) {
      forceSettleHandledRef.current = true;
      logTxStatus(
        "🔧",
        "Force Settle",
        "success",
        "forced settlement complete",
        forceSettleToastId
      );
      setForceSettleToastId(undefined);
      onSuccess();
    }
  }, [isForceSettleDaySuccess, forceSettleToastId, onSuccess]);

  // Handlers
  const handlePrepareDay = () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!address || !currentEpoch) return;

    prepareHandledRef.current = false;
    const id = logTransaction(
      "🌅",
      "Prepare Day",
      `Locking funds for epoch ${currentEpoch}`,
      "prepareDay",
      { epoch: currentEpoch }
    );
    setPrepareToastId(id);

    prepareDay(
      {
        address: contractAddress,
        abi,
        functionName: "prepareDay",
        args: [currentEpoch],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("🌅", "Prepare Day", "submitted", hash, id);
        },
        onError: (error) => {
          logTxStatus("🌅", "Prepare Day", "failed", error.message, id);
          setPrepareToastId(undefined);
          setPrepareDayMessage(`❌ Failed: ${error.message}`);
          setTimeout(() => setPrepareDayMessage(""), 8000);
        },
      }
    );
  };

  const handleSettleDay = () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!address || !currentEpoch) return;

    const yesterdayEpoch = Number(currentEpoch) - 1;

    if (yesterdayEpoch < 0) {
      setSettleMessage("❌ No previous day to settle!");
      setTimeout(() => setSettleMessage(""), 5000);
      return;
    }

    settleHandledRef.current = false;
    const id = logTransaction(
      "⚖️",
      "Settle",
      `Settling epoch ${yesterdayEpoch}`,
      "settleAll",
      { user: address, epoch: yesterdayEpoch, maxHabits: 50 }
    );
    setSettleToastId(id);
    setSettleMessage("⏳ Submitting settlement transaction...");

    settleAll(
      {
        address: contractAddress,
        abi,
        functionName: "settleAll",
        args: [address, BigInt(yesterdayEpoch), 50],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("⚖️", "Settle", "submitted", hash, id);
        },
        onError: (error: any) => {
          logTxStatus("⚖️", "Settle", "failed", error.message, id);
          setSettleToastId(undefined);

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
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!address || !currentEpoch) return;

    const todayEpoch = Number(currentEpoch);

    forceSettleHandledRef.current = false;
    const id = logTransaction(
      "🔧",
      "Force Settle",
      `Forcing settlement of epoch ${todayEpoch}`,
      "forceSettleDay",
      { user: address, epoch: todayEpoch, maxHabits: 50 }
    );
    setForceSettleToastId(id);

    forceSettleDay(
      {
        address: contractAddress,
        abi,
        functionName: "forceSettleDay",
        args: [address, BigInt(todayEpoch), 50],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("🔧", "Force Settle", "submitted", hash, id);
        },
        onError: (error: any) => {
          logTxStatus("🔧", "Force Settle", "failed", error.message, id);
          setForceSettleToastId(undefined);

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
            const errorMsg =
              error.shortMessage || error.message || "Unknown error";
            setSettleMessage(`❌ Force settle failed: ${errorMsg}`);
          }
          setTimeout(() => setSettleMessage(""), 10000);
        },
      }
    );
  };

  return (
    <>
      <div className="action-cards-container">
        {/* Prepare Day Card */}
        <div
          className="action-card"
          title={
            allHabitsFunded
              ? "All habits are already funded for today"
              : `Lock funds for today (Epoch: ${currentEpoch?.toString() || "?"})`
          }
        >
          <div className="action-card-label">PREPARE DAY</div>
          <button
            onClick={handlePrepareDay}
            disabled={isPrepareDayPending || !isConnected || allHabitsFunded}
            className="action-card-button"
            title={
              !isConnected
                ? "Connect wallet to fund habits"
                : allHabitsFunded
                  ? "All habits are already funded for today"
                  : `Lock funds for today (Epoch: ${currentEpoch?.toString() || "?"})`
            }
          >
            {isPrepareDayPending ? (
              <>
                <Loader2 size={16} className="spinning" /> Funding...
              </>
            ) : (
              "FUND HABITS"
            )}
          </button>
        </div>

        {/* Settle Yesterday Card */}
        <div
          className="action-card"
          title={
            !isConnected
              ? "Connect wallet to settle"
              : !hasAnyFundedHabit
                ? "No funded habits to settle"
                : `Settle yesterday (Epoch: ${currentEpoch ? Number(currentEpoch) - 1 : "?"})`
          }
        >
          <div className="action-card-label">SETTLE YESTERDAY</div>
          <button
            onClick={handleSettleDay}
            disabled={isSettleAllPending || !isConnected || !hasAnyFundedHabit}
            className="action-card-button"
          >
            {isSettleAllPending ? (
              <>
                <Loader2 size={16} className="spinning" /> Settling...
              </>
            ) : (
              "CLAIM/SLASH REWARDS"
            )}
          </button>
        </div>

        {/* Force Settle Card */}
        <div
          className="action-card"
          title={
            !isConnected
              ? "Connect wallet to settle"
              : !hasAnyFundedHabit
                ? "No funded habits to settle"
                : "For testing only - bypasses validation"
          }
        >
          <div className="action-card-label">FORCE SETTLE</div>
          <button
            onClick={handleForceSettleDay}
            disabled={
              isForceSettleDayPending || !isConnected || !hasAnyFundedHabit
            }
            className="action-card-button action-card-button-secondary"
          >
            {isForceSettleDayPending ? (
              <>
                <Loader2 size={16} className="spinning" /> Settling...
              </>
            ) : (
              "CLAIM/SLASH REWARDS"
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {prepareDayMessage && (
        <div
          className={`status-message ${prepareDayMessage.includes("✅") ? "success" : prepareDayMessage.includes("⚠️") ? "warning" : "error"}`}
        >
          {prepareDayMessage}
        </div>
      )}
      {settleMessage && (
        <div
          className={`status-message ${settleMessage.includes("✅") ? "success" : settleMessage.includes("⚠️") ? "warning" : "error"}`}
        >
          {settleMessage}
        </div>
      )}
    </>
  );
}
