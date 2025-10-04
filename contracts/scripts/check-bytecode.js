const path = require("path");
const fs = require("fs");

function hexSize(hex) {
  return hex && hex.startsWith("0x") ? (hex.length - 2) / 2 : 0;
}

async function main() {
  const artifactsPath = path.join(__dirname, "../artifacts-pvm/contracts");

  if (!fs.existsSync(artifactsPath)) {
    console.error(
      "❌ No compiled artifacts found. Run 'npx hardhat compile' first."
    );
    process.exit(1);
  }

  const MAX_INITCODE = 100 * 1024; // 100KB Polkadot/Frontier initcode cap
  const WARN = 0.8 * MAX_INITCODE; // 80KB warning threshold

  const results = [];

  function findContracts(dir, baseDir = dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        findContracts(full, baseDir);
        continue;
      }
      if (!entry.name.endsWith(".json") || entry.name.endsWith(".dbg.json"))
        continue;

      const contractName = entry.name.replace(".json", "");
      if (contractName.includes("Test") || contractName.startsWith("I"))
        continue;

      try {
        const artifact = JSON.parse(fs.readFileSync(full, "utf8"));
        if (!artifact.bytecode || artifact.bytecode === "0x") continue;

        const creationSize = hexSize(artifact.bytecode); // initcode without constructor args
        const runtimeSize = hexSize(artifact.deployedBytecode); // deployed

        results.push({
          name: contractName,
          creationSize,
          runtimeSize,
          path: full.replace(baseDir + "/", ""),
        });
      } catch (e) {
        // Skip invalid JSON files
      }
    }
  }

  findContracts(artifactsPath);

  // Sort by creation size (since that's what blocks deployment)
  results.sort((a, b) => b.creationSize - a.creationSize);

  console.log("\n📊 Contract Bytecode Sizes (Polkadot EVM)\n");
  console.log(
    "⚠️  Initcode limit: 100 KB (constructor + runtime bytecode embedded)\n"
  );

  for (const r of results) {
    const status =
      r.creationSize >= MAX_INITCODE
        ? "❌ EXCEEDS INIT LIMIT"
        : r.creationSize >= WARN
        ? "⚠️  NEAR INIT LIMIT   "
        : "✅ OK               ";
    console.log(
      `${status} ${r.name.padEnd(20)} | init: ${(r.creationSize / 1024)
        .toFixed(2)
        .padStart(6)} KB | runtime: ${(r.runtimeSize / 1024)
        .toFixed(2)
        .padStart(6)} KB`
    );
  }

  console.log("\n");

  // Exit with error if any contract exceeds limit
  const hasErrors = results.some((r) => r.creationSize >= MAX_INITCODE);
  if (hasErrors) {
    console.error(
      "❌ One or more contracts exceed the 100 KB initcode limit.\n"
    );
    console.log("💡 To reduce initcode size:");
    console.log("   1. Move constructor logic to an initialize() function");
    console.log("   2. Reduce/avoid immutable variables");
    console.log("   3. Use custom errors instead of long revert strings");
    console.log("   4. Enable viaIR in compiler settings");
    console.log("   5. Consider using a proxy pattern (EIP-1167)\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
