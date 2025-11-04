// lib/wagmiConfig.ts
import { createConfig, http } from "wagmi"
import { hardhat } from "wagmi/chains"
import { injected } from "@wagmi/connectors"

// Point to your local Hardhat, adjust if needed
export const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  connectors: [injected()],
})
