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
          420420422: "0x193521C8934bCF3473453AF4321911E7A89E0E12",
        },
      },
    }),
  ],
});

