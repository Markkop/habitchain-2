import { useState } from "react";
import type { Habit, DailyStatus } from "../../types/habit";

interface HabitCardButton {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "warning";
}

interface HabitCardProps {
  // Creation mode props
  isCreationMode?: boolean;
  creationValue?: string;
  onCreationChange?: (value: string) => void;
  maxLength?: number;

  // Display mode props
  habit?: Habit;
  habitStatus?: DailyStatus;

  // Common props
  buttons: HabitCardButton[];
}

export function HabitCard({
  isCreationMode = false,
  creationValue = "",
  onCreationChange,
  maxLength = 32,
  habit,
  habitStatus,
  buttons,
}: HabitCardProps) {
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

  return (
    <div className="habit-card">
      <div className="habit-card-layout">
        <div className="habit-card-left">
          {isCreationMode ? (
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                placeholder="Habit description (max 32 chars)"
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
                <div className="habit-name">{habit?.text}</div>
                {habitStatus && (
                  <div className="habit-badges-inline">
                    {habitStatus.funded && (
                      <span className="badge badge-success">✓ Funded</span>
                    )}
                    {!habitStatus.funded && (
                      <span className="badge badge-error">✗ Not Funded</span>
                    )}
                    {habitStatus.checked && (
                      <span className="badge badge-info">✓ Checked In</span>
                    )}
                  </div>
                )}
              </div>
              <div className="habit-meta">
                ID: {habit?.id} | Epoch {habit?.createdAtEpoch.toString()}
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

      {isCreationMode && (
        <p className="hint-text" style={{ marginTop: "8px", marginBottom: 0 }}>
          💡 Each habit costs 10 PAS per day
        </p>
      )}
    </div>
  );
}
