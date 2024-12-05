"use client"
import { WalletButton } from '@rainbow-me/rainbowkit';
import React from 'react'
import CustomButton from './custom/CustomButton';
import MetaMask from "../assets/Metamask.svg";
import Coinbase from "../assets/Coinbase.svg";
import WalletConnect from "../assets/WalletConnect.svg";
import Image from 'next/image';

const CustomWallet = () => {
    return (
    <>
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
    </>
  )
}

export default CustomWallet