// import { NFT, User, Collection } from '@prisma/client'

import { BigNumberish } from "ethers";
import { Abi, Address } from "viem";


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


export type NFTCollectionAbi = Abi & {
  mint: (to: string, tokenURI: string, royaltyFee: number) => void;
  batchMint: (to: string, tokenURIs: string[], royaltyFee: number) => void;
  approve: (to: Address, tokenId: bigint) => void;
  getApprove: (tokenId: bigint) => Address;
  ownerOf: (tokenId: bigint) => Address;
};

export type NFTMarketplaceAbi = Abi & {
  listItem: (
    nftAddress: Address,
    tokenId: bigint,
    price: bigint,
    isAuction: boolean,
    category: string
  ) => void;
}

// export interface NFTMetadata {
//   name: string;
//   description: string;
//   image: string;
//   attributes: Array<{
//     trait_type: string;
//     value: string;
//   }>;
// }


// types/nft.ts

export interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Record<string, string>;
}

export interface ListingInfo {
  id: string;
  seller: string;
  nftAddress: string;
  price: BigNumberish;
  isAuction: boolean;
  category: string;
  timestamp: BigNumberish;
  collectionName: string;
  creator: string;
}

export interface NFTBid {
  id: string;
  bidder: string;
  amount: BigNumberish;
  timestamp: BigNumberish;
}

export interface NF {
  id: string;
  tokenId: BigNumberish;
  tokenURI: string;
  metadata: TokenMetadata;
  owner: string;
  listing?: ListingInfo;
  bids?: NFTBid[];
  mintedTo: string;
  mintTimestamp: BigNumberish;
  royaltyFee: BigNumberish;
}

export interface NFTTransfer {
  id: string;
  from: string;
  to: string;
  tokenId: BigNumberish;
  timestamp: BigNumberish;
}

export interface MarketplaceStats {
  totalListings: number;
  totalAuctions: number;
  totalSales: number;
  totalVolume: BigNumberish;
}

export interface CategoryInfo {
  id: string;
  name: string;
  timestamp: BigNumberish;
}