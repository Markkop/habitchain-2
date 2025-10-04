import { useState, useEffect, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { logTransaction, logTxStatus } from "../../utils/logger";
import { textToBytes32 } from "../../utils/habitHelpers";
import { setupPolkadotTestnet } from "../../utils/networkSetup";
import type { Habit, DailyStatus } from "../../types/habit";
import { HabitCard } from "./HabitCard";

interface HabitsListProps {
  isConnected: boolean;
  onConnect: () => void;
  address: `0x${string}` | undefined;
  contractAddress: `0x${string}`;
  abi: any;
  habits: Record<number, Habit>;
  habitStatuses: Record<number, DailyStatus>;
  currentEpoch: bigint | undefined;
  onSuccess: () => void;
}

export function HabitsList({
  isConnected,
  onConnect,
  address,
  contractAddress,
  abi,
  habits,
  habitStatuses,
  currentEpoch,
  onSuccess,
}: HabitsListProps) {
  const [habitText, setHabitText] = useState("");
  const [createToastId, setCreateToastId] = useState<string | number>();
  const [checkInToastId, setCheckInToastId] = useState<string | number>();
  const createHandledRef = useRef(false);
  const checkInHandledRef = useRef(false);

  // Create habit contract interaction
  const {
    writeContract: createHabit,
    data: createHabitHash,
    isPending: isCreateHabitPending,
  } = useWriteContract();

  const { isSuccess: isCreateHabitSuccess } = useWaitForTransactionReceipt({
    hash: createHabitHash,
  });

  // Check-in contract interaction
  const {
    writeContract: checkIn,
    data: checkInHash,
    isPending: isCheckInPending,
  } = useWriteContract();

  const { isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt({
    hash: checkInHash,
  });

  useEffect(() => {
    if (isCreateHabitSuccess && !createHandledRef.current) {
      createHandledRef.current = true;
      logTxStatus(
        "✨",
        "Create Habit",
        "success",
        "new habit created",
        createToastId
      );
      setCreateToastId(undefined);
      onSuccess();
    }
  }, [isCreateHabitSuccess, createToastId, onSuccess]);

  useEffect(() => {
    if (isCheckInSuccess && !checkInHandledRef.current) {
      checkInHandledRef.current = true;
      logTxStatus(
        "✓",
        "Check-in",
        "success",
        "habit checked in",
        checkInToastId
      );
      setCheckInToastId(undefined);
      onSuccess();
    }
  }, [isCheckInSuccess, checkInToastId, onSuccess]);

  const handleCreateHabit = async () => {
    if (!isConnected) {
      await setupPolkadotTestnet();
      return;
    }
    if (!habitText) return;

    createHandledRef.current = false; // Reset for new transaction
    const bytes32Text = textToBytes32(habitText);
    const id = logTransaction(
      "✨",
      "Create Habit",
      `Creating "${habitText}"`,
      "createHabit",
      { text: bytes32Text }
    );
    setCreateToastId(id);

    createHabit(
      {
        address: contractAddress,
        abi,
        functionName: "createHabit",
        args: [bytes32Text],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("✨", "Create Habit", "submitted", hash, id);
        },
        onError: (error) => {
          logTxStatus("✨", "Create Habit", "failed", error.message, id);
          setCreateToastId(undefined);
        },
      }
    );
    setHabitText("");
  };

  const handleCheckIn = (habitId: number) => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!address || !currentEpoch) return;

    checkInHandledRef.current = false; // Reset for new transaction
    const id = logTransaction(
      "✓",
      "Check-in",
      `Checking in habit ${habitId} for epoch ${currentEpoch}`,
      "checkIn",
      { habitId, epoch: currentEpoch }
    );
    setCheckInToastId(id);

    checkIn(
      {
        address: contractAddress,
        abi,
        functionName: "checkIn",
        args: [habitId, currentEpoch],
      },
      {
        onSuccess: (hash) => {
          logTxStatus("✓", "Check-in", "submitted", hash, id);
        },
        onError: (error) => {
          logTxStatus("✓", "Check-in", "failed", error.message, id);
          setCheckInToastId(undefined);
        },
      }
    );
  };

  const handleAchieve = (habitId: number) => {
    // Placeholder for future implementation
    console.log("Achieve habit:", habitId);
  };

  const activeHabits = Object.values(habits).filter((habit) => !habit.archived);

  return (
    <div className="section-card">
      <h3>📋 Your Habits</h3>
      <div className="habits-list">
        {/* Creation card - always shown first */}
        <HabitCard
          isCreationMode
          creationValue={habitText}
          onCreationChange={setHabitText}
          buttons={[
            {
              label: isConnected
                ? isCreateHabitPending
                  ? "Pending..."
                  : "Create"
                : "Connect Wallet",
              onClick: handleCreateHabit,
              disabled:
                isCreateHabitPending || (isConnected && habitText.length < 3),
              variant: "primary",
            },
          ]}
        />

        {/* Existing habits - only show when connected */}
        {!isConnected ? (
          <p className="hint-text">Connect wallet to view your habits</p>
        ) : (
          activeHabits.map((habit) => {
            const status = habitStatuses[habit.id];
            const hasStatus = !!status;
            const canCheckIn = hasStatus && status.funded && !status.checked;
            const isCheckedIn = hasStatus && status.checked;

            const buttons = [];

            // Archive button (always shown, but disabled if not checked in)
            buttons.push({
              label: "Archive",
              onClick: () => handleAchieve(habit.id),
              disabled: !isCheckedIn,
              variant: "warning" as const,
            });

            // Check-in button
            if (canCheckIn) {
              buttons.push({
                label: isCheckInPending ? "Pending..." : "Check In",
                onClick: () => handleCheckIn(habit.id),
                disabled: isCheckInPending,
                variant: "success" as const,
              });
            }

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                habitStatus={status}
                buttons={buttons}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
