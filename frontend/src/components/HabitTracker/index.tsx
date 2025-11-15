import { passetHub } from "../../wagmi-config";
import { useContracts } from "../../hooks/useContracts";
import { useHabitData } from "../../hooks/useHabitData";
import { StatsBar } from "./StatsBar";
import { ActionCards } from "./ActionCards";
import { HabitsList } from "./HabitsList";
import { GroupsList } from "./GroupsList";

interface HabitTrackerProps {
  isConnected: boolean;
  onConnect: () => void;
}

export function HabitTracker({ isConnected, onConnect }: HabitTrackerProps) {
  const {
    address,
    chainId,
    habitTracker,
    habitSettler,
    userState,
    userStateError,
    userStateLoading,
    habitCounter,
    currentEpoch,
    refetchUserState,
    refetchHabitCounter,
    refetchEpoch,
  } = useContracts();

  const { habits, habitStatuses, refetchHabits } = useHabitData(
    address,
    habitTracker.address,
    habitCounter,
    currentEpoch
  );

  const handleRefetch = () => {
    refetchUserState();
    refetchHabitCounter();
    refetchEpoch();
    refetchHabits();
  };

  if (!habitTracker.address || !habitSettler.address) {
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
        contractAddress={habitTracker.address}
        abi={habitTracker.abi}
        onSuccess={handleRefetch}
      />

      <ActionCards
        isConnected={isConnected}
        onConnect={onConnect}
        address={address}
        habitTrackerAddress={habitTracker.address}
        habitTrackerAbi={habitTracker.abi}
        habitSettlerAddress={habitSettler.address}
        habitSettlerAbi={habitSettler.abi}
        chainId={chainId}
        currentEpoch={currentEpoch}
        habitStatuses={habitStatuses}
        onSuccess={handleRefetch}
      />

      <HabitsList
        isConnected={isConnected}
        onConnect={onConnect}
        address={address}
        contractAddress={habitTracker.address}
        abi={habitTracker.abi}
        habits={habits}
        habitStatuses={habitStatuses}
        currentEpoch={currentEpoch}
        onSuccess={handleRefetch}
      />

      <GroupsList
        isConnected={isConnected}
        onConnect={onConnect}
        address={address}
      />
    </div>
  );
}
