# HabitChain (Polkadot EVM)

HabitChain is a dApp designed to encourage the formation of daily habits through the use of crypto.

Users can stake crypto on their habits and either withdraw it if they succeed or lose it if they fail.
While the tokens are staked in the protocol/dApp, they can generate yield (yield farming), increasing the incentives.
If a habit is failed, the staked amount is transferred to the protocol’s treasury. If the user is in a group, the amount is split among the other group members who did not fail their habits on the same day.
It addresses the lack of motivation and instant rewards for users who want to use cryptocurrency to build daily habits.

https://markkop.github.io/habitchain-2/

(Demo not ready yet)

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
