import { useState, useEffect, useRef } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Clipboard, X, Plus, Minus, Loader2, Check, Coins } from "lucide-react";
import { logTransaction, logTxStatus } from "../../utils/logger";
import { setupPolkadotTestnet } from "../../utils/networkSetup";
import type { UserState } from "../../types/habit";
import { Tooltip, TooltipWrapper } from "../Tooltip";
import { useReadHabitTrackerStakingAdapter } from "../../generated";
import { useChainId } from "wagmi";

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
  const chainId = useChainId();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("100");
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [depositToastId, setDepositToastId] = useState<string | number>();
  const [withdrawToastId, setWithdrawToastId] = useState<string | number>();
  const [claimYieldToastId, setClaimYieldToastId] = useState<string | number>();
  const [claimBothToastId, setClaimBothToastId] = useState<string | number>();
  const [claimYieldError, setClaimYieldError] = useState<string | null>(null);
  const [claimBothError, setClaimBothError] = useState<string | null>(null);

  const depositHandledRef = useRef(false);
  const withdrawHandledRef = useRef(false);
  const claimYieldHandledRef = useRef(false);
  const claimBothHandledRef = useRef(false);

  // Get wallet balance
  const { data: walletBalance } = useBalance({
    address: address,
  });

  // Get staking adapter address
  const { data: adapterAddress } = useReadHabitTrackerStakingAdapter({
    chainId: chainId as any,
    query: {
      enabled: !!contractAddress,
    },
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

  const {
    writeContract: claimYield,
    data: claimYieldHash,
    isPending: isClaimYieldPending,
  } = useWriteContract();

  const {
    writeContract: claimBoth,
    data: claimBothHash,
    isPending: isClaimBothPending,
  } = useWriteContract();

  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const { isSuccess: isClaimYieldSuccess } = useWaitForTransactionReceipt({
    hash: claimYieldHash,
  });

  const { isSuccess: isClaimBothSuccess } = useWaitForTransactionReceipt({
    hash: claimBothHash,
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
      setDepositAmount("100");
      setShowDepositModal(false);
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

  useEffect(() => {
    if (isClaimYieldSuccess && !claimYieldHandledRef.current) {
      claimYieldHandledRef.current = true;
      logTxStatus(
        "🌱",
        "Claim Yield",
        "success",
        "yield rewards claimed",
        claimYieldToastId
      );
      setShowSuccessCheck(true);
      setClaimYieldToastId(undefined);
      setClaimYieldError(null);
      onSuccess();

      const timer = setTimeout(() => {
        setShowSuccessCheck(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isClaimYieldSuccess, claimYieldToastId, onSuccess]);

  useEffect(() => {
    if (isClaimBothSuccess && !claimBothHandledRef.current) {
      claimBothHandledRef.current = true;
      logTxStatus(
        "💰",
        "Claim All",
        "success",
        "all rewards claimed",
        claimBothToastId
      );
      setShowSuccessCheck(true);
      setClaimBothToastId(undefined);
      setClaimBothError(null);
      onSuccess();

      const timer = setTimeout(() => {
        setShowSuccessCheck(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isClaimBothSuccess, claimBothToastId, onSuccess]);

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
    setDepositAmount("100");
    setShowDepositModal(true);
  };

  const handleAddAmount = (amount: number) => {
    const current = parseFloat(depositAmount) || 0;
    setDepositAmount(String(current + amount));
  };

  const handleSetAmount = (amount: number) => {
    setDepositAmount(String(amount));
  };

  const handleClaimYield = () => {
    if (
      !userState ||
      !contractAddress ||
      !adapterAddress ||
      userState.yieldRewards <= 0n
    )
      return;
    if (adapterAddress === "0x0000000000000000000000000000000000000000") return;

    claimYieldHandledRef.current = false;
    const toastId = logTransaction(
      "🌱",
      "Claim Yield",
      `Claiming ${(Math.ceil(parseFloat(formatEther(userState.yieldRewards)) * 100) / 100).toFixed(2)} PAS yield rewards`,
      "claimYield",
      {}
    );
    setClaimYieldToastId(toastId);

    claimYield(
      {
        address: contractAddress,
        abi,
        functionName: "claimYieldRewards",
        args: [],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("🌱", "Claim Yield", "submitted", hash, toastId);
        },
        onError: (error) => {
          logTxStatus("🌱", "Claim Yield", "failed", error.message, toastId);
          setClaimYieldToastId(undefined);
          setClaimYieldError(error.message);
        },
      }
    );
  };

  const handleClaimBoth = () => {
    if (!userState || !contractAddress) return;
    const totalRewards =
      userState.stakedAmount +
      userState.yieldRewards +
      userState.claimableBalance;
    if (totalRewards <= 0n) return;

    claimBothHandledRef.current = false;
    const toastId = logTransaction(
      "💰",
      "Claim All",
      `Claiming all rewards: ${formatEther(totalRewards)} PAS (staked: ${formatEther(userState.stakedAmount)}, yield: ${(Math.ceil(parseFloat(formatEther(userState.yieldRewards)) * 100) / 100).toFixed(2)}, habit: ${formatEther(userState.claimableBalance)})`,
      "claimBoth",
      {}
    );
    setClaimBothToastId(toastId);

    claimBoth(
      {
        address: contractAddress,
        abi,
        functionName: "claimAll",
        args: [],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("💰", "Claim All", "submitted", hash, toastId);
        },
        onError: (error) => {
          logTxStatus("💰", "Claim All", "failed", error.message, toastId);
          setClaimBothToastId(undefined);
          setClaimBothError(error.message);
        },
      }
    );
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
                <TooltipWrapper text="Add">
                  <span
                    className="icon-small deposit-icon"
                    onClick={handleDepositClick}
                  >
                    <Plus size={12} />
                  </span>
                </TooltipWrapper>
                {isConnected && userState && userState.depositBalance > 0n && (
                  <TooltipWrapper text="Withdraw All">
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
                        <Minus size={12} />
                      )}
                    </span>
                  </TooltipWrapper>
                )}
              </div>
            </div>
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
            AT STAKE{" "}
            <Tooltip
              text={
                <>
                  "PAS" locked for today's habits
                  <br />
                  Complete them to start earning yield rewards
                  <br />
                  If not checked in, they will be slashed
                </>
              }
            />
          </div>
          <div className="stat-value">
            {isConnected && userState
              ? `${formatEther(userState.blockedBalance)} PAS`
              : "0 PAS"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label-with-actions">
            <span className="stat-label">
              Rewards{" "}
              <Tooltip
                text={
                  <>
                    Successful rewards staked in Moonwell.
                    <br />
                    Generates yield rewards over time.
                  </>
                }
              />
            </span>
            <div className="stat-inline-actions">
              {isConnected &&
                userState &&
                (userState.stakedAmount > 0n ||
                  userState.claimableBalance > 0n ||
                  userState.yieldRewards > 0n) && (
                  <TooltipWrapper text="Withdraw all rewards">
                    <span
                      className={`icon-small claim-both-icon ${isClaimBothPending ? "spinning" : ""}`}
                      onClick={isClaimBothPending ? undefined : handleClaimBoth}
                      style={{
                        cursor: isClaimBothPending ? "not-allowed" : "pointer",
                        opacity: isClaimBothPending ? 0.6 : 1,
                      }}
                    >
                      {isClaimBothPending ? (
                        <Loader2 size={12} />
                      ) : (
                        <Minus size={12} />
                      )}
                    </span>
                  </TooltipWrapper>
                )}
              {isConnected && userState && userState.yieldRewards > 0n && (
                <TooltipWrapper text="Harvest yield rewards only">
                  <span
                    className={`icon-small claim-yield-icon ${isClaimYieldPending ? "spinning" : ""}`}
                    onClick={isClaimYieldPending ? undefined : handleClaimYield}
                    style={{
                      cursor: isClaimYieldPending ? "not-allowed" : "pointer",
                      opacity: isClaimYieldPending ? 0.6 : 1,
                    }}
                  >
                    {isClaimYieldPending ? (
                      <Loader2 size={12} />
                    ) : (
                      <Coins size={12} />
                    )}
                  </span>
                </TooltipWrapper>
              )}
            </div>
          </div>
          <div className="stat-value">
            {isConnected && userState ? (
              <>
                {formatEther(userState.stakedAmount)} PAS
                {userState.yieldRewards > 0n && (
                  <span style={{ color: "#4ade80" }}>
                    {" "}
                    +{" "}
                    {(
                      Math.ceil(
                        parseFloat(formatEther(userState.yieldRewards)) * 100
                      ) / 100
                    ).toFixed(2)}{" "}
                    PAS
                  </span>
                )}
              </>
            ) : (
              "0 PAS"
            )}
          </div>
        </div>
      </div>

      {userStateError && (
        <div className="error-banner">
          Error loading data: {userStateError.message}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && isConnected && (
        <div
          className="deposit-modal-overlay"
          onClick={() => setShowDepositModal(false)}
        >
          <div
            className="deposit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="deposit-modal-header">
              <h3>Deposit Funds</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="deposit-modal-close"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="deposit-modal-content">
              <div className="deposit-balance-info">
                <div className="deposit-balance-row">
                  <span className="deposit-balance-label">Wallet:</span>
                  <span className="deposit-balance-value">
                    {walletBalance
                      ? `${Number(formatEther(walletBalance.value)).toFixed(2)} PAS`
                      : "0.00 PAS"}
                  </span>
                </div>
                <div className="deposit-balance-row">
                  <span className="deposit-balance-label">Deposited:</span>
                  <span className="deposit-balance-value">
                    {userState
                      ? `${Number(formatEther(userState.depositBalance)).toFixed(2)} PAS`
                      : "0.00 PAS"}
                  </span>
                </div>
              </div>
              <div className="deposit-input-group">
                <input
                  type="number"
                  className="deposit-modal-input"
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
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setShowDepositModal(false);
                    }
                  }}
                  disabled={isDepositPending}
                  placeholder="100"
                  autoFocus
                />
                <span className="deposit-modal-currency">PAS</span>
              </div>
              <div className="deposit-quick-buttons">
                <button
                  className="deposit-quick-btn"
                  onClick={() => handleSetAmount(10)}
                  disabled={isDepositPending}
                >
                  10
                </button>
                <button
                  className="deposit-quick-btn"
                  onClick={() => handleSetAmount(100)}
                  disabled={isDepositPending}
                >
                  100
                </button>
                <button
                  className="deposit-quick-btn"
                  onClick={() => handleAddAmount(10)}
                  disabled={isDepositPending}
                >
                  +10
                </button>
                <button
                  className="deposit-quick-btn"
                  onClick={() => handleAddAmount(-10)}
                  disabled={isDepositPending}
                >
                  -10
                </button>
              </div>
              <button
                className="deposit-modal-submit"
                onClick={handleDeposit}
                disabled={isDepositPending || !depositAmount}
              >
                {isDepositPending ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Deposit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
