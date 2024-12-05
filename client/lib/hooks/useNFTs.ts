// import { useQuery } from '@apollo/client';
// import { useUser } from '@clerk/nextjs';
// import { GET_NFT_BY_ID, GET_NFTS, GET_USER_NFTS } from '../queries';
// // import { db } from '../db';

// export interface NFT {
//   id: string;
//   tokenId: string;
//   tokenURI: string;
//   price: string;
//   seller: string;
//   isAuction: boolean;
//   auctionEndTime?: string;
//   highestBid?: string;
//   highestBidder?: string;
//   category: string;
//   collection?: {
//     id: string;
//     name: string;
//     totalVolume: string;
//     floorPrice: string;
//   };
// }

// export const useNFTs = (page = 1, pageSize = 12) => {
//   const { data, loading, error, fetchMore } = useQuery(GET_NFTS, {
//     variables: {
//       first: pageSize,
//       skip: (page - 1) * pageSize,
//     },
//   });

//   const loadMore = () => {
//     fetchMore({
//       variables: {
//         skip: data?.nfts.length || 0,
//       },
//       updateQuery: (prev, { fetchMoreResult }) => {
//         if (!fetchMoreResult) return prev;
//         return {
//           nfts: [...prev.nfts, ...fetchMoreResult.nfts],
//         };
//       },
//     });
//   };

//   return {
//     nfts: data?.nfts as NFT[],
//     loading,
//     error,
//     loadMore,
//   };
// };

// export const useUserNFTs = (address?: string, page = 1, pageSize = 12) => {
//   const { user } = useUser();
//   const walletAddress = address || user?.publicMetadata?.walletAddress as string;

//   const { data, loading, error } = useQuery(GET_USER_NFTS, {
//     variables: {
//       address: walletAddress?.toLowerCase(),
//       first: pageSize,
//       skip: (page - 1) * pageSize,
//     },
//     skip: !walletAddress,
//   });

//   return {
//     nfts: data?.nfts as NFT[],
//     loading,
//     error,
//   };
// };

// export const useNFT = (id: string) => {
//   const { data, loading, error } = useQuery(GET_NFT_BY_ID, {
//     variables: { id },
//   });

//   return {
//     nft: data?.nft as NFT,
//     loading,
//     error,
//   };
// };

// // Function to fetch NFT metadata from IPFS
// export const fetchNFTMetadata = async (tokenURI: string) => {
//   try {
//     const response = await fetch(tokenURI);
//     const metadata = await response.json();
//     return metadata;
//   } catch (error) {
//     console.error('Error fetching NFT metadata:', error);
//     return null;
//   }
// };

// // Function to get enriched NFT data with Prisma user data
// // export const getEnrichedNFTData = async (nft: NFT) => {
// //   try {
// //     const [seller, highestBidder] = await Promise.all([
// //       db.user.findFirst({
// //         where: { walletAddress: nft.seller.toLowerCase() },
// //         select: { id: true, username: true, email: true },
// //       }),
// //       nft.highestBidder
// //         ? db.user.findFirst({
// //             where: { walletAddress: nft.highestBidder.toLowerCase() },
// //             select: { id: true, username: true },
// //           })
// //         : null,
// //     ]);

// //     const metadata = await fetchNFTMetadata(nft.tokenURI);

// //     return {
// //       ...nft,
// //       metadata,
// //       seller,
// //       highestBidder: highestBidder || undefined,
// //     };
// //   } catch (error) {
// //     console.error('Error enriching NFT data:', error);
// //     return nft;
// //   }
// // };