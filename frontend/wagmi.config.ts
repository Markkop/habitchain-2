import { defineConfig } from "@wagmi/cli";
import { react, hardhat } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    react(),
    hardhat({
      project: "../contracts",
      artifacts: "../contracts/artifacts-pvm",
      deployments: {
        HabitTracker: {
          420420422: "0xDA33f6936dcb89D38F2FEc3DC4a6aa1C2648599A",
        },
      },
    }),
  ],
});

