import { useState, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, type Address, type Hex } from "viem";
import { passetHub } from "../wagmi-config";
import {
  habitTrackerAddress,
  habitTrackerAbi,
  mockStakingRewardsAbi,
  mockStakingRewardsAddress,
  habitSettlerAbi,
  habitSettlerAddress,
} from "../generated";
import { CopyButton } from "./CopyButton";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// Type for ABI items
type AbiFunction = {
  type: string;
  name: string;
  inputs?: readonly { name: string; type: string; internalType?: string }[];
  outputs?: readonly { name: string; type: string; internalType?: string }[];
  stateMutability?: string;
};

// Helper to generate function signature from ABI
function generateSignature(abiItem: AbiFunction): string {
  if (!abiItem.name) return "";

  const inputs = abiItem.inputs || [];
  const outputs = abiItem.outputs || [];
  const inputsStr = inputs.map((i) => `${i.type} ${i.name || ""}`).join(", ");

  let sig = `${abiItem.name}(${inputsStr})`;

  if (abiItem.stateMutability === "payable") {
    sig += " payable";
  }

  if (outputs.length > 0) {
    const outputsStr = outputs.map((o) => o.type).join(", ");
    sig += ` → ${outputsStr}`;
  }

  return sig;
}

// Convert Solidity type to input type
function getInputType(solidityType: string): "text" | "number" | "address" {
  if (solidityType === "address") return "address";
  if (
    solidityType.startsWith("uint") ||
    solidityType.startsWith("int") ||
    solidityType.includes("[]")
  )
    return "number";
  return "text";
}

// Generate inputs from ABI parameters
function generateInputs(
  params: readonly { name: string; type: string }[]
): InputConfig[] {
  return params.map((param) => ({
    name: param.name,
    type: getInputType(param.type),
    placeholder: `Enter ${param.name}`,
    required: true,
  }));
}

// Custom function configurations for special cases
const functionOverrides: Record<
  string,
  {
    description?: string;
    inputs?: InputConfig[];
    argsBuilder?: (
      inputs: Record<string, string>,
      extras: { address?: Address; epochNow?: bigint | undefined }
    ) => unknown[];
    valueBuilder?: (inputs: Record<string, string>) => bigint;
    skip?: boolean;
  }
> = {
  deposit: {
    description: "Deposit PAS to fund habits",
    inputs: [
      { name: "amount", type: "number", placeholder: "0.01", required: true },
    ],
    valueBuilder: (inputs) => parseEther(inputs.amount || "0"),
    argsBuilder: () => [],
  },
  createHabit: {
    description: "Create new habit (max 32 chars)",
    inputs: [
      {
        name: "text",
        type: "text",
        placeholder: "Exercise daily",
        required: true,
        maxLength: 32,
      },
    ],
    argsBuilder: (inputs) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(inputs.text.slice(0, 32));
      const bytes32 = new Uint8Array(32);
      bytes32.set(bytes);
      const habitBytes32 = `0x${Array.from(bytes32)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}` as Hex;
      return [habitBytes32];
    },
  },
  prepareDay: {
    description: "Lock funds for today's habits",
    argsBuilder: (_, { epochNow }) => [epochNow],
    inputs: [], // Auto-filled
  },
  checkIn: {
    description: "Mark habit complete",
    inputs: [
      { name: "habitId", type: "number", placeholder: "1", required: true },
    ],
    argsBuilder: (inputs, { epochNow }) => [Number(inputs.habitId), epochNow],
  },
  forceSettle: {
    description: "Settle habit (testing only)",
    inputs: [
      { name: "habitId", type: "number", placeholder: "1", required: true },
    ],
    argsBuilder: (inputs, { address, epochNow }) => [
      address,
      epochNow,
      Number(inputs.habitId),
    ],
  },
  settleAll: {
    description: "Settle all habits for past day",
    inputs: [
      { name: "maxCount", type: "number", placeholder: "50", required: true },
    ],
    argsBuilder: (inputs, { address, epochNow }) => [
      address,
      epochNow ? epochNow - 1n : 0n,
      Number(inputs.maxCount),
    ],
  },
  forceSettleDay: {
    description: "Force settle current day (testing)",
    inputs: [
      { name: "maxCount", type: "number", placeholder: "50", required: true },
    ],
    argsBuilder: (inputs, { address, epochNow }) => [
      address,
      epochNow,
      Number(inputs.maxCount),
    ],
  },
  // Skip view/pure functions from write interface
  epochNow: { skip: true },
  userStates: { skip: true },
  userHabitCounters: { skip: true },
  treasury: { skip: true },
  stakingAdapter: { skip: true },
  ratePerSecond: { skip: true },
  deposits: { skip: true },
  getContractBalance: { skip: true },
  habitTracker: { skip: true },
};

