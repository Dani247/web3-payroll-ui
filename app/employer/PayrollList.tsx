"use client"

import React, { useEffect, useState } from "react"
import { useAccount, useChainId, useWalletClient } from "wagmi"
import { readContract } from "viem/actions"
import { createPublicClient, http, fallback } from "viem"
import { mainnet, sepolia } from "viem/chains"
import { useWallet } from "../context/wallet"

// ===== Contract Info =====
const CONTRACTS = {
  PAYROLL_FACTORY: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1" as `0x${string}`,
}

// ===== Minimal ABI =====
const PayrollFactoryABI = [
  {
    type: "function",
    name: "employerVaults",
    stateMutability: "view",
    inputs: [{ name: "employer", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
] as const

// ===== Component =====
export default function PayrollList() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { publicClient } = useWallet()
  
  

  const [vaults, setVaults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVaults() {
      if (!isConnected || !address) return
      try {
        setLoading(true)
        setError(null)
        const result = await readContract(publicClient, {
          address: CONTRACTS.PAYROLL_FACTORY,
          abi: PayrollFactoryABI,
          functionName: "employerVaults",
          args: [address],
        })
        console.log("result", result)
        setVaults(result as string[])
      } catch (err: any) {
        console.error(err)
        setError(err?.shortMessage || err?.message || "Failed to load vaults")
      } finally {
        setLoading(false)
      }
    }
    loadVaults()
  }, [address, chainId, isConnected])

  if (!isConnected) return <p>🔌 Connect your wallet to see payrolls.</p>
  if (loading) return <p>⏳ Loading payrolls...</p>
  if (error) return <p>❌ {error}</p>

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>Payrolls for {address?.slice(0, 6)}…{address?.slice(-4)}</h2>
      {vaults.length === 0 ? (
        <p>No payrolls found.</p>
      ) : (
        <ul style={{ marginTop: "1rem" }}>
          {vaults.map((v, i) => (
            <li key={i} style={{ padding: "0.3rem 0", borderBottom: "1px solid #ddd" }}>
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
