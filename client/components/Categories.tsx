import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Utility from "../assets/utility.svg"
import Art from "../assets/art.svg"
import Music from "../assets/music.svg"
import Collectibles from "../assets/collectibles.svg"
import Sports from "../assets/sport.svg"
import Others from "../assets/others.svg"
import Photography from "../assets/photography.svg"
import Video from "../assets/video.svg"
import Basketball from "../assets/Basketball.svg"
import BookmarksSimple from "../assets/BookmarksSimple.svg"
import Camera from "../assets/Camera.svg"
import MagicWand from "../assets/MagicWand.svg"
import MusicNotes from "../assets/MusicNotes.svg"
import PainBrush from "../assets/PaintBrush.svg"
import VideoCamera from "../assets/VideoCamera.svg"
import Swatches from "../assets/Swatches.svg"
import { GET_CATEGORIES, GET_CATEGORY_LISTINGS } from '@/lib/queries';
import { getClient } from '@/lib/apollo-client';
import { CategoryAdded, NFTListing } from '@/types';



// Categories List Component
export const CategoriesList = async () => {
  const { data } = await getClient().query({
    query: GET_CATEGORIES,
  });

  const categories = data.categoryAddeds || [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 xl:gap-7">
    {categories.map((cat: CategoryAdded, index: number) => (
        <Link
            key={cat.id}
            href={`/categories/${cat.category}`}
        >
            <Card className='p-0 border-0 rounded-[20px] overflow-hidden bg-secondary
            hover:scale-95 ease-in-out duration-300'>
                <div className='relative'>
                    <Image
                        src={images[index % images.length].img}
                        alt="Placeholder Image"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover blur-[6px]"
                        style={{ width: "auto", height: "auto" }}
                    />
                    <Image
                        src={images[index % images.length].icon}
                        alt="Placeholder Image"
                        width={100}
                        height={100}
                        className="absolute bottom-0 top-0 right-0 left-0 m-auto max-h-[80px] max-w-[80px]"
                        style={{ width: "auto", height: "auto" }}
                    />
                </div>
                <CardContent className='pt-5 pb-6 font-semibold text-base md:text-xl xl:text-2xl'>
                    {cat.name}
                </CardContent>
            </Card>
        </Link>
    ))}
    </div>
  );
};


const images = [
    {
        icon: MusicNotes,
        img: Music,
    },
    {
        icon: MagicWand,
        img: Utility,
    },
    {
        icon: Basketball,
        img: Sports,
    },
    {
        icon: VideoCamera,
        img: Video,
    },
    {
        icon: BookmarksSimple,
        img: Others,
    },
    {
        icon: Swatches,
        img: Collectibles,
    },
    {
        icon: PainBrush,
        img: Art,
    },
    {
        icon: Camera,
        img: Photography,
    },
]

// Category Listings Component
export const CategoryListings = async ({ categoryId }: { categoryId: string }) => {
  const { data } = await getClient().query({
    query: GET_CATEGORY_LISTINGS,
    variables: {
      category: categoryId,
    },
  });

    const listings = data.itemListeds || [];
    
    console.log(listings)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing: NFTListing) => (
        <Link
          key={listing.id}
          href={`/nft/${listing.nftAddress}/${listing.tokenId}`}
          className="block"
        >
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <Image
                src="/api/placeholder/200/200"
                alt={`${listing.collectionName} #${listing.tokenId}`}
                width={100}
                height={100}
                className="w-full h-full object-cover"
                style={{width: "auto", height: "auto"}}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">
                {listing.collectionName} #{listing.tokenId}
              </h3>
              <p className="text-sm mb-2 text-gray-600">
                {Number(listing.price) / 1e18} ETH
              </p>
              <p className="text-xs text-gray-500 truncate">
                Seller: {listing.seller}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
      {listings.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No NFTs listed in this category yet
        </div>
      )}
    </div>
  );
};