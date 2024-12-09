"use client"
import React from 'react'
import Nft from "../../assets/nft.svg"
import Owner from "../../assets/owner.svg"
import { Rocket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CustomButton from '../custom/CustomButton';


const Hero = () => {
  return (
    <header className='text-foreground px-8 py-10 md:px-11 lg:px-36'>
      <div className='max-w-[1050px] mx-auto flex flex-col md:flex-row items-center gap-8'>
        <div className='w-full md:w-1/2'>
          <div className='mb-6'>
            <h1 className='xl:text-6xl lg:text-5xl text-3xl font-bold mb-3 capitalize'>Discover digital art & Collect NFTs</h1>
            <p className='lg:text-lg xl:text-2xl text-lg'>NFT marketplace built on Ethereum. Collect, buy, sell, and auction NFTs from more than 20k NFT artists.</p>
          </div>
          <div className='hidden md:block'>
            <Link href="/sign-up">
              <CustomButton
                type='button'
                title='Get Started'
                className='bg-accent md:w-1/2 mb-7 h-[60px] text-base'
                icon={<Rocket size={20} className="mr-3" />}
              />
            </Link>
            <div className="flex items-center lg:space-x-8 xl:space-x-16">
              <span>
                <p className='font-bold lg:text-xl xl:text-2xl font-mono'>240k+</p>
                <p className='text-xl'>Total Sales</p>
              </span>
              <span>
                <p className='font-bold lg:text-xl xl:text-2xl font-mono'>100k+</p>
                <p className='text-xl'>Auctions</p>
              </span>
              <span>
                <p className='font-bold lg:text-xl xl:text-2xl font-mono'>240k+</p>
                <p className='text-xl'>Artists</p>
              </span>
            </div>
          </div>
        </div>
        
        <div className='w-full md:w-1/2 flex flex-col items-center'>
          <NftCard 
            id={nftData.id}
            name={nftData.name}
            image={nftData.image}
            owner={nftData.owner}
            ownerImage={nftData.ownerImage}
          />
          
          <div className='md:hidden w-full mt-6'>
            <CustomButton
              type='button'
              title='Get Started'
              className='bg-accent w-full mb-7 h-[60px] text-base'
              icon={<Rocket size={20} className="mr-3" />}
              />
            <div className="flex items-center justify-between md:justify-normal space-x-8">
              <span>
                <p className='font-bold text-2xl font-mono'>240k+</p>
                <p className='text-base md:text-xl'>Total Sales</p>
              </span>
              <span>
                <p className='font-bold text-2xl font-mono'>100k+</p>
                <p className='text-base md:text-xl'>Auctions</p>
              </span>
              <span>
                <p className='font-bold text-2xl font-mono'>240k+</p>
                <p className='text-base md:text-xl'>Artists</p>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Hero;

const nftData = {
    id: '1',
    name: 'Space Walking',
    image: Nft,
    owner: 'DigitalArtist123',
    ownerImage: Owner,
}


interface NftCardProps {
  id?: string;
  name: string;
  image: string;
  price?: number;
  owner: string;
  ownerImage: string;
  highestBid?: number;
}

const NftCard = ({ name, image, price, owner, ownerImage, highestBid }: NftCardProps) => {
  return (
    <Link href="#">
      <div className="perspective-container" style={{ perspective: '1500px' }}>
      <div className="relative bg-secondary text-foreground rounded-[20px] shadow-lg overflow-hidden w-full preserve-3d animated-card">
        {/* NFT Image */}
        <div className="p-3">
          <Image
            src={image}
            alt={name}
            width={100}
            height={100}
            className="h-[206px] w-full xl:h-full object-cover rounded-[20px]"
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
            ) : (
              <div className="w-7 h-7 rounded-full mr-3 bg-gray-300">{name[0]}</div>
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

        {/* Side panels for 3D effect */}
        <div className="absolute inset-0 rounded-[20px] shadow-side-left" />
        <div className="absolute inset-0 rounded-[20px] shadow-side-right" />
      </div>

      <style jsx global>{`
        .perspective-container {
          transform-style: preserve-3d;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        .animated-card {
          animation: wellMove 10s infinite ease-in-out;
          transform-origin: center center;
        }
        
        .shadow-side-left,
        .shadow-side-right {
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        @keyframes wellMove {
          0%, 100% {
            transform: translateZ(0) rotateY(0deg);
          }
          25% {
            transform: translateZ(-60px) rotateY(15deg);
          }
          50% {
            transform: translateZ(0) rotateY(0deg);
          }
          75% {
            transform: translateZ(-60px) rotateY(-15deg);
          }
        }
      `}</style>
    </div>
    </Link>
  );
};