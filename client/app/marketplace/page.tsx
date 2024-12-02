import { LoadingGrid } from '@/components/loading';
import NFTGrid from '@/components/NftGrid';
import { getNFTs } from '@/lib/queries';
import { Suspense } from 'react';

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
    <main className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-center my-8">NFT Marketplace</h1>
      <Suspense fallback={<LoadingGrid />}>
        <NFTGridWrapper />
      </Suspense>
    </main>
  );
}