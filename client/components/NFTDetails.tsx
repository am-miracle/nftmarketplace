"use client"
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Earth, ArrowBigRight } from 'lucide-react';
import CustomButton from '@/components/custom/CustomButton';
import { NFTListing, TokenMinted } from '@/types/nft';
import toast from 'react-hot-toast';
import AuctionCountdown from './AuctionCountdown';
import { formatEther } from 'viem';
import { useRouter } from 'next/navigation';
import { BidModal } from './BidModal';
import { BuyModal } from './BuyModal';
import { NftGrid } from './NftGrid';


interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Record<string, string>;
}

interface NFTDetailsProps {
  nftData: {
    tokenMinteds: TokenMinted[];
    itemListeds: NFTListing[];
  };
  creatorData: {
    tokenMinteds: TokenMinted[];
    itemListeds: NFTListing[];
  };
}

const NFTDetails = ({ nftData, creatorData }: NFTDetailsProps) => {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const nft = nftData.tokenMinteds[0];
  const listing = nftData.itemListeds[0];
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const router = useRouter();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(nft.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
        const metadataJson = await response.json();
        setMetadata(metadataJson);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    if (nft?.tokenURI) {
      fetchMetadata();
    }
  }, [nft?.tokenURI]);

  const handleAuctionEnd = () => {
    setIsAuctionEnded(true);
    toast.success("Auction has ended!");
  };

  // Replace the auction section in the existing JSX with:
  const renderAuctionOrPriceSection = () => {
    if (!listing) {
      return (
        <div className='bg-secondary rounded-[20px]'>
          <p className="text-xl font-semibold mb-4">Not Listed</p>
          <CustomButton
            type='button'
            title='List NFT'
            className='bg-accent h-[60px] text-base w-full'
            onClick={() => router.push(`/list/${nft.tokenId}`)}
          />
        </div>
      );
    }

    if (listing.isAuction) {
      const endTime = parseInt(listing.auctionEndTime || '0');
      const now = Math.floor(Date.now() / 1000);
      
      if (endTime <= now || isAuctionEnded) {
        return (
          <div className='bg-secondary rounded-[20px]'>
            <p className="text-xl font-semibold mb-4">Auction Ended</p>
            <p className="text-gray-500">This auction has concluded</p>
          </div>
        );
      }

      return (
        <div className='bg-secondary rounded-[20px]'>
          <p className="text-sm mb-2">Auction ends in:</p>
          <AuctionCountdown
            endTime={endTime}
            onEnd={handleAuctionEnd}
          />
          <div className="mb-6">
            <p className="text-sm text-gray-500">Current bid</p>
            <p className="text-2xl font-bold">{formatEther(BigInt(listing.price))} ETH</p>
          </div>
          <CustomButton
            type='button'
            title='Place bid'
            className='bg-accent h-[60px] text-base w-full'
            onClick={() => setShowBidModal(true)}
          />
        </div>
      );
    }

    return (
      <div className='bg-secondary rounded-[20px]'>
        <div className="mb-6">
          <p className="text-sm text-gray-500">Price</p>
          <p className="text-2xl font-bold">{formatEther(BigInt(listing.price))} ETH</p>
        </div>
        <CustomButton
          type='button'
          title='Buy Now'
          className='bg-accent h-[60px] text-base w-full'
          onClick={() => setShowBuyModal(true)}
        />
      </div>
    );
  };

  if (!metadata) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <main>
      <div>
        <Image
          src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
          alt={metadata.name}
          className="object-fill min-w-full max-h-[560px] h-full mb-10"
          width={100}
          height={100}
          style={{ width: "auto", height: "auto" }}
          quality={100}
          priority
        />
        <div className='max-w-[1050px] mx-auto px-8 md:px-11 lg:px-36 xl:px-0'>
          <div className='grid gap-2 mb-7'>
            <h1 className="text-2xl md:text-3xl xl:text-5xl font-semibold">{metadata.name}</h1>
            {listing ? (
              <p className='text-base text-primary xl:text-2xl'>
                Minted on {new Date(parseInt(nft.blockTimestamp) * 1000).toLocaleDateString()}
              </p>
            ) : (
              <p className='text-base text-primary xl:text-2xl'>Not listed</p>
            )}
          </div>

          <div className='mb-7 bg-secondary p-8 rounded-[20px]'>
            <p className="text-sm">Auction ends in:</p>
            <div className=''>
                {renderAuctionOrPriceSection()}
            </div>
            {listing?.isAuction && !isAuctionEnded && (
              <CustomButton
                type='button'
                title='Place bid'
                className='bg-accent h-[60px] text-base w-full'
              />
            )}
          </div>

          <div className='mb-8'>
            <p className="text-base text-primary xl:text-2xl font-mono font-bold mb-3">Created by</p>
            <span className='flex items-center gap-2'>
              <Image
                src={listing?.creator ? `https://effigy.im/a/${listing.creator}.svg` : 'https://via.placeholder.com/100'}
                alt={listing?.creator ? `${listing.creator.slice(0, 6)}...${listing.creator.slice(-4)}` : "0x134..."}
                width={100}
                height={100}
                className="max-w-7 max-h-7 rounded-full object-cover"
                style={{width: "auto", height: "auto"}}
              />
              <p className="font-semibold text-white">
                {listing?.creator ? `${listing.creator.slice(0, 6)}...${listing.creator.slice(-4)}` : "0x134..."}
              </p>
            </span>
          </div>

          <div className="text-base mb-8">
            <h2 className="text-primary xl:text-2xl font-bold mb-4 font-mono">Description</h2>
            <p>{metadata.description}</p>
          </div>

          <div className='mb-8 text-base'>
            <p className="text-primary xl:text-2xl font-mono font-bold mb-4">Details</p>
            <Link
              href={`https://sepolia.etherscan.io/tx/${nft.transactionHash}`}
              target="_blank"
              className='flex items-center gap-2 mb-3'
            >
              <Earth size={20} className='h-5 w-5' />
              <p>View on Etherscan</p>
            </Link>
            <Link
              href={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              target="_blank"
              className='flex items-center gap-2'
            >
              <Earth size={20} className='h-5 w-5' />
              <p>View original</p>
            </Link>
          </div>
        </div>
      </div>

      {creatorData?.itemListeds?.length > 0 && (
        <div className='max-w-[1050px] mx-auto my-20 px-8 md:px-11 lg:px-36 xl:px-0'>
          <div className='flex items-center justify-between mb-14'>
            <h1 className='text-2xl xl:text-4xl font-bold'>More from this artist</h1>
            <Link href={`/creator/${listing?.creator}`} className='hidden md:block'>
              <CustomButton
                type='button'
                title='Go To Artist Page'
                className='bg-background border-2 border-solid border-accent h-[60px] text-base'
                icon={<ArrowBigRight size={20} />}
              />
            </Link>
          </div>
          <div>
            <NftGrid data={{ tokenMinteds: creatorData.tokenMinteds, itemListeds: creatorData.itemListeds }} />
          </div>
          <Link href={`/creator/${listing?.creator}`} className='block md:hidden mb-7'>
            <CustomButton
              type='button'
              title='Go To Artist Page'
              className='bg-background border-2 border-solid border-accent h-[60px] text-base w-full'
              icon={<ArrowBigRight size={20} />}
            />
          </Link>
        </div>
      )}
      {listing && (
        <>
          <BidModal
            isOpen={showBidModal}
            onClose={() => setShowBidModal(false)}
            nftAddress={listing.nftAddress}
            tokenId={listing.tokenId}
            currentBid={listing.price}
            minBidIncrement="100000000000000000" // 0.1 ETH,
          />
          <BuyModal
            isOpen={showBuyModal}
            onClose={() => setShowBuyModal(false)}
            nftAddress={listing.nftAddress}
            tokenId={listing.tokenId}
            price={listing.price}
            metadata={{
              name: metadata?.name || '',
              image: metadata?.image || ''
            }}
          />
        </>
      )}
    </main>
  );
};

export default NFTDetails;