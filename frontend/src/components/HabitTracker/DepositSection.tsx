import { useState, useEffect, useRef } from "react";
import { parseEther, formatEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { logTransaction, logTxStatus } from "../../utils/logger";
import type { UserState } from "../../types/habit";

interface DepositSectionProps {
  isConnected: boolean;
  onConnect: () => void;
  contractAddress: `0x${string}`;
  abi: any;
  userState: UserState | null;
  onSuccess: () => void;
}

export function DepositSection({
  isConnected,
  onConnect,
  contractAddress,
  abi,
  userState,
  onSuccess,
}: DepositSectionProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositSuccess, setShowDepositSuccess] = useState(false);
  const [depositToastId, setDepositToastId] = useState<string | number>();
  const [withdrawToastId, setWithdrawToastId] = useState<string | number>();

  const depositHandledRef = useRef(false);
  const withdrawHandledRef = useRef(false);

  const {
    writeContract: deposit,
    data: depositHash,
    isPending: isDepositPending,
  } = useWriteContract();

  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();

  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  useEffect(() => {
    if (isDepositSuccess && !depositHandledRef.current) {
      depositHandledRef.current = true;
      logTxStatus(
        "💰",
        "Deposit",
        "success",
        "funds added to balance",
        depositToastId
      );
      setShowDepositSuccess(true);
      setDepositAmount("");
      setDepositToastId(undefined);
      onSuccess();

      const timer = setTimeout(() => {
        setShowDepositSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, depositToastId, onSuccess]);

  useEffect(() => {
    if (isWithdrawSuccess && !withdrawHandledRef.current) {
      withdrawHandledRef.current = true;
      logTxStatus(
        "💸",
        "Withdraw",
        "success",
        "funds withdrawn",
        withdrawToastId
      );
      setWithdrawToastId(undefined);
      onSuccess();
    }
  }, [isWithdrawSuccess, withdrawToastId, onSuccess]);

  const handleDeposit = () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!depositAmount) return;

    depositHandledRef.current = false; // Reset for new transaction
    const value = parseEther(depositAmount);
    const toastId = logTransaction(
      "💰",
      "Deposit",
      `Starting deposit of ${depositAmount} PAS`,
      "deposit",
      { value }
    );
    setDepositToastId(toastId);

    deposit(
      {
        address: contractAddress,
        abi,
        functionName: "deposit",
        args: [],
        value: value,
      },
      {
        onSuccess: (hash) => {
          logTxStatus("💰", "Deposit", "submitted", hash, toastId);
        },
        onError: (error) => {
          logTxStatus("💰", "Deposit", "failed", error.message, toastId);
          setDepositToastId(undefined);
        },
      }
    );
  };

  const handleWithdraw = (amount: string) => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!amount) return;

    withdrawHandledRef.current = false; // Reset for new transaction
    const value = parseEther(amount);
    const toastId = logTransaction(
      "💸",
      "Withdraw",
      `Withdrawing ${amount} PAS`,
      "withdraw",
      {
        amount: value,
      }
    );
    setWithdrawToastId(toastId);

    // move(from: 0=deposit, to: 2=external, amount)
    withdraw(
      {
        address: contractAddress,
        abi,
        functionName: "move",
        args: [0, 2, value],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("💸", "Withdraw", "submitted", hash, toastId);
        },
        onError: (error) => {
          logTxStatus("💸", "Withdraw", "failed", error.message, toastId);
          setWithdrawToastId(undefined);
        },
      }
    );
  };

  return (
    <div className="section-card">
      <h3>💵 Deposit Funds</h3>
      {showDepositSuccess && (
        <div className="success-banner">✅ Deposit successful!</div>
      )}
      <div className="input-row">
        <input
          type="number"
          placeholder="Amount (PAS)"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          disabled={isDepositPending}
          className="minimal-input"
        />
        <button
          onClick={handleDeposit}
          disabled={isDepositPending || (!isConnected && !depositAmount)}
          className="btn-primary"
        >
          {!isConnected
            ? "Connect"
            : isDepositPending
              ? "Pending..."
              : "Deposit"}
        </button>
      </div>
      {isConnected && userState && userState.depositBalance > 0n && (
        <button
          onClick={() => handleWithdraw(formatEther(userState.depositBalance))}
          disabled={isWithdrawPending}
          className="btn-secondary"
          style={{ marginTop: "10px", width: "100%" }}
        >
          {isWithdrawPending ? "Pending..." : "Withdraw All"}
        </button>
      )}
    </div>
  );
}
