import { useState } from "react";
import { Plus } from "lucide-react";

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

interface GroupCardButton {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "warning";
}

interface GroupCardProps {
  // Creation mode props
  isCreationMode?: boolean;
  creationValue?: string;
  onCreationChange?: (value: string) => void;
  maxLength?: number;

  // Display mode props
  group?: Group;
  currentUserAddress?: string;

  // Common props
  buttons: GroupCardButton[];
  onInviteClick?: () => void;
}

export function GroupCard({
  isCreationMode = false,
  creationValue = "",
  onCreationChange,
  maxLength = 32,
  group,
  currentUserAddress,
  buttons,
  onInviteClick,
}: GroupCardProps) {
  const [showInvitePopup, setShowInvitePopup] = useState(false);

  const getButtonClassName = (variant?: string) => {
    switch (variant) {
      case "success":
        return "btn-success";
      case "secondary":
        return "btn-secondary";
      case "warning":
        return "btn-warning";
      default:
        return "btn-primary";
    }
  };

  // Generate robohash avatar URL
  const getAvatarUrl = (member: GroupMember) => {
    if (member.avatar) {
      return member.avatar;
    }
    // Use robohash.org to generate avatar from address
    // Using set1 (robots) and size 32x32 to match our avatar size
    return `https://robohash.org/${member.address}?set=set1&size=32x32`;
  };

  // Generate avatar content
  const getAvatarContent = (member: GroupMember) => {
    return <img src={getAvatarUrl(member)} alt={member.name || member.address} />;
  };

  // Separate current user from other members
  const currentUser = group?.members.find(
    (m) => m.address.toLowerCase() === currentUserAddress?.toLowerCase()
  );
  const otherMembers = group?.members.filter(
    (m) => m.address.toLowerCase() !== currentUserAddress?.toLowerCase()
  ) || [];

  const handleInviteClick = () => {
    setShowInvitePopup(true);
    onInviteClick?.();
  };

  return (
    <>
      <div className="habit-card">
        <div className="habit-card-layout">
          <div className="habit-card-left">
            {isCreationMode ? (
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  placeholder="Group name (max 32 chars)"
                  value={creationValue}
                  onChange={(e) => onCreationChange?.(e.target.value)}
                  maxLength={maxLength}
                  className="minimal-input"
                  autoFocus
                />
                <span className="char-counter">
                  {creationValue.length}/{maxLength}
                </span>
              </div>
            ) : (
              <>
                <div className="habit-title-row">
                  <div className="habit-name">{group?.name}</div>
                  <div className="group-avatars-stack">
                    {/* Current user avatar - always first */}
                    {currentUser && (
                      <div className="group-avatar" title={currentUser.name || currentUser.address}>
                        {getAvatarContent(currentUser)}
                      </div>
                    )}
                    {/* Other members - overlapping */}
                    {otherMembers.slice(0, 3).map((member, idx) => (
                      <div
                        key={member.address}
                        className="group-avatar"
                        style={{ marginLeft: "-8px" }}
                        title={member.name || member.address}
                      >
                        {getAvatarContent(member)}
                      </div>
                    ))}
                    {/* Invite button as avatar */}
                    <div
                      className="group-avatar group-avatar-invite"
                      onClick={handleInviteClick}
                      style={{
                        marginLeft: otherMembers.length > 0 ? "-8px" : currentUser ? "8px" : "0",
                      }}
                      title="Invite member"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                <div className="habit-meta">
                  {group?.lastSettlement ? (
                    group.lastSettlement.type === "slashed" ? (
                      <>Last settlement: slashed</>
                    ) : (
                      <>Last settlement: earned {group.lastSettlement.amount || "X"}</>
                    )
                  ) : (
                    <>No settlements yet</>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="habit-card-right">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                disabled={button.disabled}
                className={getButtonClassName(button.variant)}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invite popup */}
      {showInvitePopup && (
        <div className="invite-popup-overlay" onClick={() => setShowInvitePopup(false)}>
          <div className="invite-popup" onClick={(e) => e.stopPropagation()}>
            <h4>Group Feature Coming Soon</h4>
            <p>Invite functionality will be available in a future update.</p>
            <button
              className="btn-primary"
              onClick={() => setShowInvitePopup(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

