import { toast } from "sonner";

/**
 * Blockchain transaction logging utilities with toast notifications
 */

/**
 * Parse error messages to user-friendly format
 */
const parseErrorMessage = (error: string): string => {
  // Remove technical prefixes
  error = error.replace(/^Error:\s*/i, "");
  error = error.replace(/^execution reverted:\s*/i, "");

  // Common error patterns
  if (error.includes("user rejected") || error.includes("User denied")) {
    return "Transaction was cancelled";
  }
  if (error.includes("insufficient funds")) {
    return "Insufficient funds in your wallet";
  }
  if (error.includes("InsufficientBalance")) {
    return "Insufficient balance to complete this action";
  }
  if (error.includes("CannotSettleCurrentDay")) {
    return "Cannot settle today's habits yet. Wait until tomorrow!";
  }
  if (error.includes("AlreadyCheckedIn")) {
    return "You've already checked in for this habit today";
  }
  if (error.includes("NotFunded")) {
    return "This habit needs to be prepared first";
  }
  if (error.includes("network")) {
    return "Network error. Please check your connection";
  }

  // Return cleaned error message
  const cleanError = error.split("\n")[0]; // First line only
  return cleanError.length > 100 ? cleanError.slice(0, 100) + "..." : cleanError;
};

/**
 * Log the initiation of a blockchain transaction with function name and arguments
 * Returns toast ID for updating the same toast later
 */
export const logTransaction = (
  emoji: string,
  action: string,
  message: string,
  functionName: string,
  args: Record<string, any>
): string | number => {
  const argsString = Object.entries(args)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  // Console log
  console.log(
    `${emoji} ${action}: ${message} (${functionName}(${argsString}))`
  );

  // Show loading toast
  const toastId = toast.loading(`${emoji} ${message}`, {
    description: "Waiting for wallet confirmation...",
  });

  return toastId;
};

/**
 * Log transaction status updates (submitted, success, failed)
 * Updates existing toast or creates new one
 */
export const logTxStatus = (
  emoji: string,
  action: string,
  status: "submitted" | "success" | "failed",
  details?: string,
  toastId?: string | number
) => {
  if (status === "submitted") {
    // Generate block explorer link
    const explorerUrl = `https://blockscout-passet-hub.parity-testnet.parity.io/tx/${details}`;
    console.log(`${emoji} ${action}: Transaction submitted\n${explorerUrl}`);

    if (toastId) {
      toast.loading(`${emoji} ${action} processing...`, {
        id: toastId,
        description: "Waiting for blockchain confirmation...",
        action: {
          label: "View on Explorer",
          onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer"),
        },
      });
    }
  } else if (status === "success") {
    console.log(`${emoji} ${action}: Success - ${details}`);

    if (toastId) {
      toast.success(`${emoji} ${action} successful!`, {
        id: toastId,
        description: details,
      });
    } else {
      toast.success(`${emoji} ${action} successful!`, {
        description: details,
      });
    }
  } else if (status === "failed") {
    console.log(`${emoji} ${action}: Failed - ${details}`);

    const userFriendlyError = details ? parseErrorMessage(details) : "Unknown error";

    if (toastId) {
      toast.error(`${emoji} ${action} failed`, {
        id: toastId,
        description: userFriendlyError,
      });
    } else {
      toast.error(`${emoji} ${action} failed`, {
        description: userFriendlyError,
      });
    }
  }
};

/**
 * Log connection status information
 */
export const logConnection = (
  walletAddress: string | undefined,
  chainId: number,
  contractAddress: string | undefined
) => {
  console.log(
    `Connected Wallet: ${walletAddress || "None"} | ChainID: ${chainId} | HabitTracker: ${contractAddress || "Not deployed on this chain"}`
  );
};

