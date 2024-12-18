import ListingForm from '@/components/ListNFTForm'
import { getClient } from '@/lib/apollo-client';
import { GET_CATEGORIES } from '@/lib/queries';
import React from 'react'

const ListPage = async ({ params }: { params: { tokenId: string } }) => {

    const { data } = await getClient().query({
        query: GET_CATEGORIES,
    });
    const categories = data.categoryAddeds;

  const { tokenId } = await params;
    
  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto'>
        <div className='my-10 px-8 md:px-11 lg:px-36 xl:px-0'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">List NFT</h1>
          <p className='text-xl xl:text-2xl mb-7'>Approve and list your NFT</p>
        </div>
      </section>
      <hr className='border-primary mb-0' />
      <section className='my-10 px-8 md:px-11 lg:px-36 xl:px-0 w-full max-w-[1050px] mx-auto text-primary pt-4 ease-in-out duration-300'>
        <ListingForm
            tokenId={BigInt(tokenId)}
            categories={categories || []}
        />
      </section>
    </main>
  )
}

export default ListPage