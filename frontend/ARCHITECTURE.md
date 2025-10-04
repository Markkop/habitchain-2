# Frontend Architecture

## Overview

This frontend is built with React, TypeScript, and Wagmi for blockchain interactions. The architecture follows modern React patterns with clear separation of concerns.

## Directory Structure

```
src/
├── components/           # React components
│   └── HabitTracker/    # Feature-based component organization
│       ├── index.tsx           # Main component
│       ├── StatsBar.tsx        # Stats display
│       ├── DepositSection.tsx  # Deposit/withdraw
│       ├── CreateHabitSection.tsx
│       ├── PrepareDaySection.tsx
│       ├── SettleDaySection.tsx
│       ├── HabitsList.tsx
│       └── README.md
├── hooks/               # Custom React hooks
│   ├── useHabitContract.ts   # Contract read operations
│   └── useHabitData.ts       # Data fetching and state
├── utils/               # Utility functions
│   ├── logger.ts             # Transaction logging
│   └── habitHelpers.ts       # Contract data helpers
├── types/               # TypeScript definitions
│   └── habit.ts              # Type definitions
├── generated.ts         # Auto-generated from wagmi
├── wagmi-config.ts      # Wagmi configuration
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Design Patterns

### 1. Component Organization

**Feature-Based Structure**: Components are grouped by feature (HabitTracker) rather than type (buttons, forms).

**Atomic Design Principles**:

- Small, focused components
- Single responsibility
- Composable and reusable
- Props-driven

### 2. State Management

**Local State**: Component-specific state using `useState`
**Server State**: Blockchain data using Wagmi hooks
**Derived State**: Computed from blockchain data

**No Global State Library**: App is simple enough to use props drilling and context where needed.

### 3. Hooks Pattern

**Custom Hooks** for reusable logic:

- `useHabitContract`: Contract interactions
- `useHabitData`: Data fetching
- Wagmi hooks: `useWriteContract`, `useWaitForTransactionReceipt`, etc.

### 4. Type Safety

**TypeScript throughout**:

- Strict mode enabled
- Explicit types for props
- Type definitions in `/types`
- Auto-generated types from wagmi

### 5. Transaction Logging

Consistent logging pattern:

```typescript
// Start
logTransaction(emoji, action, message, functionName, args);

// Status updates
logTxStatus(emoji, action, "submitted", hash);
logTxStatus(emoji, action, "success", details);
logTxStatus(emoji, action, "failed", error);
```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                    App.tsx                      │
│  - Wallet connection                            │
│  - Chain info                                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            HabitTracker/index.tsx               │
│  - useHabitContract (reads)                     │
│  - useHabitData (fetch habits)                  │
│  - Orchestrates child components                │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│  StatsBar    │    │  DepositSection  │
│              │    │  - Write txs     │
│  - Display   │    │  - Wait receipt  │
│  - Loading   │    │  - Refetch       │
└──────────────┘    └──────────────────┘
```

## Component Communication

1. **Props Down**: Parent passes data and callbacks
2. **Callbacks Up**: Children trigger `onSuccess()` for refreshes
3. **Events**: Contract events update UI automatically

## Blockchain Integration

### Wagmi Hooks Used

**Read Operations**:

- `useReadHabitTrackerUserStates`: User balances
- `useReadHabitTrackerEpochNow`: Current epoch
- `useReadHabitTrackerUserHabitCounters`: Habit count
- `readContract`: Manual reads for habit details

**Write Operations**:

- `useWriteContract`: Initiate transactions
- `useWaitForTransactionReceipt`: Wait for confirmation

**Events**:

- `useWatchContractEvent`: Listen for contract events

### Transaction Pattern

```typescript
const { writeContract, data: hash, isPending } = useWriteContract();
const { isSuccess } = useWaitForTransactionReceipt({ hash });

// 1. Log start
logTransaction(...)

// 2. Send transaction
writeContract({...}, {
  onSuccess: (hash) => logTxStatus(..., "submitted", hash),
  onError: (error) => logTxStatus(..., "failed", error)
});

// 3. Wait for receipt
useEffect(() => {
  if (isSuccess) {
    logTxStatus(..., "success", "...")
    onSuccess() // Refresh data
  }
}, [isSuccess]);
```

## Styling

**CSS-in-JS**: No - Using traditional CSS
**CSS Modules**: No - Using global classes
**Tailwind**: No - Custom CSS variables

**CSS Structure**:

- Variables in `:root`
- BEM-like naming
- Responsive with media queries
- Mobile-first approach

## Error Handling

1. **Connection Errors**: Redirect to connect wallet
2. **Transaction Errors**: User-friendly messages
3. **Contract Errors**: Parse and display
4. **Network Issues**: Loading states and retries

## Performance Considerations

1. **Lazy Loading**: Not needed (small app)
2. **Memoization**: Used where beneficial
3. **Optimistic Updates**: Not implemented (blockchain is source of truth)
4. **Debouncing**: Input validation
5. **Code Splitting**: Automatic with Vite

## Testing Strategy

Current setup:

- Vitest for unit tests
- Playwright for E2E tests
- Test files colocated with components

## Build & Deployment

- **Bundler**: Vite
- **TypeScript**: Strict mode
- **Linting**: ESLint
- **Formatting**: Prettier (if configured)

## Environment Variables

Required:

- RPC endpoints configured in wagmi-config
- No API keys needed for testnet

## Future Improvements

1. **State Management**: Consider Zustand if app grows
2. **Caching**: Implement SWR or React Query
3. **Optimistic UI**: Show expected results immediately
4. **Notifications**: Toast library for better UX
5. **Analytics**: Track user interactions
6. **Error Boundary**: Catch rendering errors
7. **Suspense**: For async components
8. **Web Workers**: For heavy computations
