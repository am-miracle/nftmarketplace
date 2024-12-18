import { getClient } from '@/lib/apollo-client';
import { GET_CATEGORIES, GET_NFTS_BY_CATEGORY } from '@/lib/queries';
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { CategoryAdded } from '@/types';
import { NFTListing, TokenMinted } from '@/types/nft';
import NFTGrid from '@/components/NFTGrid';

export default async function CategoryPage({
  params,
}: {
  params: { categoryId: string };
}) {
  const { categoryId } = await params;

  // Fetch category data and NFTs in parallel
  const [categoryResponse, nftResponse] = await Promise.all([
    getClient().query({
      query: GET_CATEGORIES
    }),
    getClient().query({
      query: GET_NFTS_BY_CATEGORY,
      variables: {
        categoryId: categoryId,
        first: 100,
        skip: 0,
      },
    })
  ]);

  const categories = categoryResponse.data.categoryAddeds as CategoryAdded[];
  const currentCategory = categories.find(cat => cat.category === categoryId);

  if (!currentCategory) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Category not found</p>
      </div>
    );
  }

  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto'>
        <div className='my-10 px-8 md:px-11 lg:px-36 xl:px-0'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">
            {currentCategory.name} NFTs
          </h1>
          <p className='text-xl xl:text-2xl mb-7'>
            Browse through {currentCategory.name} NFTs on the marketplace.
          </p>
        </div>
      </section>
      <div className="mt-8 max-w-[1050px] mx-auto px-8 md:px-11 lg:px-36 xl:px-0">
        <Suspense fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          {nftResponse.data.tokenMinteds > 0 ? (
            <NFTGrid
              data={{
                tokenMinteds: nftResponse.data.tokenMinteds.filter((nft: TokenMinted) => {
                  // Find if this NFT has a listing in the current category
                  const hasListing = nftResponse.data.itemListeds.some(
                    (listing: NFTListing) =>
                      listing.tokenId === nft.tokenId &&
                      listing.category === categoryId
                  );
                  return hasListing;
                }),
                itemListeds: nftResponse.data.itemListeds
              }}
            />
          ) : (
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold">No NFTs found in this category</h2>
              <p className="text-gray-500">Check back later for new listings</p>
            </div>
          )}
        </Suspense>
      </div>
    </main>
  );
}