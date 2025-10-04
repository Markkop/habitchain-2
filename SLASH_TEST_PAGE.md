### **The Mandatory `/test` Page**

To ensure transparency and allow judges to easily verify your on-chain functionality, every project must include a `/test` page. This is a simple interface for direct interaction with your smart contract's core functions.

Your `/test` page **must** include the following elements:

- **Wallet Connection:** A button to connect a wallet and a display showing the user is on the correct network (Polkadot Paseo testnet).
- **Contract Address:** The deployed contract address, presented as a link to a block explorer.
- **"Write" Function:** At least one primary button that triggers a key `write` function in your smart contract.
- **"Read" Display:** A section that reads data from the blockchain and clearly reflects the on-chain state change after a transaction is completed.
- **Transaction Proof:** A display for the transaction hash (tx hash) and any relevant events emitted by the contract after a successful transaction.

**Important Security Notes:**

- **Testnet Only:** Remember, all deployments are on a testnet and involve no assets of real value.
- **Admin Functions:** Avoid including dangerous admin functions on your `/test` page. If necessary, ensure they are protected with proper role-based access control.
- **Privacy:** Do not allow your `/test` page to be indexed by search engines (use a `noindex` meta tag) and never expose private keys or other credentials in your front-end code.
