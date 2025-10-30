"use client"

import { ethers } from 'ethers'
import React, { useContext, useState } from 'react'

const defaultValue = {
    account: null,
    signer: null,
    disconnectWallet: () => {},
    connectWallet: () => {},
}

const WalletContext = React.createContext(defaultValue)

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [signer, setSigner] = useState(null);

    async function connectWallet() {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            console.log("provider", provider)
            const accounts = await provider.send("eth_requestAccounts", []);
            console.log("accounts", accounts)
            const signerResult = await provider.getSigner();
            console.log("signer", signerResult)
            // store accounts[0] and signer in state
            setAccount(accounts[0])
            setSigner(signerResult || undefined)
        } else {
            alert("Please install MetaMask");
        }
    }

    function disconnectWallet() {
        setAccount(null)
        setSigner(null)
    }

    return <WalletContext.Provider value={{
        account,
        signer,
        disconnectWallet,
        connectWallet
    }}>
        {children}
    </WalletContext.Provider>
}

export const useWallet = () => {
    const context = useContext(WalletContext);



    return { ...context }
}