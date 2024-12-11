"use client"
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react'
import { Address, parseEther } from 'viem';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import CustomButton from './custom/CustomButton';
import { useAccount, useReadContract, useSimulateContract, useWriteContract } from 'wagmi';
import toast from 'react-hot-toast';
import { NFT_COLLECTION_ABI } from '@/constants/abis/NFTCollection';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/constants/abis/NFTMarketplace';

interface ListNFTFormProps {
    categories: Array<{ id: string, name: string }>;
    tokenId: bigint;
    nftAddress: Address;
}
const ListingForm = ({ categories, tokenId, nftAddress }: ListNFTFormProps) => {
    const query = useQueryClient();
    const { address } = useAccount();
    const [formData, setFormData] = useState({
        price: "",
        categories: "",
        isAuction: false,
    })
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    
    // check if NFT is already approved for marketplace
    const { data: approvedAddress } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_COLLECTION_ABI,
        functionName: "getApproved",
        args: [tokenId]
    });
    
    // check if user owns the NFT
    const { data: ownerAddress } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_COLLECTION_ABI,
        functionName: "ownerOf",
        args: [tokenId]
    });

    // prepare approve transaction
    const { data: simulateApprove } = useSimulateContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_COLLECTION_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS as `0x${string}`, tokenId],
    })

    // prepare list item transaction
    const { data: simulateListItem } = useSimulateContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: "listItem",
        args: formData.price ? [
            nftAddress as `0x${string}`,
            tokenId,
            parseEther(formData.price),
            formData.isAuction,
            formData.categories as `0x${string}`,
        ]: [nftAddress as `0x${string}`, tokenId, parseEther("0"), false, formData.categories as `0x${string}`],
    })
     
    const { writeContract, isPending } = useWriteContract();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) {
            setError("Please connect to a wallet");
            toast.error("Please connect to a wallet");
            return;
        }
        try {
            setError("");
            setSuccess(false);
            
            // check ownership
            if (ownerAddress !== address) {
                setError("You don't own this NFT");
                toast.error("You don't own this NFT");
                return;
            }

            // first approve if needed
            if (approvedAddress !== MARKETPLACE_ADDRESS && simulateApprove?.request) {
                await writeContract(simulateApprove?.request);
            }

            // Then list it
            if (simulateListItem?.request) {
                await writeContract(simulateListItem?.request);
                setSuccess(true);
                toast.success("Item listed successfully");
                query.invalidateQueries({ queryKey: ['listings'] });
            }

        } catch (error: Error | unknown) {
            if (error instanceof Error) {
                toast.error("Error signing message" + error.message);
                setError(error.message);
            } else {
                setError("Failed to list NFT");
            }
            console.error(JSON.stringify(error, null, 2))
        }
    }
    if (!address) {
        toast.error("Please connect to a wallet");
    }
  return (
      <section className='max-w-lg mx-auto'>
          <form onSubmit={handleSubmit}>
              <div>
                <Label htmlFor='price'>Price</Label>
                <Input
                    id='price'
                    type={"number"}
                    step="0.000000000000000001"
                    min={"0"}
                      required
                      placeholder='Enter price'
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value })}
                    className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
                />
              </div>
              <div>
                  <Label htmlFor='category'>Category</Label>
                  <Select
                      value={formData.categories}
                      onValueChange={(value) => setFormData({...formData, categories: value})}
                  >
                      <SelectTrigger
                        className='bg-white rounded-[20px] h-12 text-base text-background'
                      >
                          <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent
                        className='bg-white rounded-[20px] text-base text-background active:text-white'
                      >
                          {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="flex items-center space-x-2">
                  <Switch
                      onCheckedChange={(value) => setFormData({ ...formData, isAuction: value })}
                      checked={formData.isAuction}
                      id='auction-mode'
                  />
                  <Label htmlFor='auction-mode'>List as auction</Label>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {success && toast.success("NFT listed successfully")}
              <CustomButton
                  type='submit'
                  title='List NFT'
                  className='bg-accent w-full mb-7 h-[60px] text-base'
                  isLoading={!address || isPending}
              />
          </form>
    </section>
  )
}

export default ListingForm