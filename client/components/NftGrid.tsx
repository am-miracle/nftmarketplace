"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatEther } from 'viem'
import NftCard from './NftCard' // Adjust the import path as needed
import { NFTListing, TokenMinted } from '@/types/nft';
import PlaceHolder from "../assets/collectibles.svg"

interface NFTGridProps {
    data: {
        tokenMinteds: TokenMinted[],
        itemListeds: NFTListing[] | null,
    }
    className?: string
}

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, string>;
}

const NFTGrid = ({ data, className }: NFTGridProps) => {
    const [nftMetadata, setNftMetadata] = useState<{[key: string]: NFTMetadata}>({})

    const getNFTMetadata = async (uri: string): Promise<NFTMetadata | null> => {
        try {
            const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
            const metadata = await response.json()
            return metadata
        } catch (error) {
            console.error('Error fetching metadata:', error)
            return null
        }
    }

    const getNFTListingDetails = (tokenId: string) => {
        if (!data.itemListeds) {
            return null
        }
        return data.itemListeds.find((listing: NFTListing) => listing.tokenId === tokenId)
    }

    useEffect(() => {
        const fetchMetadata = async () => {
            const metadataPromises = data.tokenMinteds.map(async (nft) => {
                const metadata = await getNFTMetadata(nft.tokenURI)
                return { [nft.tokenId]: metadata }
            })

            const metadataResults = await Promise.all(metadataPromises)
            const metadataMap = metadataResults.reduce((acc, curr) => ({...acc, ...curr}), {})
            setNftMetadata(metadataMap as {[key: string]: NFTMetadata})
        }

        fetchMetadata()
    }, [data.tokenMinteds])

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:py-20 lg:py-20`}>
            {data.tokenMinteds.map((nft: TokenMinted) => {
                const listing = getNFTListingDetails(nft.tokenId)
                const metadata = nftMetadata[nft.tokenId]
                const imageUrl = metadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')

                // You might want to replace this with an actual owner image or fallback
                const ownerImage = 'https://via.placeholder.com/100'

                return (
                    <Link
                        href={`/nft/${nft.tokenId}`}
                        key={nft.id}
                    >
                        <NftCard
                            name={metadata?.name || 'Unnamed NFT'}
                            image={imageUrl || PlaceHolder}
                            price={listing ? Number(formatEther(BigInt(listing.price))) : undefined}
                            owner={listing?.creator || "Shroomie"} // Assuming there's an owner field
                            ownerImage={ownerImage}
                            className={className}
                        />
                    </Link>
                )
            })}
        </div>
    )
}

export default NFTGrid