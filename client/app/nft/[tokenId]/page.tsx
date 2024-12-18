import NFTDetails from '@/components/NFTDetails';
import { getClient } from '@/lib/apollo-client';
import { GET_CREATOR_NFTS, GET_NFT_DETAILS } from '@/lib/queries';
import { Loader2 } from 'lucide-react';

export default async function NFTDetailPage({
  params,
}: {
  params: { tokenId: string };
}) {
  const { tokenId } = await params;

  try {
    // Fetch NFT details
    const { data } = await getClient().query({
      query: GET_NFT_DETAILS,
      variables: { tokenId },
    });

    if (!data.tokenMinteds[0]) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-xl">NFT not found</p>
        </div>
      );
    }

    // Fetch creator's other NFTs
    const { data: creatorData } = await getClient().query({
      query: GET_CREATOR_NFTS,
      variables: {
        creator: data.itemListeds[0]?.creator || "0x1360eDa247bF2fEfeCc5FD5926aC1EF628b19733",
        currentTokenId: tokenId,
      },
    });

    return (
      <NFTDetails
        nftData={data}
        creatorData={creatorData}
      />
    );
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
}