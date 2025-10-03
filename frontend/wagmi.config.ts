import { defineConfig } from "@wagmi/cli";
import { react, hardhat } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    hardhat({
      project: "../contracts",
      deployments: {
        HabitTracker: {
          420420422: "0x0000000000000000000000000000000000000000", // Update after deployment
        },
      },
    }),
  ],
});

