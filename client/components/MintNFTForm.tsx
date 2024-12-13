"use client"
import React, { useEffect, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { NFT_COLLECTION_ABI, NFT_COLLECTION_ADDRESS } from "@/constants/abis/NFTCollection";
import toast from 'react-hot-toast';
import CustomButton from './custom/CustomButton';
import { useRouter } from 'next/navigation';


interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Record<string, string>
}


const MintNFTForm: React.FC = () => {
  const { address } = useAccount()
  const [file, setFile] = useState<File>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [royaltyFee, setRoyaltyFee] = useState<number>(500)
  const [isUploading, setIsUploading] = useState(false)
  const [traits, setTraits] = useState<Array<{ trait_type: string; value: string }>>([])
  const router = useRouter()

  // Contract interaction hooks
  const { writeContract, data: hash, error: writeError } = useWriteContract()
  const { isLoading: isMinting, isSuccess: isMinted, data: receipt } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isMinted && receipt) {
      toast.success("NFT minted successfully!")
      // Reset form
      setName('')
      setDescription('')
      setFile(undefined)
      setTraits([])

      const mintEvent = receipt.logs.find(log => {
        // TokenMinted event topic
        const tokenMintedTopic = '0x981ae483e9defbea26e4d2e5a0b16bff14c5644c8b0d57ed2d85446dd9f9f8aa' // Replace with your event topic hash
        return log.topics[0] === tokenMintedTopic;
      })

      if (mintEvent) {
        // Parse the tokenId from the event
        const tokenId = BigInt(mintEvent.topics[2] as `0x${string}`); // Adjust based on your event structure
        toast.success("NFT minted successfully!");
        // Navigate to listing page
        router.push(`/list/${tokenId.toString()}`);
      }
    }
  }, [isMinted, receipt, router])

  useEffect(() => {
    if (writeError) {
      toast.error(`Minting failed: ${writeError.message}`)
    }
  }, [writeError])


  const uploadToPinata = async (file: File) => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      return data.ipfsHash
    } catch (error) {
      console.error('Error uploading to Pinata:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const uploadMetadataToPinata = async (metadata: NFTMetadata) => {
    try {

      const response = await fetch('/api/uploadMetadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Metadata upload failed')
      }
      
      const data = await response.json()
      return data.ipfsHash
    } catch (error) {
      console.error('Error uploading metadata:', error)
      throw error
    }
  }

  const handleMint = async () => {
    if (!file || !name || !description || !address) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      // 1. Upload image to IPFS
      const imageHash = await uploadToPinata(file)
      const imageUrl = `ipfs://${imageHash}`

      // 2. Create and upload metadata
      const metadata: NFTMetadata = {
        name,
        description,
        image: imageUrl,
        attributes: traits.reduce((acc, trait) => {
          acc[trait.trait_type] = trait.value
          return acc
        }, {} as Record<string, string>),
      }
      
      const metadataHash = await uploadMetadataToPinata(metadata)
      const tokenURI = `ipfs://${metadataHash}`
      console.log(tokenURI)

      // 3. Mint NFT
      writeContract({
        address: NFT_COLLECTION_ADDRESS as `0x${string}`,
        abi: NFT_COLLECTION_ABI,
        functionName: 'mint',
        args: [address, tokenURI, BigInt(royaltyFee)], // 1% royalty fee
      })

      if (isMinted) {
        toast.success("NFT minted successfully!")
      }

    } catch (error) {
      console.error('Error minting NFT:', error)
      toast.error("Failed to mint NFT. Please try again.")
    }
  }

  const addTrait = () => {
    setTraits([...traits, { trait_type: '', value: '' }])
  }

  const updateTrait = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newTraits = [...traits]
    newTraits[index][field] = value
    setTraits(newTraits)
  }

  return (
    <section className='max-w-lg mx-auto'>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              placeholder='Enter your NFT name'
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              placeholder='Describe your NFT'
              required
            />
          </div>
        <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Attributes</Label>
            <CustomButton
              type="button"
              title='Add Attribute'
              onClick={addTrait}
              className='border-accent bg-background border-2 text-base'
            />
            </div>
            {traits.map((trait, index) => (
              <div key={index} className="flex gap-4">
                <Input
                  placeholder="Trait Type"
                  value={trait.trait_type}
                  onChange={(e) => updateTrait(index, 'trait_type', e.target.value)}
                  className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
                />
                <Input
                  placeholder="Value"
                  value={trait.value}
                  onChange={(e) => updateTrait(index, 'value', e.target.value)}
                  className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="royaltyFee">Royalty Fee (%)</Label>
            <Input
              id="royaltyFee"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={Number(royaltyFee) / 100}
              onChange={(e) => setRoyaltyFee(parseFloat(e.target.value) * 100)}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              required
            />
          </div>

        <div className="space-y-2">
          <Label htmlFor="nft-image">NFT Image</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <input
              id="nft-image"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
            <Label htmlFor="nft-image" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm text-gray-600">
                {file ? file.name : 'Click to upload image'}
              </span>
            </Label>
          </div>
        </div>

        <CustomButton
            type="submit"
            isLoading={!address || isUploading || isMinting}
            className="w-full bg-accent h-12"
            onClick={handleMint}
            title={
              !address
                ? 'Connect Wallet'
              : isUploading
                 ? 'Uploading...'
              : isMinting
                ? 'Minting...'
              : 'Mint NFT'
            }
          />
        </div>
    </section>
  );
};

export default MintNFTForm;