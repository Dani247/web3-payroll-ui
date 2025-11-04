"use client"

import { Button, Text } from "@chakra-ui/react";
import CreatePayroll from "./CreatePayroll";
import { useWallet, WalletProvider } from "../context/wallet";
import PayrollList from "./PayrollList";

export const Employer = () => {
    const { account, connectWallet, disconnectWallet } = useWallet()

    return <WalletProvider>
        <div>
            {!account && <Button onClick={connectWallet}>Connect</Button>}

            {account && <Text>Welcome {account}!</Text>}
            {account && <Button onClick={disconnectWallet}>Disconnect</Button>}

            {account && <CreatePayroll />}
            {account && <PayrollList />}
        </div>
    </WalletProvider>
}

export default Employer;