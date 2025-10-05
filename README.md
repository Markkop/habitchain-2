# HabitChain (Polkadot EVM)

HabitChain is a Polkadot‑based dApp that turns self‑discipline into a financial commitment.  

Users lock funds on their own habit, complete daily check‑ins, and—if successful—reclaim their stake plus yield.  
If they fail, the locked fund is slashed to the protocol treasury (or, in groups, redistributed to successful peers).  
  
The prototype proves one essential on‑chain action: **commit → check‑in → settle** on the Paseo testnet via an EVM smart contract.  
  
By adding real consequences and immediate feedback, HabitChain closes the “motivation gap”, aligning personal progress with tangible rewards.  


## Details

- Network: Paseo — Polkadot Hub Testnet (Passet Hub EVM)
- Address: [0x051BBa8e3b012DA48eeED11fEdF1DB189a3f0972](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x051BBa8e3b012DA48eeED11fEdF1DB189a3f0972)
- ABI: [https://github.com/Markkop/habitchain-2/blob/5796cec97438a4a9e4a692102478c35a4d712931/frontend/src/generated.ts#L102](https://github.com/Markkop/habitchain-2/blob/5796cec97438a4a9e4a692102478c35a4d712931/frontend/src/generated.ts#L102)

## Testing Instructions

1. Go to https://markkop.github.io/habitchain-2/
2. Setup/connect wallet (see [Connecting to Polkadot](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot/))
3. Deposit funds
4. Create two habits
5. Fund habits (It costs 10 PAS each)
6. Check-in one habit, but don't do the other
7. Force settle to avoid needing to wait until 00:00 UTC
8. Notice you know have 10 PAS as rewards from the checked-in habit and see some extra yield

Note: you might need to refresh the page in between some steps if the UI don't update

## Technology Stack

This project was bootstraped with [kitdot](https://github.com/w3b3d3v/kitdot/) and includes the following:

- [OpenZeppelin](https://docs.openzeppelin.com/contracts/5.x/) smart contract library.
- [hardhat](https://hardhat.org/) smart contract development tooling.
- [wagmi](https://wagmi.sh/) for smart contract interaction.
- [Tailwind CSS](https://tailwindcss.com) + [Tailwind UI](https://tailwindui.com/).
- [Vite](https://vite.dev/) for dev tooling.

## Team

- [Markkop](https://github.com/Markkop)
- [dutragustavo](https://github.com/dutragustavo)
- [hpereira1](https://github.com/hpereira1)
- [artur-simon](https://github.com/artur-simon)

## References

- [Guia de Desenvolvimento para Hackathons Polkadot](https://polkadot-survival-guide.w3d.community/pt)
- [Hacker's Survival Guide](https://github.com/w3b3d3v/hackers-survival-guide/blob/main/docs/pt/README.md)
- [Connecting to Polkadot](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot/)
- [Polkadot Hardhat](https://docs.polkadot.com/develop/smart-contracts/dev-environments/hardhat/)
- [@parity/hardhat-polkadot](https://github.com/paritytech/hardhat-polkadot)
- [Native Smart Contracts](https://docs.polkadot.com/develop/smart-contracts/overview/#native-smart-contracts)
- [LatinHack 2025](https://luma.com/latinhack)
- [NERDCONF Discord](https://discord.gg/37Fp3wrqYm)

## Development Setup Instructions

### Frontend

- Clone the repository
- Open a terminal for the frontend and run`cd frontend && npm install`
- Run `npm run dev` in the frontend folder
- Setup your wallet in your browser (see [Connecting to Polkadot](https://docs.polkadot.com/develop/smart-contracts/connect-to-polkadot/) or use the "Setup Polkadot Hub TestNet" button on the UI if available)
- For faucet tokens use the [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111)
- Connect your wallet to the dApp and try interacting with the contract.

### Contracts

- Open a terminal for the contracts and run `cd contracts && npm install`
- Run `npx hardhat compile` to compile the contracts
- Run `npx hardhat test` to run the tests
- Run `npx hardhat vars set PRIVATE_KEY "INSERT_PRIVATE_KEY"` to set the private key. Use the one from your [wallet](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/).
- Run `npx hardhat ignition deploy ./ignition/modules/HabitTracker.ts --network polkadotHubTestnet` to deploy the contracts
- If erroring, you may need to reset the deployment, run `rm -rf ignition/deployments/` and deploy again.
- If erroring with a message like `errors: [ { field: 'data', error: 'initcode is too big: 105412' } ]`, you will need to make the contract smaller/more optimized. We can only deploy 100kb contracts at the moment.

### Frontend <> Contracts

- Run `npm run generate` or `npx wagmi generate` in the frontend directory to generate the types from the contracts.
- If you run into issues, for now, ask the AI to help. It will probably copy/update ABI and addresses so the frontend gets the updated code.

### In Summary for updating a contract

- `npx hardhat compile` to compile the contracts
- `cat artifacts-pvm/contracts/HabitTracker.sol/HabitTracker.json | jq -r '.bytecode' | wc -c` to check the contract size (must be less than 100KB)
- `npx hardhat ignition deploy ./ignition/modules/HabitTracker.ts --network polkadotHubTestnet` to deploy the contracts (user needs to run to confirm with `y`)
- `rm -rf ignition/deployments/` to reset the deployment if needed, before deploy
- `npm run generate` or `npx wagmi generate` to generate the types from the contracts
- Update the frontend with the new contract address and ABI in `frontend/wagmi.config.ts` and `frontend/src/generated.ts` (ask AI, providing the deployed address)