// Generate write function config from ABI
function generateWriteFunctionConfig(
  abiFunc: AbiFunction
): WriteFunctionConfig | null {
  const override = functionOverrides[abiFunc.name];

  if (override?.skip) return null;
  if (abiFunc.stateMutability === "view" || abiFunc.stateMutability === "pure")
    return null;

  const params = abiFunc.inputs || [];
  const defaultInputs = generateInputs(params);

  return {
    name: abiFunc.name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim(),
    functionName: abiFunc.name,
    signature: generateSignature(abiFunc),
    description: override?.description || `Call ${abiFunc.name}`,
    inputs: override?.inputs !== undefined ? override.inputs : defaultInputs,
    argsBuilder:
      override?.argsBuilder ||
      ((inputs) => {
        // Default: convert inputs to args in order
        return params.map((param) => {
          const value = inputs[param.name];
          if (param.type.startsWith("uint") || param.type.startsWith("int")) {
            return param.type.includes("[]")
              ? value.split(",").map((v: string) => BigInt(v.trim()))
              : BigInt(value || "0");
          }
          if (param.type === "address") return value as Address;
          if (param.type.includes("[]"))
            return value.split(",").map((v: string) => v.trim());
          return value;
        });
      }),
    valueBuilder: override?.valueBuilder,
  };
}

interface TestResult {
  status: "idle" | "pending" | "confirming" | "success" | "error";
  txHash?: Hex;
  error?: string;
  data?: unknown;
}

interface ContractConfig {
  name: string;
  address?: Address;
  abi: readonly unknown[];
  readFunctions: ReadFunctionConfig[];
  writeFunctions: WriteFunctionConfig[];
}

interface ReadFunctionConfig {
  name: string;
  functionName: string;
  args?: unknown[];
  formatter?: (value: unknown) => string;
}

interface WriteFunctionConfig {
  name: string;
  functionName: string;
  description: string;
  signature?: string;
  inputs?: InputConfig[];
  argsBuilder?: (
    inputs: Record<string, string>,
    extras: {
      address?: Address;
      epochNow?: bigint | undefined;
    }
  ) => unknown[];
  valueBuilder?: (inputs: Record<string, string>) => bigint;
}

interface InputConfig {
  name: string;
  type: "text" | "number" | "address";
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export function TestPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === passetHub.id;

  // Expanded state for contracts
  const [expandedContracts, setExpandedContracts] = useState<
    Record<string, boolean>
  >({});
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [currentTxKey, setCurrentTxKey] = useState<string | null>(null);
  const [happyPathRunning, setHappyPathRunning] = useState(false);
  const [happyPathStep, setHappyPathStep] = useState<string>("");
  const [createdHabitId, setCreatedHabitId] = useState<number | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Update result when transaction is confirmed
  useEffect(() => {
    if (txHash && currentTxKey) {
      updateResult(currentTxKey, {
        status: "confirming",
        txHash,
      });
    }
  }, [txHash, currentTxKey]);

