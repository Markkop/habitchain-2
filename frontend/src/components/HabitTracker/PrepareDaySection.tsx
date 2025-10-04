import { useState, useEffect, useRef } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { logTransaction, logTxStatus } from "../../utils/logger";

interface PrepareDaySectionProps {
  isConnected: boolean;
  onConnect: () => void;
  address: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  abi: any;
  chainId: number;
  currentEpoch: bigint | undefined;
  onSuccess: () => void;
}

export function PrepareDaySection({
  isConnected,
  onConnect,
  address,
  contractAddress,
  abi,
  chainId,
  currentEpoch,
  onSuccess,
}: PrepareDaySectionProps) {
  const [prepareDayMessage, setPrepareDayMessage] = useState("");
  const [toastId, setToastId] = useState<string | number>();
  const handledRef = useRef(false);

  const {
    writeContract: prepareDay,
    data: prepareDayHash,
    isPending: isPrepareDayPending,
  } = useWriteContract();

  const { isSuccess: isPrepareDaySuccess } = useWaitForTransactionReceipt({
    hash: prepareDayHash,
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

  useEffect(() => {
    if (isPrepareDaySuccess && !handledRef.current) {
      handledRef.current = true;
      logTxStatus(
        "🌅",
        "Prepare Day",
        "success",
        "funds locked for today",
        toastId
      );
      setToastId(undefined);
      onSuccess();
    }
  }, [isPrepareDaySuccess, toastId, onSuccess]);

  const handlePrepareDay = () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!address || !currentEpoch) return;

    handledRef.current = false; // Reset for new transaction
    const id = logTransaction(
      "🌅",
      "Prepare Day",
      `Locking funds for epoch ${currentEpoch}`,
      "prepareDay",
      { epoch: currentEpoch }
    );
    setToastId(id);

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
          setToastId(undefined);
        },
      }
    );
  };

  return (
    <div className="section-card">
      <h3>🌅 Prepare Today</h3>
      <p className="hint-text">
        Lock funds for today (Epoch: {currentEpoch?.toString()})
      </p>
      {prepareDayMessage && (
        <div
          className={`status-banner ${prepareDayMessage.includes("✅") ? "success" : prepareDayMessage.includes("⚠️") ? "warning" : "error"}`}
        >
          {prepareDayMessage}
        </div>
      )}
      <button
        onClick={handlePrepareDay}
        disabled={isPrepareDayPending || !isConnected}
        className="btn-primary"
        style={{ width: "100%" }}
      >
        {!isConnected
          ? "Connect"
          : isPrepareDayPending
            ? "Pending..."
            : "Prepare Day"}
      </button>
    </div>
  );
}
