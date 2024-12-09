import React from 'react'
import { CategoriesList } from '../Categories'

const BrowserCategories = () => {
  return (
    <section className='px-8 py-10 md:px-11 lg:px-36 text-white my-10'>
      <div className='max-w-[1050px] mx-auto'>
        <h1 className='text-2xl xl:text-4xl font-bold'>Browse Categories</h1>
        <div className='mt-12'>
          <CategoriesList />
        </div>
      </div>
    </section>
  )
}

export default BrowserCategories