  useEffect(() => {
    if (isConfirmed && currentTxKey && txHash) {
      updateResult(currentTxKey, {
        status: "success",
        txHash,
      });
      toast.success("Transaction confirmed!");
      setCurrentTxKey(null);
    }
  }, [isConfirmed, currentTxKey, txHash]);

  // Read epoch from HabitTracker
  const habitTrackerAddr = habitTrackerAddress[
    chainId as keyof typeof habitTrackerAddress
  ] as Address | undefined;

  const { data: epochNow } = useReadContract({
    address: habitTrackerAddr,
    abi: habitTrackerAbi,
    functionName: "epochNow",
    query: { enabled: !!habitTrackerAddr },
  });

  const { data: habitCounter } = useReadContract({
    address: habitTrackerAddr,
    abi: habitTrackerAbi,
    functionName: "userHabitCounters",
    args: address ? [address] : undefined,
    query: { enabled: !!habitTrackerAddr && !!address },
  });

  // Read function display configs
  const readFunctionConfigs: Record<string, ReadFunctionConfig> = {
    epochNow: {
      name: "Epoch Now",
      functionName: "epochNow",
      formatter: (v) => String(v),
    },
    userStates: {
      name: "User State",
      functionName: "userStates",
      args: address ? [address] : undefined,
      formatter: (v) => {
        if (!v) return "Not loaded";
        const state = v as [bigint, bigint, bigint, number];
        return `Deposit: ${formatEther(state[0])}, Blocked: ${formatEther(state[1])}, Claimable: ${formatEther(state[2])}, Active: ${state[3]}`;
      },
    },
    userHabitCounters: {
      name: "Habit Count",
      functionName: "userHabitCounters",
      args: address ? [address] : undefined,
      formatter: (v) => String(v || 0),
    },
    treasury: {
      name: "Treasury",
      functionName: "treasury",
      formatter: (v) => v as string,
    },
    stakingAdapter: {
      name: "Staking Adapter",
      functionName: "stakingAdapter",
      formatter: (v) => v as string,
    },
    ratePerSecond: {
      name: "Rate Per Second",
      functionName: "ratePerSecond",
      formatter: (v) => `${String(v)} wei`,
    },
    deposits: {
      name: "User Deposits",
      functionName: "deposits",
      args: address ? [address] : undefined,
      formatter: (v) => `${formatEther((v as bigint) || 0n)} PAS`,
    },
    getContractBalance: {
      name: "Contract Balance",
      functionName: "getContractBalance",
      formatter: (v) => `${formatEther((v as bigint) || 0n)} PAS`,
    },
    getPendingRewards: {
      name: "Get Pending Rewards",
      functionName: "getPendingRewards",
      args: address ? [address] : undefined,
      formatter: (v) => `${formatEther((v as bigint) || 0n)} PAS`,
    },
    getStakedAmount: {
      name: "Get Staked Amount",
      functionName: "getStakedAmount",
      args: address ? [address] : undefined,
      formatter: (v) => `${formatEther((v as bigint) || 0n)} PAS`,
    },
    habitTracker: {
      name: "HabitTracker",
      functionName: "habitTracker",
      formatter: (v) => v as string,
    },
  };

  // Generate write functions dynamically from ABI
  const generateWriteFunctions = (
    abi: readonly unknown[]
  ): WriteFunctionConfig[] => {
    return abi
      .filter((item: any) => item.type === "function")
      .map((item: any) => generateWriteFunctionConfig(item as AbiFunction))
      .filter((config): config is WriteFunctionConfig => config !== null);
  };

  // Generate read functions from ABI
  const generateReadFunctions = (
    abi: readonly unknown[]
  ): ReadFunctionConfig[] => {
    return abi
      .filter(
        (item: any) =>
          item.type === "function" &&
          (item.stateMutability === "view" || item.stateMutability === "pure")
      )
      .map((item: any) => {
        const func = item as AbiFunction;
        const config = readFunctionConfigs[func.name];
        if (config) return config;

        // Default read config
        return {
          name: func.name
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim(),
          functionName: func.name,
          formatter: (v) => String(v),
        };
      });
  };

