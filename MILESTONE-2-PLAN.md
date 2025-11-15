## MILESTONE 2 PLAN: HabitChain

**Team:** HabitChain Team
**Track:** [x] SHIP-A-TON [ ] IDEA-TON  
**Date:** 16 Nov 2025

---

## 📍 WHERE WE ARE NOW

**What we built/validated this weekend:**
- First working prototype on Polkadot Paseo (EVM)
- Deployed core contracts: HabitTracker, HabitSettler, and MockStakingRewards on Paseo, wired to a live frontend.
- Test page for judges with one-click “Happy Path” flow, contract explorer links, and a dynamic ABI-driven contract UI.
- Preview of Groups feature (mocked UI only)

**What's working:**
- Deposit and withdraw of funds
- Create and fund habits on-chain
- Check-in and force settle habits on-chain
- Rewards UI and prototype
- Slashing of funds towards the treasury (deployer address)

**What still needs work:**
- Real staking rewards distribution
- Groups feature (mocked UI only)
- Sponsors and campaigns feature
- Treasury management

**Blockers or hurdles we hit:**
- Real smart contract staking integration (we're thinking about using Moonwell)
- Automatic settlement mechanism (epoch vs timestamps, timezone handling, etc.)
- Bytecode optimization (need to refactor and optimize the contracts)

---

## 🚀 WHAT WE'LL SHIP IN 30 DAYS

**Our MVP will do this:**
Users will able to connect their wallet and start creating habits, funding them and checking in to receive their funds back.  
Slashed funds will be sent to the treasury address.
Returned funds will generate yield rewards with smart contract staking integration.
Withdraw of funds and rewards shall be possible.

### Features We'll Build (3-5 max)

**Week 1-2:**
- Feature: Smart contract staking integration
- Why it matters: We need to integrate with a real smart contract staking solution to generate yield rewards.
- Who builds it: Gustavo Dutra

**Week 2-3:**
- Feature: Settlement mechanism
- Why it matters: We need to implement a mechanism to settle the habits daily, triggering the staking of the rewards and the sending of the slashed funds to the treasury.
- Who builds it: Marcelo Kopmann

**Week 3-4:**
- Feature: Use Onboarding/UX
- Why it matters: We need to improve the onboarding process and the user experience to make it more intuitive and easy to use.
- Who builds it: Henrique Pereira

**Week 4-5:**
- Feature: Marketing and Distribution
- Why it matters: We need to implement a marketing and distribution strategy to promote the project and reach more users.
- Who builds it: Artur Simon

**Week 5-6:**
- Feature: Security Audit and Final Polish/Testing
- Why it matters: We need to perform a security audit and finalize the project with final testing and polish.
- Who builds it: Everyone


### Team Breakdown (if applicable)

**Artur Simon - Community & Marketing Lead** | [20 hrs/week]
- Owns: Marketing, Community, Social Media, Content Creation, Branding, etc.

**Gustavo Dutra - Smart Contracts & Blockchain Lead** | [20 hrs/week]
- Owns: Smart Contracts, Blockchain, Security, etc.

**Henrique Pereira - Head of Product** | [20 hrs/week]
- Owns: Product, Documentation, Testing, etc.

**Marcelo Kopmann - Founder & Builder** | [20 hrs/week]
- Owns: Project Management,  UX, UI,Development, etc.

### Mentoring & Expertise We Need

**Areas where we need support:**
- Web3 abstraction and user onboarding
- Go-to-market strategy

**Specific expertise we're looking for:**
- Product/growth mentor
- Smart Contract specialist

---

## 🎯 WHAT HAPPENS AFTER

**When M2 is done, we plan to...** 
- Work on the Group Feature
- Work on the Sponsors and Campaigns Feature
- Work on Governance and Treasury Management

**And 6 months out we see our project achieve:**
- 1000 active users
- $500 funds deposited on the platform