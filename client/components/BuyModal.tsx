"use client"
// components/modals/BuyModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {  useEffect } from "react"
import { formatEther } from "viem"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import toast from "react-hot-toast"
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/constants/abis/NFTMarketplace"
import CustomButton from "./custom/CustomButton"
import Image from "next/image"

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  nftAddress: string
  tokenId: string
  price: string
  metadata: {
    name: string
    image: string
  }
}

export function BuyModal({
  isOpen,
  onClose,
  nftAddress,
  tokenId,
  price,
  metadata
}: BuyModalProps) {
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isBuying, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleBuy = async () => {
    try {
      await writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'buyItem',
        args: [nftAddress as `0x${string}`, BigInt(tokenId)],
        value: BigInt(price)
      })

    } catch (error: Error | unknown) {
      console.error('Error buying NFT:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to buy NFT')
    }
  }

  // Close modal on success
  useEffect(() => {
    if (isSuccess) {
      toast.success('NFT purchased successfully!')
      onClose()
    }
  }, [isSuccess, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background text-white">
        <DialogHeader>
          <DialogTitle>Buy NFT</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative aspect-square rounded-lg overflow-hidden w-full max-w-[200px] mx-auto">
            <Image
                src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={metadata.name}
                className="object-cover w-full h-full"
                width={100}
                height={100}
                style={{ width: "auto", height: "auto" }}
            />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{metadata.name}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-2xl font-bold">{formatEther(BigInt(price))} ETH</p>
          </div>
        </div>
        <CustomButton
          type="button"
          title={isBuying ? 'Processing...' : 'Buy Now'}
          onClick={handleBuy}
          isLoading={isBuying}
          className="bg-accent h-[60px] text-base w-full"
        />
      </DialogContent>
    </Dialog>
  )
}