  // Contract configurations - now fully dynamic!
  const contracts: ContractConfig[] = [
    {
      name: "HabitTracker",
      address: habitTrackerAddr,
      abi: habitTrackerAbi,
      readFunctions: generateReadFunctions(habitTrackerAbi),
      writeFunctions: generateWriteFunctions(habitTrackerAbi),
    },
    {
      name: "MockStakingRewards",
      address: mockStakingRewardsAddress[
        chainId as keyof typeof mockStakingRewardsAddress
      ] as Address | undefined,
      abi: mockStakingRewardsAbi,
      readFunctions: generateReadFunctions(mockStakingRewardsAbi),
      writeFunctions: generateWriteFunctions(mockStakingRewardsAbi),
    },
    {
      name: "HabitSettler",
      address: habitSettlerAddress[
        chainId as keyof typeof habitSettlerAddress
      ] as Address | undefined,
      abi: habitSettlerAbi,
      readFunctions: generateReadFunctions(habitSettlerAbi),
      writeFunctions: generateWriteFunctions(habitSettlerAbi),
    },
  ];

  const toggleContract = (contractName: string) => {
    setExpandedContracts((prev) => ({
      ...prev,
      [contractName]: !prev[contractName],
    }));
  };

  const updateResult = (key: string, result: TestResult) => {
    setResults((prev) => ({ ...prev, [key]: result }));
  };

