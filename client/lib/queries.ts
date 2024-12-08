"use server"
import { NFT_COLLECTION_ABI, NFT_COLLECTION_ADDRESS } from '@/constants/abis/NFTCollection';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/constants/abis/NFTMarketplace';
import { NFT } from '@/types';
// import axios from 'axios';
import { ethers } from 'ethers';



export async function getNFTs(): Promise<NFT[]> {
  try {
    if (!process.env.NEXT_PUBLIC_RPC_URL) {
      throw new Error('RPC_URL not configured');
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );
    
    const marketplace = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      MARKETPLACE_ABI,
      provider
    );

    const nftCollection = new ethers.Contract(
      NFT_COLLECTION_ADDRESS,
      NFT_COLLECTION_ABI,
      provider
    );

    // Get all listings
    const listings = await marketplace.getListing();
    const categories = await marketplace.getCategories();
    console.log('Fetched listings:', listings);
    console.log('Fetched categories:', categories);

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
          category: ethers.decodeBytes32String(listing.category)
        };
      })
    );

    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}