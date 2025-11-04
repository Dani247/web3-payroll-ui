"use client"

import React, { useMemo, useState } from "react"
import { useAccount, useChainId, useChains, useWalletClient } from "wagmi"
import { writeContract, waitForTransactionReceipt } from "viem/actions"
import { createPublicClient, http, getAddress } from "viem"
import PayrollFactoryArtifact from "./PayrollFactory.json"
import { useRouter } from "next/navigation"
import { useWallet } from "../context/wallet"

const CONTRACTS = {
  USDT: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d" as `0x${string}`,
  PAYROLL_FACTORY: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1" as `0x${string}`,
}

const PayrollFactoryABI = PayrollFactoryArtifact.abi

function parseUSDT(x: string): bigint {
  const [w, fRaw = ""] = x.trim().split(".")
  if (!/^\d+$/.test(w ?? "")) throw new Error("Invalid amount")
  const f = (fRaw + "000000").slice(0, 6)
  if (!/^\d{0,6}$/.test(f)) throw new Error("Invalid amount")
  return BigInt(w) * BigInt(1000000) + BigInt(f || "0")
}

function randomBytes32(): `0x${string}` {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
  return `0x${hex}`
}

export default function PayrollCreateForm() {
  const router = useRouter()
  const chainId = useChainId()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient({ chainId })

  const { publicClient } = useWallet()

  const [employee, setEmployee] = useState("0x70997970c51812dc3a010c7d01b50e0d17dc79c8")
  const [amountStr, setAmountStr] = useState("1500")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletClient || !address) return setMsg("⚠️ Connect your wallet first.")

    try {
      setIsSubmitting(true)
      setMsg("⏳ Sending transaction…")

      const periodAmount = parseUSDT(amountStr)

      const now = Math.floor(Date.now() / 1000)
      const oneMonth = 30 * 24 * 60 * 60
      const schedule = [BigInt(now + oneMonth)]

      const payrollRef = randomBytes32()
      const employeeAddr = getAddress(employee as `0x${string}`)

      const args = [employeeAddr, CONTRACTS.USDT, periodAmount, schedule, payrollRef] as const

      const { request } = await publicClient.simulateContract({
        address: CONTRACTS.PAYROLL_FACTORY,
        abi: PayrollFactoryABI,
        functionName: "createVault",
        args,
        account: address,
      })

      const hash = await walletClient.writeContract(request)

      setMsg(`✅ Tx sent: ${hash.slice(0, 12)}…`)
      const receipt = await waitForTransactionReceipt(publicClient, { hash })

      setMsg(`🎉 Payroll created. Block ${receipt.blockNumber}.`)
      setEmployee("")
      setAmountStr("")
      router.refresh() // refresh server data if the page lists vaults
    } catch (err: any) {
      console.log("err", err)
      setMsg(`❌ ${err?.shortMessage || err?.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Create Payroll</h2>

      <div style={{ margin: "0.75rem 0" }}>
        <label>Employer</label>
        <input style={{ width: "100%" }} readOnly value={address ?? ""} placeholder="Connect wallet" />
      </div>

      <div style={{ margin: "0.75rem 0" }}>
        <label>Employee Address</label>
        <input
          style={{ width: "100%" }}
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          placeholder="0x…"
          required
        />
      </div>

      <div style={{ margin: "0.75rem 0" }}>
        <label>Amount per Month (USDT)</label>
        <input
          style={{ width: "100%" }}
          inputMode="decimal"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          placeholder="e.g. 1500.00"
          required
        />
      </div>

      <div style={{ margin: "0.75rem 0" }}>
        <label>Schedule</label>
        <select style={{ width: "100%" }} value="monthly" disabled>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <button type="submit" disabled={!address || isSubmitting} style={{ width: "100%", padding: "0.6rem" }}>
        {isSubmitting ? "Creating..." : "Create Payroll"}
      </button>

      <p style={{ marginTop: "0.75rem", fontSize: 13 }}>{msg}</p>
    </form>
  )
}


