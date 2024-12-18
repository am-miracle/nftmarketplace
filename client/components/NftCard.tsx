import React from 'react';
import Image from 'next/image';

interface NftProps {
    name: string;
    image: string;
    price?: number;
    owner?: string;
    ownerImage?: string;
  highestBid?: number;
  className?: string;
}

const NftCard = ({
    name,
    image,
    price,
    owner,
    ownerImage,
    highestBid,
    className
}: NftProps) => {
  return (
    <div className={"text-foreground rounded-[20px] overflow-hidden w-full transform transition-all duration-300 hover:scale-95"}>
      {/* NFT Image */}
      <div className="relative">
        <Image
            src={image}
            alt={name}
            width={100}
            height={100}
            className="min-h-[295px] max-h-[238px] xl:max-h-[295px] min-w-full object-cover"
            style={{width: "auto", height: "auto"}}
        />
      </div>

      {/* Card Content */}
      <div className={`py-6 px-5 bg-background ${className}`}>
        {/* NFT Name */}
        <h3 className="text-2xl font-semibold mb-2 truncate">
          {name}
        </h3>

        {/* Owner Information */}
        <div className="flex items-center space-x-3 mt-3">
            {ownerImage ? (
                <div className="w-7 h-7">
                    <Image
                        src={ownerImage}
                        alt={owner || 'Owner'}
                        width={100}
                        height={100}
                        className="w-full h-full rounded-full mr-3 object-cover"
                        style={{width: "auto", height: "auto"}}
                    />
                </div>
            ): (
                    <div className="w-7 h-7 rounded-full mr-3 bg-gray-300">{ name[0] }</div>
            )}
            <p className="font-medium font-mono truncate text-base max-w-[200px]">{owner}</p>
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