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