  const handleWrite = async (
    contract: ContractConfig,
    writeFunc: WriteFunctionConfig
  ) => {
    if (!contract.address) return;

    const key = `${contract.name}-${writeFunc.functionName}`;
    const funcInputs = inputs[key] || {};

    try {
      updateResult(key, { status: "pending", data: funcInputs });
      setCurrentTxKey(key);

      const args = writeFunc.argsBuilder
        ? writeFunc.argsBuilder(funcInputs, {
            address,
            epochNow: epochNow as bigint | undefined,
          })
        : [];

      const value = writeFunc.valueBuilder
        ? writeFunc.valueBuilder(funcInputs)
        : undefined;

      if (value !== undefined) {
        writeContract({
          address: contract.address,
          abi: contract.abi,
          functionName: writeFunc.functionName,
          args,
          value,
        } as never);
      } else {
        writeContract({
          address: contract.address,
          abi: contract.abi,
          functionName: writeFunc.functionName,
          args,
        } as never);
      }

      toast.info(`${writeFunc.name} - please confirm in wallet`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      updateResult(key, {
        status: "error",
        error: errorMessage,
      });
      setCurrentTxKey(null);
      toast.error(`${writeFunc.name} failed: ${errorMessage}`);
    }
  };

  const runHappyPath = async () => {
    if (!habitTrackerAddr || !address) {
      toast.error("Wallet not connected or contract not found");
      return;
    }

    setHappyPathRunning(true);

    try {
      // Step 1: Deposit 100 PAS
      setHappyPathStep("Depositing 100 PAS...");
      toast.info("Step 1/5: Depositing 100 PAS");

      await new Promise<void>((resolve, reject) => {
        const depositValue = parseEther("100");

        writeContract(
          {
            address: habitTrackerAddr,
            abi: habitTrackerAbi,
            functionName: "deposit",
            args: [],
            value: depositValue,
          } as never,
          {
            onSuccess: () => {
              toast.success("✓ Deposit confirmed");
              setTimeout(resolve, 2000); // Wait 2s for state to settle
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Step 2: Create habit "Do exercise"
      setHappyPathStep("Creating habit 'Do exercise'...");
      toast.info("Step 2/5: Creating habit");

      const habitText = "Do exercise";
      const encoder = new TextEncoder();
      const bytes = encoder.encode(habitText.slice(0, 32));
      const bytes32 = new Uint8Array(32);
      bytes32.set(bytes);
      const habitBytes32 = `0x${Array.from(bytes32)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}` as Hex;

      await new Promise<void>((resolve, reject) => {
        writeContract(
          {
            address: habitTrackerAddr,
            abi: habitTrackerAbi,
            functionName: "createHabit",
            args: [habitBytes32],
          } as never,
          {
            onSuccess: () => {
              toast.success("✓ Habit created");
              // Store the habit ID (assuming it's the next counter)
              setTimeout(resolve, 2000);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Get the habit ID (it should be the current counter)
      const habitId = Number(habitCounter || 0);
      setCreatedHabitId(habitId);

      // Step 3: Fund that habit (prepareDay)
      setHappyPathStep("Funding habit (prepareDay)...");
      toast.info("Step 3/5: Funding habit");

      await new Promise<void>((resolve, reject) => {
        writeContract(
          {
            address: habitTrackerAddr,
            abi: habitTrackerAbi,
            functionName: "prepareDay",
            args: [epochNow],
          } as never,
          {
            onSuccess: () => {
              toast.success("✓ Habit funded");
              setTimeout(resolve, 2000);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Step 4: Check in that habit
      setHappyPathStep("Checking in habit...");
      toast.info("Step 4/5: Checking in");

      await new Promise<void>((resolve, reject) => {
        writeContract(
          {
            address: habitTrackerAddr,
            abi: habitTrackerAbi,
            functionName: "checkIn",
            args: [habitId, epochNow],
          } as never,
          {
            onSuccess: () => {
              toast.success("✓ Checked in");
              setTimeout(resolve, 2000);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Step 5: Force settle
      setHappyPathStep("Force settling...");
      toast.info("Step 5/5: Force settling");

      const settlerAddr = habitSettlerAddress[
        chainId as keyof typeof habitSettlerAddress
      ] as Address | undefined;

      if (!settlerAddr) {
        throw new Error("Settler contract not found");
      }

      await new Promise<void>((resolve, reject) => {
        writeContract(
          {
            address: settlerAddr,
            abi: habitSettlerAbi,
            functionName: "forceSettleDay",
            args: [address, epochNow, 50], // maxCount = 50 (settle all habits for the day)
          } as never,
          {
            onSuccess: () => {
              toast.success("✓ Force settled");
              setTimeout(resolve, 2000);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Success!
      setHappyPathStep("✓ Happy path complete!");
      toast.success("🎉 Happy path complete! All steps executed successfully.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setHappyPathStep(`Error: ${errorMessage}`);
      toast.error(`Happy path failed: ${errorMessage}`);
    } finally {
      setHappyPathRunning(false);
      setTimeout(() => {
        setHappyPathStep("");
        setCreatedHabitId(null);
      }, 5000);
    }
  };

  const StatusIcon = ({ status }: { status: TestResult["status"] }) => {
    switch (status) {
      case "pending":
        return <Loader2 className="status-icon spin" size={14} />;
      case "confirming":
        return <Loader2 className="status-icon spin" size={14} />;
      case "success":
        return <CheckCircle2 className="status-icon success" size={14} />;
      case "error":
        return <XCircle className="status-icon error" size={14} />;
      default:
        return null;
    }
  };

  const ResultDisplay = ({
    result,
    compact,
  }: {
    result: TestResult;
    compact?: boolean;
  }) => {
    if (result.status === "idle") return null;

    return (
      <div className={`result ${result.status} ${compact ? "compact" : ""}`}>
        <div className="result-header">
          <StatusIcon status={result.status} />
          <span>
            {result.status === "pending" && "Pending..."}
            {result.status === "confirming" && "Confirming..."}
            {result.status === "success" && "Success"}
            {result.status === "error" && "Error"}
          </span>
        </div>
        {result.txHash && (
          <div className="result-row">
            <span>Tx:</span>
            <span>
              {result.txHash.slice(0, 8)}...{result.txHash.slice(-6)}
              <CopyButton textToCopy={result.txHash} label="Tx" size={10} />
              <a
                href={`${passetHub.blockExplorers.default.url}/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-icon"
              >
                <ExternalLink size={10} />
              </a>
            </span>
          </div>
        )}
        {result.error && <div className="result-error">{result.error}</div>}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="test-page">
        <div className="alert warning">
          <AlertCircle size={18} />
          <span>Connect wallet to use test page</span>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="test-page">
        <div className="alert error">
          <XCircle size={18} />
          <span>Switch to Polkadot Paseo testnet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="test-page compact">
      <meta name="robots" content="noindex" />

      <div className="page-header">
        <h1>Contract Test Interface</h1>
        <p>Interactive testing for deployed contracts on Paseo testnet</p>
      </div>

      {/* Network Info - Compact */}
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Network:</span>
          <span>{passetHub.name}</span>
        </div>
        <div className="info-item">
          <span className="label">Chain ID:</span>
          <span>{chainId}</span>
        </div>
        <div className="info-item">
          <span className="label">Wallet:</span>
          <span>
            {address?.slice(0, 6)}...{address?.slice(-4)}
            {address && (
              <CopyButton textToCopy={address} label="Wallet" size={12} />
            )}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Epoch:</span>
          <span>{epochNow !== undefined ? String(epochNow) : "..."}</span>
        </div>
      </div>

      {/* Happy Path Section */}
      <div className="happy-path-section">
        <div className="happy-path-header">
          <h2>🎯 Happy Path Test</h2>
          <p>Simulate complete user flow in one click</p>
        </div>
        <div className="happy-path-content">
          <div className="happy-path-steps">
            <span>1. Deposit 100 PAS</span>
            <span>→</span>
            <span>2. Create "Do exercise"</span>
            <span>→</span>
            <span>3. Fund habit</span>
            <span>→</span>
            <span>4. Check in</span>
            <span>→</span>
            <span>5. Force settle</span>
          </div>
          <button
            onClick={runHappyPath}
            disabled={happyPathRunning || isWritePending}
            className="happy-path-btn"
          >
            {happyPathRunning ? (
              <>
                <Loader2 className="spin" size={18} />
                Running...
              </>
            ) : (
              "▶ Run Happy Path"
            )}
          </button>
          {happyPathStep && (
            <div className="happy-path-status">
              {happyPathStep.startsWith("Error") ? (
                <XCircle size={16} color="#dc3545" />
              ) : happyPathStep.startsWith("✓") ? (
                <CheckCircle2 size={16} color="#28a745" />
              ) : (
                <Loader2 className="spin" size={16} />
              )}
              <span>{happyPathStep}</span>
            </div>
          )}
          {createdHabitId !== null && (
            <div className="happy-path-info">
              Created Habit ID: <strong>{createdHabitId}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Contract Sections */}
      {contracts.map((contract) => (
        <div key={contract.name} className="contract-section">
          <div
            className="contract-header"
            onClick={() => toggleContract(contract.name)}
          >
            <div className="contract-title">
              <h2>{contract.name}</h2>
              {contract.address && (
                <span className="address">
                  {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                  <CopyButton
                    textToCopy={contract.address}
                    label="Address"
                    size={11}
                  />
                  <a
                    href={`${passetHub.blockExplorers.default.url}/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-icon"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={11} />
                  </a>
                </span>
              )}
            </div>
            {expandedContracts[contract.name] ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>

          {expandedContracts[contract.name] && (
            <div className="contract-content">
              {/* Read Functions */}
              {contract.readFunctions.length > 0 && (
                <div className="functions-section">
                  <h3>📖 Read</h3>
                  <div className="read-grid">
                    {contract.readFunctions.map((readFunc) => {
                      const ReadValue = () => {
                        const { data } = useReadContract({
                          address: contract.address,
                          abi: contract.abi,
                          functionName: readFunc.functionName,
                          args: readFunc.args,
                          query: { enabled: !!contract.address },
                        });

                        return (
                          <div className="read-item">
                            <span className="read-label">{readFunc.name}:</span>
                            <span className="read-value">
                              {data !== undefined
                                ? readFunc.formatter
                                  ? readFunc.formatter(data)
                                  : String(data)
                                : "..."}
                            </span>
                          </div>
                        );
                      };

                      return <ReadValue key={readFunc.name} />;
                    })}
                  </div>
                </div>
              )}

              {/* Write Functions */}
              {contract.writeFunctions.length > 0 && (
                <div className="functions-section">
                  <h3>✍️ Write</h3>
                  <div className="write-grid">
                    {contract.writeFunctions.map((writeFunc) => {
                      const key = `${contract.name}-${writeFunc.functionName}`;
                      const result = results[key] || { status: "idle" };

                      return (
                        <div
                          key={writeFunc.functionName}
                          className="write-item"
                        >
                          <div className="write-header">
                            <strong>{writeFunc.name}</strong>
                            {writeFunc.signature && (
                              <code className="write-sig">
                                {writeFunc.signature}
                              </code>
                            )}
                            <span className="write-desc">
                              {writeFunc.description}
                            </span>
                          </div>

                          {writeFunc.inputs && writeFunc.inputs.length > 0 && (
                            <div className="write-inputs">
                              {writeFunc.inputs.map((input) => (
                                <input
                                  key={input.name}
                                  type={input.type}
                                  placeholder={input.placeholder}
                                  value={inputs[key]?.[input.name] || ""}
                                  onChange={(e) =>
                                    setInputs((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        [input.name]: e.target.value,
                                      },
                                    }))
                                  }
                                  maxLength={input.maxLength}
                                  required={input.required}
                                  className="write-input"
                                />
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleWrite(contract, writeFunc)}
                            disabled={isWritePending}
                            className="write-btn"
                          >
                            {isWritePending ? "..." : "Execute"}
                          </button>

                          <ResultDisplay result={result} compact />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Compact Instructions */}
      <div className="instructions">
        <h3>💡 Quick Guide</h3>
        <ol>
          <li>Get tokens from faucet (top bar)</li>
          <li>Deposit PAS to fund habits</li>
          <li>Create & prepare habits</li>
          <li>Check in daily, settle when done</li>
        </ol>
      </div>

      <style>{`
        .test-page.compact {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .page-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
          color: var(--text-color);
        }

        .page-header p {
          color: var(--text-muted);
          font-size: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
          padding: 16px;
          background: var(--bg-light);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .info-item .label {
          font-weight: 600;
          color: var(--text-muted);
        }

        .happy-path-section {
          background: linear-gradient(135deg, rgba(64, 144, 255, 0.1), rgba(64, 144, 255, 0.05));
          border: 2px solid var(--primary-color);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(64, 144, 255, 0.15);
        }

        .happy-path-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .happy-path-header h2 {
          font-size: 24px;
          margin-bottom: 8px;
          color: var(--text-color);
        }

        .happy-path-header p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .happy-path-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .happy-path-steps {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          padding: 16px;
          background: var(--bg-light);
          border-radius: 12px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .happy-path-steps span:not(:nth-child(2n)) {
          color: var(--text-color);
          font-weight: 500;
        }

        .happy-path-btn {
          padding: 14px 32px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(64, 144, 255, 0.3);
        }

        .happy-path-btn:hover:not(:disabled) {
          background: var(--primary-hover, #5090ff);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(64, 144, 255, 0.4);
        }

        .happy-path-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .happy-path-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: var(--bg-light);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color);
          min-width: 300px;
          justify-content: center;
        }

        .happy-path-info {
          padding: 10px 20px;
          background: rgba(64, 144, 255, 0.1);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-color);
        }

        .happy-path-info strong {
          color: var(--primary-color);
          font-size: 16px;
        }

        .contract-section {
          background: var(--bg-light);
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
          border-radius: 12px 12px 0 0;
        }

        .contract-header:hover {
          background: var(--bg-hover);
        }

        .contract-title {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .contract-title h2 {
          font-size: 20px;
          margin: 0;
          color: var(--text-color);
        }

        .address {
          font-family: monospace;
          font-size: 13px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .contract-content {
          padding: 0 20px 20px;
        }

        .functions-section {
          margin-bottom: 16px;
        }

        .functions-section h3 {
          font-size: 16px;
          margin-bottom: 12px;
          color: var(--text-color);
          font-weight: 600;
        }

        .read-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .read-item {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: var(--bg-color);
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid var(--border-color);
        }

        .read-label {
          font-weight: 600;
          color: var(--text-muted);
          min-width: 100px;
        }

        .read-value {
          font-family: monospace;
          word-break: break-all;
          color: var(--text-color);
        }

        .write-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        .write-item {
          padding: 16px;
          background: var(--bg-color);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid var(--border-color);
        }

        .write-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .write-header strong {
          font-size: 15px;
          color: var(--text-color);
        }

        .write-sig {
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-light);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          display: inline-block;
          margin: 2px 0;
        }

        .write-desc {
          font-size: 13px;
          color: var(--text-muted);
        }

        .write-inputs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .write-input {
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-light);
          color: var(--text-color);
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .write-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(64, 144, 255, 0.1);
        }

        .write-btn {
          padding: 10px 16px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .write-btn:hover:not(:disabled) {
          background: var(--primary-hover, #5090ff);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(64, 144, 255, 0.3);
        }

        .write-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .result {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          border-left: 4px solid;
        }

        .result.compact {
          padding: 8px 10px;
        }

        .result.pending,
        .result.confirming {
          background: rgba(64, 144, 255, 0.1);
          border-color: var(--primary-color);
          color: var(--text-color);
        }

        .result.success {
          background: rgba(40, 167, 69, 0.1);
          border-color: var(--brand-green, #28a745);
          color: var(--text-color);
        }

        .result.error {
          background: rgba(220, 53, 69, 0.1);
          border-color: var(--brand-pink, #dc3545);
          color: var(--text-color);
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .result-row {
          display: flex;
          gap: 8px;
          font-family: monospace;
          font-size: 12px;
        }

        .result-row span:first-child {
          font-weight: 600;
        }

        .result-row span:last-child {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .result-error {
          color: var(--brand-pink, #dc3545);
          font-size: 12px;
          margin-top: 6px;
          word-break: break-word;
        }

        .status-icon.spin {
          animation: spin 1s linear infinite;
        }

        .status-icon.success {
          color: var(--brand-green, #28a745);
        }

        .status-icon.error {
          color: var(--brand-pink, #dc3545);
        }

        .link-icon {
          color: var(--primary-color);
          display: inline-flex;
          align-items: center;
        }

        .link-icon:hover {
          opacity: 0.7;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .alert.warning {
          background: rgba(255, 193, 7, 0.1);
          color: var(--text-color);
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .alert.error {
          background: rgba(220, 53, 69, 0.1);
          color: var(--text-color);
          border: 1px solid rgba(220, 53, 69, 0.3);
        }

        .instructions {
          background: var(--bg-light);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
        }

        .instructions h3 {
          font-size: 18px;
          margin-bottom: 12px;
          color: var(--text-color);
        }

        .instructions ol {
          margin: 0;
          padding-left: 24px;
        }

        .instructions li {
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.6;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .test-page.compact {
            padding: 12px;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .page-header p {
            font-size: 14px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .happy-path-section {
            padding: 16px;
          }

          .happy-path-header h2 {
            font-size: 20px;
          }

          .happy-path-steps {
            font-size: 12px;
            gap: 8px;
            padding: 12px;
          }

          .happy-path-btn {
            font-size: 14px;
            padding: 12px 24px;
          }

          .happy-path-status {
            min-width: auto;
            width: 100%;
            font-size: 13px;
          }

          .read-grid,
          .write-grid {
            grid-template-columns: 1fr;
          }

          .contract-header {
            padding: 12px 16px;
          }

          .contract-title h2 {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
