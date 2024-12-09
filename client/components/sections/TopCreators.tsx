import React from 'react'
import CustomButton from '../custom/CustomButton'
import { Rocket } from 'lucide-react'
import Link from 'next/link'

const TopCreators = () => {
  return (
    <section className='px-8 py-10 md:px-11 lg:px-36 text-white my-10'>
      <div className='max-w-[1050px] mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='grid gap-2 mb-12'>
            <h1 className='text-4xl font-bold'>Top creators</h1>
            <p>Checkout Top Rated Creators on the NFT Marketplace</p>
          </div>
          <Link href="/rankings" className='hidden md:block'>
            <CustomButton
              type='button'
              title='View Rankings'
              className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base'
              icon={<Rocket size={20} className="mr-3" />}
            />
          </Link>
        </div>
        <div>

        </div>
        <Link href={"/nft"} className='block md:hidden'>
          <CustomButton
            type='button'
            title='See All'
            className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base w-full'
            icon={<Rocket size={20} className="mr-3" />}
          />
        </Link>
      </div>
    </section>
  )
}

export default TopCreators