import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomWallet from '@/components/CustomWallet';


const ConnectWalletPage = () => {
  return (
    <Card className="border-none my-8 md:my-0">
        <CardHeader className="space-y-1">
            <CardTitle className="text-4xl md:text-3xl xl:text-4xl">Connect Wallet</CardTitle>
            <CardDescription className="text-xl md:text-lg xl:text-xl">
            Choose a wallet you want to connect. There are several wallet providers.
            </CardDescription>
        </CardHeader>
          <CardContent className="grid gap-4">
              <CustomWallet />
        </CardContent>
    </Card>
  )
}

export default ConnectWalletPage