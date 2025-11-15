import { useState, useEffect } from "react";
import { GroupCard } from "./GroupCard";

interface GroupMember {
  address: string;
  name?: string;
  avatar?: string;
}

interface Group {
  id: string;
  name: string;
  members: GroupMember[];
  lastSettlement?: {
    type: "slashed" | "earned";
    amount?: string;
  };
}

interface GroupsListProps {
  isConnected: boolean;
  onConnect: () => void;
  address: `0x${string}` | undefined;
}

// Mock groups data - demo only, client-side only
const generateMockGroups = (currentAddress?: string): Group[] => {
  if (!currentAddress) return [];

  // Generate some mock members
  const mockMembers: GroupMember[] = [
    {
      address: currentAddress,
      name: "You",
    },
    {
      address: "0x1234567890123456789012345678901234567890",
      name: "Alice",
    },
    {
      address: "0x2345678901234567890123456789012345678901",
      name: "Bob",
    },
    {
      address: "0x3456789012345678901234567890123456789012",
      name: "Charlie",
    },
  ];

  return [
    {
      id: "1",
      name: "30-Day Coding Sprint",
      members: [mockMembers[0], mockMembers[1], mockMembers[2]],
      lastSettlement: {
        type: "earned",
        amount: "5 PAS",
      },
    },
    {
      id: "2",
      name: "Morning Workout Crew",
      members: [mockMembers[0], mockMembers[1], mockMembers[3]],
      lastSettlement: {
        type: "slashed",
      },
    },
    {
      id: "3",
      name: "Study Group",
      members: [mockMembers[0], mockMembers[2]],
      lastSettlement: {
        type: "earned",
        amount: "2 PAS",
      },
    },
  ];
};

export function GroupsList({
  isConnected,
  onConnect,
  address,
}: GroupsListProps) {
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<Group[]>(() =>
    generateMockGroups(address)
  );

  // Update groups when address changes
  useEffect(() => {
    if (address) {
      setGroups(generateMockGroups(address));
    }
  }, [address]);

  const handleCreateGroup = () => {
    if (!isConnected) {
      onConnect();
      return;
    }
    if (!groupName || groupName.length < 3) return;

    const newGroup: Group = {
      id: Date.now().toString(),
      name: groupName,
      members: address
        ? [
            {
              address: address,
              name: "You",
            },
          ]
        : [],
    };

    setGroups([...groups, newGroup]);
    setGroupName("");
  };

  const handleLeaveGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  return (
    <div className="section-card">
      <h3>Groups (demo only)</h3>
      <div className="habits-list">
        {/* Creation card - always shown first */}
        <GroupCard
          isCreationMode
          creationValue={groupName}
          onCreationChange={setGroupName}
          buttons={[
            {
              label: isConnected
                ? "Create"
                : "Connect Wallet",
              onClick: handleCreateGroup,
              disabled: isConnected && groupName.length < 3,
              variant: "primary",
            },
          ]}
        />

        {/* Existing groups */}
        {!isConnected ? (
          <p className="hint-text">Connect wallet to view groups</p>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              currentUserAddress={address}
              buttons={[
                {
                  label: "Leave",
                  onClick: () => handleLeaveGroup(group.id),
                  variant: "warning",
                },
              ]}
            />
          ))
        )}
      </div>
    </div>
  );
}

