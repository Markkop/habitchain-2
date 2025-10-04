import { useState, useEffect, useRef } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Clipboard, X, Plus, ArrowUp, Loader2, Check } from "lucide-react";
import { logTransaction, logTxStatus } from "../../utils/logger";
import { setupPolkadotTestnet } from "../../utils/networkSetup";
import type { UserState } from "../../types/habit";
import { Tooltip } from "../Tooltip";

interface StatsBarProps {
  isConnected: boolean;
  userState: UserState | null;
  userStateLoading: boolean;
  userStateError: Error | null;
  contractAddress: `0x${string}` | undefined;
  abi: any;
  onSuccess: () => void;
}

export function StatsBar({
  isConnected,
  userState,
  userStateLoading,
  userStateError,
  contractAddress,
  abi,
  onSuccess,
}: StatsBarProps) {
  const { address } = useAccount();
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [depositToastId, setDepositToastId] = useState<string | number>();
  const [withdrawToastId, setWithdrawToastId] = useState<string | number>();

  const depositHandledRef = useRef(false);
  const withdrawHandledRef = useRef(false);

  // Get wallet balance
  const { data: walletBalance } = useBalance({
    address: address,
  });

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
      setShowSuccessCheck(true);
      setDepositAmount("");
      setShowDepositInput(false);
      setDepositToastId(undefined);
      setDepositError(null);
      onSuccess();

      const timer = setTimeout(() => {
        setShowSuccessCheck(false);
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
      setShowSuccessCheck(true);
      setWithdrawToastId(undefined);
      setWithdrawError(null);
      onSuccess();

      const timer = setTimeout(() => {
        setShowSuccessCheck(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isWithdrawSuccess, withdrawToastId, onSuccess]);

  const handleDeposit = () => {
    if (!depositAmount || !contractAddress) return;

    depositHandledRef.current = false;
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
          setDepositError(error.message);
        },
      }
    );
  };

  const handleWithdraw = () => {
    if (!userState || !contractAddress || userState.depositBalance <= 0n)
      return;

    withdrawHandledRef.current = false;
    const amount = formatEther(userState.depositBalance);
    const value = userState.depositBalance;
    const toastId = logTransaction(
      "💸",
      "Withdraw",
      `Withdrawing ${amount} PAS`,
      "withdraw",
      { amount: value }
    );
    setWithdrawToastId(toastId);

    withdraw(
      {
        address: contractAddress,
        abi,
        functionName: "withdraw",
        args: [value],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("💸", "Withdraw", "submitted", hash, toastId);
        },
        onError: (error) => {
          logTxStatus("💸", "Withdraw", "failed", error.message, toastId);
          setWithdrawToastId(undefined);
          setWithdrawError(error.message);
        },
      }
    );
  };

  const handleDepositClick = async () => {
    if (!isConnected) {
      await setupPolkadotTestnet();
      return;
    }
    setShowDepositInput(true);
  };

  return (
    <>
      <div className="habit-stats-bar">
        <div className="stat-card">
          <div className="stat-label">Wallet</div>
          <div className="stat-value">
            {isConnected && walletBalance
              ? `${Number(formatEther(walletBalance.value)).toFixed(2)} PAS`
              : "0.00 PAS"}
          </div>
        </div>
        <div className="available-card-wrapper">
          <div className="stat-card available-card">
            <div className="stat-label-with-actions">
              <span className="stat-label">DEPOSIT</span>
              <div className="stat-inline-actions">
                {!showDepositInput && (
                  <span
                    className="icon-small deposit-icon"
                    onClick={handleDepositClick}
                  >
                    <Plus size={12} />
                  </span>
                )}
                {isConnected && userState && userState.depositBalance > 0n && (
                  <span
                    className={`icon-small withdraw-icon ${isWithdrawPending ? "spinning" : ""}`}
                    onClick={isWithdrawPending ? undefined : handleWithdraw}
                    style={{
                      cursor: isWithdrawPending ? "not-allowed" : "pointer",
                      opacity: isWithdrawPending ? 0.6 : 1,
                    }}
                  >
                    {isWithdrawPending ? (
                      <Loader2 size={12} />
                    ) : (
                      <ArrowUp size={12} />
                    )}
                  </span>
                )}
              </div>
            </div>
            {showDepositInput && isConnected ? (
              <div className="deposit-inline">
                <input
                  type="number"
                  className="deposit-input-small"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      depositAmount &&
                      !isDepositPending
                    ) {
                      e.preventDefault();
                      handleDeposit();
                    } else if (e.key === "Escape" && !isDepositPending) {
                      e.preventDefault();
                      setShowDepositInput(false);
                      setDepositAmount("");
                    }
                  }}
                  disabled={isDepositPending}
                  maxLength={5}
                  autoFocus
                />
                <button
                  className={`icon-button add-button ${isDepositPending ? "spinning" : ""}`}
                  onClick={handleDeposit}
                  disabled={isDepositPending || !depositAmount}
                >
                  <span>
                    {isDepositPending ? (
                      <Loader2 size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </span>
                </button>
                <button
                  className="icon-button cancel-button"
                  onClick={() => {
                    setShowDepositInput(false);
                    setDepositAmount("");
                  }}
                  disabled={isDepositPending}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="stat-value-with-check">
                <span className="stat-value">
                  {isConnected && userState
                    ? `${Number(formatEther(userState.depositBalance)).toFixed(2)} PAS`
                    : "0.00 PAS"}
                </span>
                {showSuccessCheck && (
                  <span
                    className="success-check"
                    onClick={() => setShowSuccessCheck(false)}
                  >
                    <Check size={16} />
                  </span>
                )}
              </div>
            )}
          </div>
          {(depositError || withdrawError) && (
            <div
              className={`error-message-absolute ${(depositError || withdrawError)!.length > 100 ? "long-error" : ""}`}
            >
              <div className="error-message-buttons">
                <button
                  className="error-btn copy-btn"
                  onClick={() => {
                    const errorText = depositError || withdrawError || "";
                    navigator.clipboard.writeText(errorText);
                    logTxStatus(
                      "📋",
                      "Copy",
                      "success",
                      "Error copied to clipboard",
                      undefined
                    );
                  }}
                >
                  <Clipboard size={10} />
                </button>
                <button
                  className="error-btn close-btn"
                  onClick={() => {
                    setDepositError(null);
                    setWithdrawError(null);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
              {depositError || withdrawError}
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">
            Staked <Tooltip text={<>"PAS" at stake yield extra rewards</>} />
          </div>
          <div className="stat-value">
            {isConnected && userState
              ? `${formatEther(userState.blockedBalance)} PAS`
              : "0 PAS"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            Rewards{" "}
            <Tooltip
              text={
                <>
                  Your "PAS" back + yield rewards.
                  <br />
                  Keeps yield rewards while not claimed
                </>
              }
            />
          </div>
          <div className="stat-value">
            {isConnected && userState
              ? `${formatEther(userState.claimableBalance)} PAS`
              : "0 PAS"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Habits</div>
          <div className="stat-value">
            {isConnected && userState
              ? userState.activeHabitCount.toString()
              : "0"}
          </div>
        </div>
      </div>

      {userStateError && (
        <div className="error-banner">
          Error loading data: {userStateError.message}
        </div>
      )}
    </>
  );
}
