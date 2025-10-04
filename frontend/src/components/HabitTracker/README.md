# HabitTracker Component Architecture

This directory contains a refactored, componentized version of the HabitTracker feature.

## Structure

```
HabitTracker/
├── index.tsx                  # Main component orchestrating all parts
├── StatsBar.tsx              # Displays user stats (available, staked, rewards, habits)
├── DepositSection.tsx        # Handles deposits and withdrawals
├── CreateHabitSection.tsx    # Form to create new habits
├── PrepareDaySection.tsx     # Prepare day functionality with event watching
├── SettleDaySection.tsx      # Settlement logic for past days
├── HabitsList.tsx            # Displays active habits with check-in functionality
└── README.md                 # This file
```

## Design Principles

### 1. **Separation of Concerns**

- Each section is isolated in its own component
- Components handle their own state and transactions
- Parent component (`index.tsx`) orchestrates data flow

### 2. **Reusable Hooks**

- `useHabitContract`: Handles contract reads and connection state
- `useHabitData`: Fetches and manages habit data from blockchain

### 3. **Shared Utilities**

- `/utils/logger.ts`: Consistent transaction logging
- `/utils/habitHelpers.ts`: Contract data conversion utilities
- `/types/habit.ts`: TypeScript type definitions

### 4. **Props Pattern**

All components follow consistent prop patterns:

- `isConnected`: Current wallet connection status
- `onConnect`: Function to trigger wallet connection
- `contractAddress`: Current contract address
- `abi`: Contract ABI
- `onSuccess`: Callback after successful transactions

## Component Responsibilities

### StatsBar

- Displays user balances and stats
- Shows loading/error states
- Responsive layout

### DepositSection

- Deposit form with validation
- Withdraw all functionality
- Success notifications
- Transaction logging

### CreateHabitSection

- Habit creation form
- Character counter (32 max)
- Input validation
- Transaction logging

### PrepareDaySection

- Locks funds for today's habits
- Listens for DayPrepared events
- Shows funding status messages
- Transaction logging

### SettleDaySection

- Settle yesterday's habits
- Force settle (testing only)
- Listens for settlement events
- Detailed success/failure messages
- Transaction logging

### HabitsList

- Displays all active habits
- Shows habit status badges
- Check-in functionality
- Transaction logging

## Usage

```typescript
import { HabitTracker } from './components/HabitTracker';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    // Connection logic
  };

  return (
    <HabitTracker
      isConnected={isConnected}
      onConnect={handleConnect}
    />
  );
}
```

## Transaction Flow

1. User initiates action (deposit, create habit, etc.)
2. Component validates input
3. If not connected, triggers `onConnect()`
4. Logs transaction start with `logTransaction()`
5. Submits transaction via wagmi
6. Logs submission with `logTxStatus("submitted")`
7. Waits for receipt via `useWaitForTransactionReceipt`
8. Logs success/failure with `logTxStatus("success"/"failed")`
9. Calls `onSuccess()` to refresh data
10. Updates UI with new state

## Event Watching

Components use `useWatchContractEvent` to listen for:

- `DayPrepared`: Shows preparation results
- `SettledSuccess`: Shows settlement rewards
- `SettledFail`: Shows forfeited amounts

Events are filtered by user address and update UI automatically.

## Error Handling

All components handle:

- Connection errors (redirect to connect)
- Transaction rejection
- Contract errors (with user-friendly messages)
- Network issues

## Styling

Components use CSS classes from `App.css`:

- `.section-card`: Main container
- `.btn-primary`: Primary action buttons
- `.btn-secondary`: Secondary actions
- `.status-banner`: Success/error/warning messages
- `.habit-stats-bar`: Stats display
- `.habits-list`: Habit items container

## Future Improvements

- Add optimistic UI updates
- Implement transaction queuing
- Add undo functionality
- Support batch operations
- Add habit archiving UI
- Implement habit editing
