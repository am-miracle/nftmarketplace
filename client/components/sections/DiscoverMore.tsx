import React from 'react'
import CustomButton from '../custom/CustomButton'
import { Eye } from 'lucide-react'
import Link from 'next/link'

const DiscoverMore = () => {
  return (
    <section className='px-8 py-10 md:px-11 lg:px-36 text-white my-10'>
      <div className='max-w-[1050px] mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='grid gap-2 mb-12'>
            <h1 className='text-4xl font-bold'>Discover More NFTs</h1>
            <p>Explore new trending NFTs</p>
          </div>
          <Link href={"/nft"} className='hidden md:block'>
            <CustomButton
              type='button'
              title='See All'
              className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base'
              icon={<Eye size={20} className="mr-3" />}
            />
          </Link>
        </div>
        <div>

        </div>
        <Link href={"/marketplace"} className='block md:hidden'>
          <CustomButton
            type='button'
            title='See All'
            className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base w-full'
            icon={<Eye size={20} className="mr-3" />}
          />
        </Link>
      </div>
    </section>
  )
}

export default DiscoverMore