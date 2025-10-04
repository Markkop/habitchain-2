import { useState, useEffect, useRef } from "react";
import { formatEther } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { logTransaction, logTxStatus } from "../../utils/logger";

interface SettleDaySectionProps {
  isConnected: boolean;
  onConnect: () => void;
  address: `0x${string}` | undefined;
  habitTrackerAddress: `0x${string}`;
  habitTrackerAbi: any;
  habitSettlerAddress: `0x${string}`;
  habitSettlerAbi: any;
  chainId: number;
  currentEpoch: bigint | undefined;
  onSuccess: () => void;
}

export function SettleDaySection({
  isConnected,
  onConnect,
  address,
  habitTrackerAddress,
  habitTrackerAbi,
  habitSettlerAddress,
  habitSettlerAbi,
  chainId,
  currentEpoch,
  onSuccess,
}: SettleDaySectionProps) {
  const [settleMessage, setSettleMessage] = useState("");
  const [settledEventReceived, setSettledEventReceived] = useState(false);
  const [settleToastId, setSettleToastId] = useState<string | number>();
  const [forceSettleToastId, setForceSettleToastId] = useState<
    string | number
  >();

  const settleHandledRef = useRef(false);
  const forceSettleHandledRef = useRef(false);

  const {
    writeContract: settleAll,
    data: settleAllHash,
    isPending: isSettleAllPending,
  } = useWriteContract();

  const {
    writeContract: forceSettleDay,
    data: forceSettleDayHash,
    isPending: isForceSettleDayPending,
  } = useWriteContract();

  const { isSuccess: isSettleAllSuccess, isLoading: isSettleAllConfirming } =
    useWaitForTransactionReceipt({
      hash: settleAllHash,
    });

  const { isSuccess: isForceSettleDaySuccess } = useWaitForTransactionReceipt({
    hash: forceSettleDayHash,
  });

  // Watch for SettledSuccess event from HabitTracker
  useWatchContractEvent({
    address: habitTrackerAddress,
    abi: habitTrackerAbi,
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

  // Watch for SettledFail event from HabitTracker
  useWatchContractEvent({
    address: habitTrackerAddress,
    abi: habitTrackerAbi,
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

  // Show confirming message
  useEffect(() => {
    if (isSettleAllConfirming) {
      setSettleMessage("⏳ Transaction submitted, waiting for confirmation...");
    }
  }, [isSettleAllConfirming]);

  // Detect when settlement transaction completes but no events were emitted
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

    settleHandledRef.current = false; // Reset for new transaction
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
        address: habitSettlerAddress,
        abi: habitSettlerAbi,
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

    forceSettleHandledRef.current = false; // Reset for new transaction
    const id = logTransaction(
      "🔧",
      "Force Settle",
      `Forcing settlement of epoch ${todayEpoch}`,
      "forceSettleDay",
      { user: address, epoch: todayEpoch, maxHabits: 50 }
    );
    setForceSettleToastId(id);
    setSettleMessage(
      `⚖️ Force settling TODAY (Epoch ${todayEpoch})... (bypassing all checks)`
    );

    forceSettleDay(
      {
        address: habitSettlerAddress,
        abi: habitSettlerAbi,
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
    <div className="section-card">
      <h3>⚖️ Settle Previous Days</h3>
      {settleMessage && (
        <div
          className={`status-banner ${settleMessage.includes("✅") ? "success" : settleMessage.includes("⚠️") ? "warning" : "error"}`}
        >
          {settleMessage}
        </div>
      )}
      <button
        onClick={handleSettleDay}
        disabled={isSettleAllPending || !isConnected}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {!isConnected
          ? "Connect"
          : isSettleAllPending
            ? "Settling..."
            : `Settle Yesterday (Epoch ${currentEpoch ? Number(currentEpoch) - 1 : "?"})`}
      </button>
      <p className="hint-text">
        Claims rewards for checked-in habits, forfeits missed ones
      </p>

      <div
        style={{
          marginTop: "15px",
          paddingTop: "15px",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={handleForceSettleDay}
          disabled={isForceSettleDayPending || !isConnected}
          className="btn-secondary"
          style={{ width: "100%" }}
        >
          {!isConnected
            ? "Connect"
            : isForceSettleDayPending
              ? "Pending..."
              : `🔧 Force Settle Today (Testing)`}
        </button>
        <p className="hint-text">⚠️ Testing: Bypasses validation</p>
      </div>
    </div>
  );
}
