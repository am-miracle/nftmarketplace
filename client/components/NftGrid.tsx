import { NFT } from '@/types';
import Image from 'next/image';

function NFTCard({ nft }: { nft: NFT }) {
  return (
    <div className="bg-secondary text-foreground rounded-[20px] shadow-lg overflow-hidden w-full transform transition-all duration-300 hover:scale-95 hover:shadow-2xl">
      {/* NFT Image */}
      <div className="relative mb-3">
        <Image
            src={nft.imageUrl}
            alt={nft.name}
            width={100}
            height={100}
            className="h-[206px] w-full xl:h-full object-cover"
            style={{width: "auto", height: "auto"}}
        />
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* NFT Name */}
        <h3 className="text-2xl font-bold mb-2 truncate">
          {nft.name}
        </h3>

        {/* Owner Information */}
        <div className="flex items-center space-x-3 mt-3">
            {nft.ownerImage ? (
                <div className="w-7 h-7">
                    <Image
                        src={nft.ownerImage}
                        alt={nft.owner}
                        width={100}
                        height={100}
                        className="w-full h-full rounded-full mr-3 object-cover"
                        style={{width: "auto", height: "auto"}}
                    />
                </div>
            ): (
                    <div className="w-7 h-7 rounded-full mr-3 bg-gray-300">{ nft.name[0] }</div>
            )}
            <p className="font-medium font-mono truncate text-lg max-w-[200px]">{nft.owner}</p>
        </div>

        {/* Price and Bid Information */}
        {nft.price && (
            <div className="font-mono flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-primary">Price</p>
                    <p className="text-base">
                    {nft.price ? `${nft.price} ETH` : 'Not listed'}
                    </p>
                </div>
                {nft.highestBid && (
                    <div className="text-right">
                    <p className="text-sm text-primary">Highest Bid</p>
                    <p className="text-base text-green-600">
                        {nft.highestBid} ETH
                    </p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}


export default function NFTGrid({ nfts }: { nfts: NFT[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {nfts.map((nft) => (
        <NFTCard key={nft.tokenId} nft={nft} />
      ))}
    </div>
  );
}