import React from 'react';
import Image from 'next/image';

interface NftProps {
    tokenId?: string;
    name: string;
    image: string;
    price?: number;
    owner: string;
    ownerImage: string;
    highestBid?: number;
}

const NftCard = ({
    name,
    image,
    price,
    owner,
    ownerImage,
    highestBid
}: NftProps) => {
  return (
    <div className="bg-secondary text-foreground rounded-[20px] shadow-lg overflow-hidden w-full transform transition-all duration-300 hover:scale-95 hover:shadow-2xl">
      {/* NFT Image */}
      <div className="relative mb-3">
        <Image
            src={image}
            alt={name}
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
          {name}
        </h3>

        {/* Owner Information */}
        <div className="flex items-center space-x-3 mt-3">
            {ownerImage ? (
                <div className="w-7 h-7">
                    <Image
                        src={ownerImage}
                        alt={owner}
                        width={100}
                        height={100}
                        className="w-full h-full rounded-full mr-3 object-cover"
                        style={{width: "auto", height: "auto"}}
                    />
                </div>
            ): (
                    <div className="w-7 h-7 rounded-full mr-3 bg-gray-300">{ name[0] }</div>
            )}
            <p className="font-medium font-mono truncate text-lg max-w-[200px]">{owner}</p>
        </div>

        {/* Price and Bid Information */}
        {price && (
            <div className="font-mono flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-primary">Price</p>
                    <p className="text-base">
                    {price ? `${price} ETH` : 'Not listed'}
                    </p>
                </div>
                {highestBid && (
                    <div className="text-right">
                    <p className="text-sm text-primary">Highest Bid</p>
                    <p className="text-base text-green-600">
                        {highestBid} ETH
                    </p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default NftCard;