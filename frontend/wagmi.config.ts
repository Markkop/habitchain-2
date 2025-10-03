import { defineConfig } from "@wagmi/cli";
import { react, actions } from "@wagmi/cli/plugins";
import { Abi } from "abitype";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Helper function to read artifact
function readArtifact(contractName: string): Abi {
  const artifactPath = join(
    __dirname,
    `../contracts/out/${contractName}.sol/${contractName}.json`
  );
  if (!existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}`);
  }
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
  return artifact.abi as Abi;
}

// Helper function to read deployment address
function readDeploymentAddress(
  moduleName: string,
  contractName: string,
  network: string
): `0x${string}` | undefined {
  try {
    const deploymentPath = join(
      __dirname,
      `../contracts/ignition/deployments/${network}/deployed_addresses.json`
    );
    if (!existsSync(deploymentPath)) {
      return undefined;
    }
    const deployments = JSON.parse(readFileSync(deploymentPath, "utf-8"));
    return deployments[`${moduleName}#${contractName}`] as `0x${string}`;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    actions({
      contracts: [
        {
          name: "MyToken",
          abi: readArtifact("MyToken"),
          address: {
            420420422:
              readDeploymentAddress(
                "MyTokenModule",
                "MyToken",
                "chain-420420422"
              ) || "0x0000000000000000000000000000000000000000",
          },
        },
      ],
    }),
  ],
});

