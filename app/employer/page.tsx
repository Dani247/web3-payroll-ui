"use client"

import { Button, Text } from "@chakra-ui/react";
import CreatePayroll from "./CreatePayroll";
import { useWallet } from "../context/wallet";

export const Employer = () => {
    const { account, connectWallet, disconnectWallet } = useWallet()

    return <div>
        {!account && <Button onClick={connectWallet}>Connect</Button>}

        {account && <Text>Welcome {account}!</Text>}
        {account && <Button onClick={disconnectWallet}>Disconnect</Button>}

        {account && <CreatePayroll />}
    </div>
}

export default Employer;