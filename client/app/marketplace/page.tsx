import { LoadingGrid } from '@/components/loading';
import NFTGrid from '@/components/NftGrid';
import { getNFTs } from '@/lib/queries';
import { Suspense } from 'react';
import SearchNft from './SearchNft';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const revalidate = 60; // revalidate the data at most every 60 seconds

async function NFTGridWrapper() {
  const nfts = await getNFTs();
  
  if (!nfts.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">No NFTs found</h2>
        <p className="text-gray-500">Check back later for new listings</p>
      </div>
    );
  }
  
  return <NFTGrid nfts={nfts} />;
}

export default function MarketplacePage() {
  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto'>
        <div className='my-10 px-4'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">Browse Marketplace</h1>
          <p className='text-xl xl:text-2xl mb-7'>Browse through more than 50k NFTs on the NFT Marketplace.</p>
          <SearchNft />
        </div>
      </section>
      <hr className='border-primary mb-0' />
      <section className='mt-8'>
      <Tabs defaultValue="nft" className="w-full">
        <TabsList className='w-full max-w-[1050px] mx-auto text-primary flex items-center justify-evenly pt-4 ease-in-out duration-300'>
          <TabsTrigger
            value="nft"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            NFTs
          </TabsTrigger>
          <TabsTrigger
            value="collection"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            Collection
          </TabsTrigger>
        </TabsList>
        <TabsContent value="nft" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
            <Suspense fallback={<LoadingGrid />}>
              <NFTGridWrapper />
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="collection" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
            <Suspense fallback={<LoadingGrid />}>
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold">No Collection found</h2>
                <p className="text-gray-500">Check back later for new collection</p>
              </div>
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
      </section>
    </main>
  );
}