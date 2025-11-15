Here’s a high-impact, no-nitpicks playbook to shrink Solidity bytecode (and usually deployment gas) without messing with comments or variable names. I grouped tips by what tends to move the needle most.

# Big architectural wins

- **Split logic & reuse code via libraries (external‐linked)**
  Heavy, reusable routines belong in a separately deployed library so your main contract doesn’t inline them everywhere. Prefer _external_ libraries when you truly want one copy of code shared across contracts; internal libraries get inlined and can bloat size. ([OpenZeppelin Forum][1])

- **Replace modifiers with internal functions (or very thin modifiers)**
  Modifiers are _inlined into every function that uses them_, duplicating code. Moving the body into an `internal` checker function (and calling it from the top of your functions) reduces bytecode size at a small runtime cost. If you keep modifiers, make them a one-liner that calls an `internal` function. ([Ethereum Stack Exchange][2])

- **Use minimal proxies / clones for factories**
  If you deploy many instances of the same logic (vaults, safes, campaigns…), deploy one implementation and spawn EIP-1167 clones. You’ll pay tiny bytecode per instance and avoid hitting the size cap. ([OpenZeppelin][3])

- **Consider Diamonds when the surface area is huge**
  EIP-2535 “Diamond” splits functionality across facets behind a single address, sidestepping the 24 KB runtime code cap for monoliths. Use with care (added complexity), but it’s the standard answer when one contract simply can’t fit. ([Solidity Developer][4])

# Compiler & toolchain levers

- **Turn the optimizer on and tune it**
  Enable `--optimize`. If you’re fighting _deployment size_, try lower `--optimize-runs` (e.g., 1–10) which biases for smaller bytecode. For _cheaper calls_, use higher runs. Measure both. ([docs.soliditylang.org][5])

- **Try `viaIR` (IR-based codegen)**
  The Yul/IR pipeline enables cross-function optimizations and often produces tighter code. Test `--via-ir` with your codebase and measure. ([docs.soliditylang.org][6])

- **Track both runtime code and initcode size**
  EVM enforces \~24 KB runtime code (EIP-170) and \~48 KB initcode (EIP-3860). Use Hardhat Contract Sizer or `forge build --sizes` to watch both. ([Ethereum Stack Exchange][7])

# Error handling & strings

- **Swap revert strings for custom errors**
  Strings live in bytecode and add up. Custom errors compress revert data and can cut code size noticeably in large contracts. ([Solidity Programming Language][8])

- **If you must keep strings, keep them short**
  Each reason string consumes at least a word; long messages inflate bytecode. Prefer short labels or a single doc link off-chain. ([Polymath Network][9])

# ABI & visibility choices

- **Prefer `external` over `public` for large/calldata-heavy entry points**
  `public` copies args to memory (extra code + gas); `external` reads from calldata. Also avoid auto-generated getters on big structs/arrays unless you truly need them—those getters are generated code. ([docs.soliditylang.org][10])

- **Prune interfaces and inherited surface**
  Inheritance pulls in code paths; keep the public ABI tight and move rarely used admin/maintenance flows behind smaller helper contracts if needed. (Measure with your sizer to see which functions dominate.)

# Storage layout & types (mostly runtime gas, sometimes size)

- **Pack tightly**
  Order small types (e.g., `uint64`, `uint8`, `bool`) to share 32-byte slots inside structs. This saves SLOAD/SSTORE costs, and constructor/init code around storage can shrink a bit too. ([docs.soliditylang.org][11])

- **Use `constant`/`immutable`**
  Constants are baked into bytecode; immutables are set once and treated similarly at read sites—both avoid persistent storage reads and can reduce ancillary code. (Immutables still reserve 32 bytes, but reads compile to cheaper code than SLOAD.) ([docs.soliditylang.org][10])

- **Prefer `calldata` for read-only external params**
  Don’t copy arrays/strings into memory unless you must mutate them. Less code and cheaper execution. ([Ethereum Stack Exchange][12])

# Control flow, loops & patterns

- **De-duplicate logic**
  If N functions share a pre/post block or loop body, factor it into an internal function. That removes repeated sequences from bytecode.

- **Unchecked math where safe**
  Wrapping arithmetic can add instructions; in hot loops where you’ve bounded values, `unchecked { ++i; }` trims ops. (Validate carefully.)

- **Avoid dynamic revert branches in many places**
  Centralize checks (via internal functions) instead of sprinkling similar `require`s everywhere to reduce repetition.

# “Hidden” bytecode hogs to watch

- **Big libraries used as `using Lib for T` with `internal` fns**
  Internal library calls inline; if you attach them across many types and functions, code balloons. Consider external libraries for genuinely reusable routines. ([OpenZeppelin Forum][1])

- **Feature-rich imports you barely use**
  Pulling an entire module set via inheritance can drag in lots of dead paths. Prefer slim interfaces and minimal mixins; move optional features behind separate contracts.

- **Lots of modifiers with logic**
  As above, they inline. Keep them thin or convert to internal checks. ([OpenZeppelin Forum][13])

