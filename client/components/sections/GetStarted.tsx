import Image from 'next/image';
import React from 'react'
import Collection from "../../assets/collection.svg";
import Earnings from "../../assets/earnings.svg";
import Wallet from "../../assets/wallet.svg";

interface GettingStarted {
  image: string;
  title: string;
  description: string;
}

const GetStarted = () => {
  return (
    <section className='px-8 py-10 md:px-11 lg:px-36 text-white my-10'>
      <div className='max-w-[1050px] mx-auto'>
        <span className='grid gap-2 mb-12'>
          <h1 className='text-4xl font-bold'>How it works</h1>
          <p>Find out how to get started</p>
        </span>
        <div className='flex flex-col md:flex-row gap-4'>
          {howItWorks.map((started, index) => (
            <div className="rounded-lg p-4 xl:p-6 flex flex-row md:flex-col items-center gap-2 md:justify-center md:text-center bg-secondary" key={index}>
              <div className="w-[120%] h-[100%] md:flex md:items-center md:justify-center md:w-full md:mx-auto">
                <Image
                  src={started.image}
                  alt={started.title}
                  className="w-auto h-auto mb-4"
                  width={100}
                  height={100}
                  style={{ width: "auto", height: "auto"}}
                />
              </div>
              <div className='w-auto'>
                <h2 className="text-2xl lg:text-xl xl:text-2xl font-semibold mb-2">{started.title}</h2>
                <p className='text-lg lg:text-base xl:text-lg'>{started.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GetStarted;

const howItWorks: GettingStarted[] = [{
    image: Wallet,
    title: 'Setup Your wallet',
    description: 'Set up your wallet of choice. Connect it to the Animarket by clicking the wallet icon in the top right corner.'
  },
  {
    image: Collection,
    title: 'Create Collection',
    description: 'Upload your work and setup your collection. Add a description, social links and floor price.'
  },
  {
    image: Earnings,
    title: 'Start Earning',
    description: 'Choose between auctions and fixed-price listings. Start earning by selling your NFTs or trading others.'
  }
]