import React from 'react'
import Image from 'next/image'
import Sub from "../../assets/Sub.svg"
import SubscribeButton from '../SubscribeButton'

const Subscribe = () => {
  return (
    <section className='pt-10 pb-20 md:px-10 lg:px-36 my-10'>
      <div className='md:bg-secondary rounded-[20px] px-5 md:p-14 flex flex-col md:flex-row item-center gap-6 lg:gap-10 xl:gap-20 max-w-[1050px] mx-auto'>
        <Image
          src={Sub}
          alt="Subscribe"
          width={100}
          height={100}
          className='h-[255px] w-full md:h-full xl:h-[310px] xl:min-w-[400px] lg:w-full mb-6 md:mb-0'
          style={{width: "auto", height: "auto"}}
        />
        <div>
          <h3 className='mb-4 text-white text-2xl lg:text-3xl xl:text-5xl font-semibold'>Join our weekly digest</h3>
          <p className='mb-10 lg:text-base xl:text-2xl'>Get exclusive promotions & updates straight to your inbox.</p>
          <SubscribeButton />
        </div>
      </div>
    </section>
  )
}

export default Subscribe