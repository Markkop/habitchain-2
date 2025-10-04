import { passetHub } from "../../wagmi-config";
import { useHabitContract } from "../../hooks/useHabitContract";
import { useHabitData } from "../../hooks/useHabitData";
import { StatsBar } from "./StatsBar";
import { ActionCards } from "./ActionCards";
import { HabitsList } from "./HabitsList";

interface HabitTrackerProps {
  isConnected: boolean;
  onConnect: () => void;
}

export function HabitTracker({ isConnected, onConnect }: HabitTrackerProps) {
  const {
    address,
    chainId,
    contractAddress,
    userState,
    userStateError,
    userStateLoading,
    habitCounter,
    currentEpoch,
    refetchUserState,
    refetchHabitCounter,
    refetchEpoch,
    abi,
  } = useHabitContract();

  const { habits, habitStatuses, refetchHabits } = useHabitData(
    address,
    contractAddress,
    habitCounter,
    currentEpoch
  );

  const handleRefetch = () => {
    refetchUserState();
    refetchHabitCounter();
    refetchEpoch();
    refetchHabits();
  };

  if (!contractAddress) {
    return (
      <div className="section-card">
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

  return (
    <div className="habit-tracker-container">
      <StatsBar
        isConnected={isConnected}
        userState={userState}
        userStateLoading={userStateLoading}
        userStateError={userStateError}
        contractAddress={contractAddress}
        abi={abi}
        onSuccess={handleRefetch}
      />

      <ActionCards
        isConnected={isConnected}
        onConnect={onConnect}
        address={address}
        contractAddress={contractAddress}
        abi={abi}
        chainId={chainId}
        currentEpoch={currentEpoch}
        habitStatuses={habitStatuses}
        onSuccess={handleRefetch}
      />

      <HabitsList
        isConnected={isConnected}
        onConnect={onConnect}
        address={address}
        contractAddress={contractAddress}
        abi={abi}
        habits={habits}
        habitStatuses={habitStatuses}
        currentEpoch={currentEpoch}
        onSuccess={handleRefetch}
      />
    </div>
  );
}
