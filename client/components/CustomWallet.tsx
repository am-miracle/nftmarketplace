"use client"
import { WalletButton } from '@rainbow-me/rainbowkit';
import React from 'react'
import CustomButton from './custom/CustomButton';
import MetaMask from "../assets/Metamask.svg";
import Coinbase from "../assets/Coinbase.svg";
import WalletConnect from "../assets/WalletConnect.svg";
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ConnectedWallet } from './ConnectWallet';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

const CustomWallet = () => {
    const { isConnected } = useAccount();
    const router = useRouter();

    if (isConnected) {
    return (
      <Card className="border-none my-8 md:my-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-4xl md:text-3xl xl:text-4xl">
            Wallet Connected
          </CardTitle>
          <CardDescription className="text-xl md:text-lg xl:text-xl">
            Your wallet is connected successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ConnectedWallet />
        </CardContent>
      </Card>
    );
  }
    return (
    <Card className="border-none my-8 md:my-0">
        <CardHeader className="space-y-1">
            <CardTitle className="text-4xl md:text-3xl xl:text-4xl">Connect Wallet</CardTitle>
            <CardDescription className="text-xl md:text-lg xl:text-xl">
            Choose a wallet you want to connect. There are several wallet providers.
            </CardDescription>
        </CardHeader>
          <CardContent className="grid gap-4">
                <WalletButton.Custom wallet="metamask">
                    {({ ready, connect }) => {
                        return (
                            <CustomButton
                                type="button"
                                isLoading={!ready}
                                onClick={connect}
                                title='Metamask'
                                className='bg-secondary border border-accent h-[60px] w-full text-lg font-semibold'
                                icon={<Image src={MetaMask} alt="" width={100} height={100} className="w-6 h-6 mr-2" style={{width: "auto", height: "auto"}} />}
                            />
                        );
                    }}
                </WalletButton.Custom>
                <WalletButton.Custom wallet="walletconnect">
                    {({ ready, connect }) => {
                        return (
                            <CustomButton
                                type="button"
                                isLoading={!ready}
                                onClick={connect}
                                title='WalletConnect'
                                className='bg-secondary border border-accent h-[60px] w-full text-lg font-semibold'
                                icon={<Image src={WalletConnect} alt="" width={100} height={100} className="w-6 h-6 mr-2" style={{width: "auto", height: "auto"}} />}
                            />
                        );
                    }}
                </WalletButton.Custom>
                <WalletButton.Custom wallet="coinbase">
                    {({ ready, connect }) => {
                        return (
                            <CustomButton
                                type="button"
                                isLoading={!ready}
                                onClick={connect}
                                title='Coinbase'
                                className='bg-secondary border border-accent h-[60px] w-full text-lg font-semibold'
                                icon={<Image src={Coinbase} alt="" width={100} height={100} className="w-6 h-6 mr-2" style={{width: "auto", height: "auto"}} />}
                            />
                        );
                    }}
                </WalletButton.Custom>
        </CardContent>
    </Card>
  )
}

export default CustomWallet