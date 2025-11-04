"use client"

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react"
import { WagmiProvider, useAccount, useConnect, useDisconnect, useWalletClient, createConfig, http, useSwitchChain, useChains } from "wagmi"
import { hardhat } from "wagmi/chains"
import { injected } from "@wagmi/connectors"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createPublicClient, type WalletClient } from "viem"

// ---------- Public config (adjust chain/transports if needed) ----------
const wagmiConfig = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  connectors: [injected()],
})

// ---------- Context shape (same API you had) ----------
type WalletContextValue = {
  account: string | null
  signer: WalletClient | null // viem WalletClient (replaces ethers.Signer)
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void> | void
  publicClient: any
}

const WalletContext = createContext<WalletContextValue>({
  account: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  publicClient: null
})

// ---------- Inner provider that uses wagmi hooks ----------
function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId } = useAccount()
  const { connectAsync, connectors, status: connectStatus } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { disconnectAsync } = useDisconnect()
  const { data: walletClient } = useWalletClient()
    const chains = useChains()

  const [account, setAccount] = useState<string | null>(null)
  const [signer, setSigner] = useState<WalletClient | null>(null)

  useEffect(() => {
    setAccount(address ?? null)
  }, [address])

  useEffect(() => {
    setSigner(walletClient ?? null)
  }, [walletClient])

  const publicClient = useMemo(() => {
    const chain = chains?.[0]
    return createPublicClient({ chain, transport: http() })
  }, [chains])

  const connectWallet = useCallback(async () => {
    const injectedConnector = connectors.find(c => c.id === "injected") ?? connectors[0]
    if (!injectedConnector) throw new Error("No wallet connector available")
  
    await connectAsync({ connector: injectedConnector })
  
    // Ensure correct chain
    if (chainId !== hardhat.id) {
      await switchChainAsync({ chainId: hardhat.id })
    }
  }, [connectAsync, connectors, chainId, switchChainAsync])

  const disconnectWallet = useCallback(async () => {
    await disconnectAsync()
    // local state will be cleared by effects (address -> null, walletClient -> null)
  }, [disconnectAsync])

  const value = useMemo<WalletContextValue>(
    () => ({
      account,
      signer,
      connectWallet,
      disconnectWallet,
      publicClient,
    }),
    [account, signer, connectWallet, disconnectWallet, publicClient],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// ---------- Outer provider that wires Wagmi + React Query ----------
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletStateProvider>{children}</WalletStateProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// ---------- Hook (same name you already use) ----------
export const useWallet = () => useContext(WalletContext)