# When the ceiling still bites

- **Refactor into an upgradeable proxy + slim logic**
  If a single logic contract is just over the line, move admin/rare flows to a helper library/contract and keep the upgradeable logic facet tight.

- **Use Diamonds for very large systems**
  Organize features into facets and register selectors. This pattern exists to handle “too big” ABIs. ([Solidity Developer][4])

- **Factories should clone, not redeploy**
  For N instances, deploy once and clone many (EIP-1167) to avoid repeating large bytecode. ([RareSkills][14])

# Limits, facts & context (so you’re designing with the right constraints)

- **Runtime code size limit:** 24,576 bytes (EIP-170). If you exceed it, deployment fails. ([Ethereum Stack Exchange][7])
- **Initcode (creation code) limit:** 49,152 bytes (EIP-3860, Shanghai). Large constructors or big immutables can push you here. Many chains follow it. ([GitHub][15])

# Practical workflow (Hardhat/Foundry)

1. **Measure:** add `hardhat-contract-sizer` or run `forge build --sizes` (watch both runtime and initcode). ([npm][16])
2. **Flip flags:** compile with/without `--via-ir` and vary `--optimize-runs` to see the curve; pick the sweet spot you can live with at call-time. ([docs.soliditylang.org][6])
3. **Find duplicates:** use your sizer output to see which functions dominate, then extract shared logic to internal functions or external libraries. (The Hardhat guide has a nice checklist.) ([Base Documentation][17])
4. **Trim reverts:** migrate long reason strings → custom errors. ([Solidity Programming Language][8])
5. **Cut inlined glue:** replace fat modifiers; reconsider internal libraries; tighten ABI. ([OpenZeppelin Forum][13])
6. **If still large:** move to clones / split facets (Diamonds). ([RareSkills][14])

---

If you’d like, paste your current Hardhat/Foundry config and a quick `size` report; I can suggest flag tweaks and point at the heaviest functions to refactor first.

[1]: https://forum.openzeppelin.com/t/using-libraries-in-solidity-to-save-on-bytecode-size/4997?utm_source=chatgpt.com "Using libraries in Solidity to save on Bytecode size - Support"
[2]: https://ethereum.stackexchange.com/questions/132414/how-did-the-contract-size-grow-after-removing-couple-of-lines?utm_source=chatgpt.com "How did the contract size grow after removing couple of ..."
[3]: https://www.openzeppelin.com/news/deep-dive-into-the-minimal-proxy-contract?utm_source=chatgpt.com "Deep dive into the Minimal Proxy contract"
[4]: https://soliditydeveloper.com/eip-2535?utm_source=chatgpt.com "EIP-2535: A standard for organizing and upgrading a modular ..."
[5]: https://docs.soliditylang.org/en/latest/internals/optimizer.html?utm_source=chatgpt.com "The Optimizer — Solidity 0.8.31 documentation"
[6]: https://docs.soliditylang.org/en/latest/ir-breaking-changes.html?utm_source=chatgpt.com "Solidity IR-based Codegen Changes"
[7]: https://ethereum.stackexchange.com/questions/111153/eip170-which-contract-features-explain-its-size-the-most?utm_source=chatgpt.com "EIP170 - Which contract features explain its size the most?"
[8]: https://soliditylang.org/blog/2021/04/21/custom-errors/?utm_source=chatgpt.com "Custom Errors in Solidity"
[9]: https://blog.polymath.network/solidity-tips-and-tricks-to-save-gas-and-reduce-bytecode-size-c44580b218e6?utm_source=chatgpt.com "Solidity tips and tricks to save gas and reduce bytecode size"
[10]: https://docs.soliditylang.org/en/latest/contracts.html?utm_source=chatgpt.com "Contracts — Solidity 0.8.31 documentation"
[11]: https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html?utm_source=chatgpt.com "Layout of State Variables in Storage and Transient Storage"
[12]: https://ethereum.stackexchange.com/questions/74442/when-should-i-use-calldata-and-when-should-i-use-memory?utm_source=chatgpt.com "When should I use calldata and when should I use memory?"
[13]: https://forum.openzeppelin.com/t/using-modifiers-for-permission-access-control/2817?utm_source=chatgpt.com "Using modifiers for permission access control - Contracts"
[14]: https://rareskills.io/post/eip-1167-minimal-proxy-standard-with-initialization-clone-pattern?utm_source=chatgpt.com "EIP-1167: Minimal Proxy Standard with Initialization (Clone ..."
[15]: https://github.com/ethereum/solidity/issues/15861?utm_source=chatgpt.com "Missing bytecode size warnings for EIP-3860 and in Yul/ ..."
[16]: https://www.npmjs.com/package/hardhat-contract-sizer?utm_source=chatgpt.com "hardhat-contract-sizer"
[17]: https://docs.base.org/learn/hardhat/hardhat-tools-and-testing/reducing-contract-size?utm_source=chatgpt.com "Hardhat: Optimizing the size of smart contracts"
