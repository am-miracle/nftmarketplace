import Image from 'next/image'
import React from 'react'
import DiscordLogo from "../../assets/DiscordLogo.svg"
import TwitterLogo from "../../assets/TwitterLogo.svg"
import YoutubeLogo from "../../assets/YoutubeLogo.svg"
import InstagramLogo from "../../assets/InstagramLogo.svg"
import Storefront from "../../assets/Storefront.svg"
import Link from 'next/link'
import SubscribeButton from '../SubscribeButton'

const Footer = () => {
  return (
      <footer className='bg-secondary px-8 py-10 md:px-11 lg:px-36 text-primary-foreground'>
          <div className='max-w-[1050px] mx-auto'>
            <section className='grid xl:grid-cols-3 gap-8'>
                <div className='md:w-1/2 lg:w-auto'>
                    <span className='text-2xl font-bold mb-8 flex items-center gap-2'>
                        <Image
                            src={Storefront}
                            alt="Neflex logo"
                            width={100}
                            height={100}
                            className='h-[32px] w-[32px]'
                            style={{width: "auto", height: "auto"}}
                        />
                        <Link href='/' className={`text-foreground font-mono`}>NEFLEX</Link>
                    </span>
                    <p className='mb-5'>NFT Marketplace built on Ethereum, it enables user to mint, list, buy, sell, and auction NFTs.</p>
                    <div className='flex flex-col gap-2'>
                        <p>Join our community</p>
                        <div className='flex gap-4 items-center'>
                            <a href="#" target="_blank" rel="noreferrer">
                                <Image
                                    src={DiscordLogo}
                                    alt="Discord logo"
                                    width={100}
                                    height={100}
                                    className='h-[32px] w-[32px]'
                                    style={{width: "auto", height: "auto"}}
                                />
                            </a>
                            <a href="#" target="_blank" rel="noreferrer">
                                <Image
                                    src={TwitterLogo}
                                    alt="Twitter logo"
                                    width={100}
                                    height={100}
                                    className='h-[32px] w-[32px]'
                                    style={{width: "auto", height: "auto"}}
                                />
                            </a>
                            <a href="#" target="_blank" rel="noreferrer">
                                <Image
                                    src={YoutubeLogo}
                                    alt="Youtube logo"
                                    width={100}
                                    height={100}
                                    className='h-[32px] w-[32px]'
                                    style={{width: "auto", height: "auto"}}
                                />
                            </a>
                            <a href="#" target="_blank" rel="noreferrer">
                                <Image
                                    src={InstagramLogo}
                                    alt="Instagram logo"
                                    width={100}
                                    height={100}
                                    className='h-[32px] w-[32px]'
                                    style={{width: "auto", height: "auto"}}
                                />
                            </a>
                        </div>
                    </div>
                </div>
                <div>
                    <h5 className='text-2xl font-bold mb-8 text-white font-mono'>Explore</h5>
                    <p className='flex flex-col gap-3'>
                        <Link href="/marketplace">Marketplace</Link>
                        <Link href="/creators">Rankings</Link>
                        <Link href="/wallet">Connect a wallet</Link>
                    </p>
                </div>
                <div>
                    <h5 className='text-2xl font-bold mb-8 text-white font-mono'>
                    Join our weekly digest
                    </h5>
                    <p className='mb-5'>Get exclusive promotions & updates straight to your inbox.</p>
                    <SubscribeButton />
                </div>
            </section>
            <hr className='mt-5 mb-2' />
            <p>Copyright © 2024 NEFLEX</p>
          </div>
    </footer>
  )
}

export default Footer

