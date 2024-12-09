// import { NFT, User, Collection } from '@prisma/client'

import { Abi } from "viem";


export type NFT = {
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  seller: string;
  isAuction: boolean;
  category: string;
  owner: string;
  ownerImage: string;
  highestBid?: number;
};


export interface NFTData {
  id: string;
  tokenId: number;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  owner: {
    walletAddress: string;
    username?: string;
    profileImage?: string;
  };
  listing?: {
    price: string;
    isAuction: boolean;
    highestBid?: string;
    auctionEndTime?: string;
  };
}

export interface CategoryAdded {
  id: string;
  category: string;
  name: string;
  timestamp: string;
  
}

export interface NFTListing {
  id: string;
  seller: string;
  nftAddress: string;
  tokenId: string;
  price: string;
  category: string;
  collectionName: string;
}

export type NFTCollectionAbi = Abi & {
  mint: (to: string, tokenURI: string, royaltyFee: number) => void;
  batchMint: (to: string, tokenURIs: string[], royaltyFee: number) => void;
};

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}