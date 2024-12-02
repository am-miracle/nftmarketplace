import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import NFTMarketplace from '../../../../out/NFTMarketplace.sol/NFTMarketplace.json';
import NFTCollection from '../../../../out/NFTCollection.sol/NFTCollection.json';
import { NFT } from '@/types';

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    console.log(provider)
    const marketplace = new ethers.Contract(
      process.env.MARKETPLACE_ADDRESS!,
      NFTMarketplace.abi,
      provider
    );

    const nftCollection = new ethers.Contract(
      process.env.NFT_COLLECTION_ADDRESS!,
      NFTCollection.abi,
      provider
    );

    const listings = await marketplace.getListings();
      console.log("listing", listings);
      console.log("marketplace",marketplace);
      console.log("nftcollection",nftCollection);

    const nfts = await Promise.all(
      listings.map(async (listing: NFT) => {
        const tokenURI = await nftCollection.tokenURI(listing.tokenId);
        const metadata = await fetch(tokenURI).then(r => r.json());

        return {
          tokenId: listing.tokenId.toString(),
          name: metadata.name,
          description: metadata.description,
          imageUrl: metadata.image,
          price: ethers.formatEther(listing.price),
          seller: listing.seller,
          isAuction: listing.isAuction,
          category: ethers.decodeBytes32String(listing.category),
        };
      })
    );

    return NextResponse.json(nfts);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }
}