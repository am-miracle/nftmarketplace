"use client"
import React, { useEffect, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';
import { NFT_COLLECTION_ABI, NFT_COLLECTION_ADDRESS } from "@/constants/abis/NFTCollection";
import toast from 'react-hot-toast';
import CustomButton from './custom/CustomButton';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Record<string, string>
}

interface SingleNFT {
  file: File | null
  name: string
  description: string
  traits: Array<{ trait_type: string; value: string }>
}

const MintNFTForm: React.FC = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [nfts, setNfts] = useState<SingleNFT[]>([{
    file: null,
    name: '',
    description: '',
    traits: []
  }]);
  const [royaltyFee, setRoyaltyFee] = useState<number>(500);
  const [isUploading, setIsUploading] = useState(false);

  // Contract interaction hooks
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isMinting, isSuccess: isMinted, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (writeError) {
      toast.error(`Minting failed: ${writeError.message}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (isMinted && receipt) {
      toast.success(isBatchMode ? "NFTs minted successfully!" : "NFT minted successfully!");

      // Reset form
      setNfts([{
        file: null,
        name: '',
        description: '',
        traits: []
      }]);
      setIsBatchMode(false);

      // Find mint event and redirect
      const tokenMintedTopic = '0x981ae483e9defbea26e4d2e5a0b16bff14c5644c8b0d57ed2d85446dd9f9f8aa';
      const mintEvent = receipt.logs.find(log => log.topics[0] === tokenMintedTopic);

      if (mintEvent) {
        const tokenId = BigInt(mintEvent.topics[2] as `0x${string}`);
        router.push(`/list/${tokenId.toString()}`);
      }
    }
  }, [isMinted, receipt, router, isBatchMode]);

  const uploadToPinata = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      return data.ipfsHash;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  };

  const uploadMetadataToPinata = async (metadata: NFTMetadata) => {
    try {
      const response = await fetch('/api/uploadMetadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Metadata upload failed');
      }

      const data = await response.json();
      return data.ipfsHash;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw error;
    }
  };

  const addNFT = () => {
    setNfts(prev => [...prev, {
      file: null,
      name: '',
      description: '',
      traits: []
    }]);
    setIsBatchMode(true);
  };

  const removeNFT = (index: number) => {
    setNfts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 1) setIsBatchMode(false);
      return updated;
    });
  };

  const updateNFT = (index: number, field: keyof SingleNFT, value: string | File | null) => {
    setNfts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTrait = (nftIndex: number) => {
    setNfts(prev => {
      const updated = [...prev];
      updated[nftIndex].traits.push({ trait_type: '', value: '' });
      return updated;
    });
  };

  const removeTrait = (nftIndex: number, traitIndex: number) => {
    setNfts(prev => {
      const updated = [...prev];
      updated[nftIndex].traits = updated[nftIndex].traits.filter((_, i) => i !== traitIndex);
      return updated;
    });
  };

  const updateTrait = (nftIndex: number, traitIndex: number, field: 'trait_type' | 'value', value: string) => {
    setNfts(prev => {
      const updated = [...prev];
      updated[nftIndex].traits[traitIndex][field] = value;
      return updated;
    });
  };

  const handleMint = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Validation
    const invalidNFTs = nfts.filter(nft => !nft.file || !nft.name || !nft.description);
    if (invalidNFTs.length > 0) {
      toast.error("Please fill in all required fields for each NFT");
      return;
    }

    setIsUploading(true);

    try {
      const tokenURIs = await Promise.all(nfts.map(async (nft) => {
        if (!nft.file) throw new Error("File is required");

        // Upload image
        const imageHash = await uploadToPinata(nft.file);
        const imageUrl = `ipfs://${imageHash}`;

        // Create and upload metadata
        const metadata: NFTMetadata = {
          name: nft.name,
          description: nft.description,
          image: imageUrl,
          attributes: nft.traits.reduce((acc, trait) => {
            if (trait.trait_type && trait.value) {
              acc[trait.trait_type] = trait.value;
            }
            return acc;
          }, {} as Record<string, string>),
        };

        const metadataHash = await uploadMetadataToPinata(metadata);
        return `ipfs://${metadataHash}`;
      }));

      if (isBatchMode) {
        await writeContract({
          address: NFT_COLLECTION_ADDRESS as `0x${string}`,
          abi: NFT_COLLECTION_ABI,
          functionName: 'batchMint',
          args: [address, tokenURIs, BigInt(royaltyFee)],
        });
      } else {
        await writeContract({
          address: NFT_COLLECTION_ADDRESS as `0x${string}`,
          abi: NFT_COLLECTION_ABI,
          functionName: 'mint',
          args: [address, tokenURIs[0], BigInt(royaltyFee)],
        });
      }
    } catch (error: Error | unknown) {
      console.error('Error minting NFT:', error);
      toast.error(error instanceof Error ? error.message : "Failed to mint NFT. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* NFT Forms */}
      <div className="space-y-6">
        {nfts.map((nft, index) => (
          <Card key={index} className="p-6">
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">NFT {index + 1}</h3>
                {nfts.length > 1 && (
                  <button
                    onClick={() => removeNFT(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <Label htmlFor={`name-${index}`}>Name</Label>
                <Input
                  id={`name-${index}`}
                  value={nft.name}
                  onChange={(e) => updateNFT(index, 'name', e.target.value)}
                  className="bg-white rounded-[20px] h-12"
                  placeholder="Enter NFT name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={nft.description}
                  onChange={(e) => updateNFT(index, 'description', e.target.value)}
                  className="bg-white rounded-[20px]"
                  placeholder="Describe your NFT"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <Label>Image</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => updateNFT(index, 'file', e.target.files?.[0] || null)}
                    id={`file-${index}`}
                  />
                  <Label htmlFor={`file-${index}`} className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm text-gray-600">
                      {nft.file ? nft.file.name : 'Click to upload image'}
                    </span>
                  </Label>
                </div>
              </div>

              {/* Traits */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Attributes</Label>
                  <CustomButton
                    type="button"
                    title="Add Attribute"
                    onClick={() => addTrait(index)}
                    className="border-accent bg-background border-2 text-base"
                  />
                </div>
                {nft.traits.map((trait, traitIndex) => (
                  <div key={traitIndex} className="flex gap-4 items-center">
                    <Input
                      placeholder="Trait Type"
                      value={trait.trait_type}
                      onChange={(e) => updateTrait(index, traitIndex, 'trait_type', e.target.value)}
                      className="bg-white rounded-[20px] h-12"
                    />
                    <Input
                      placeholder="Value"
                      value={trait.value}
                      onChange={(e) => updateTrait(index, traitIndex, 'value', e.target.value)}
                      className="bg-white rounded-[20px] h-12"
                    />
                    <button
                      onClick={() => removeTrait(index, traitIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Settings */}
      <Card className="mt-6 p-6">
        <CardContent>
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
              className="bg-white rounded-[20px] h-12"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <CustomButton
          type="button"
          title="Add Another NFT"
          onClick={addNFT}
          className="border-accent bg-background border-2 text-base"
        />
        <CustomButton
          type="button"
          isLoading={!address || isUploading || isMinting}
          className="flex-1 bg-accent h-12"
          onClick={handleMint}
          title={
            !address
              ? 'Connect Wallet'
              : isUploading
                ? 'Uploading...'
                : isMinting
                  ? 'Minting...'
                  : isBatchMode ? 'Mint Batch' : 'Mint NFT'
          }
        />
      </div>
    </div>
  );
};

export default MintNFTForm;