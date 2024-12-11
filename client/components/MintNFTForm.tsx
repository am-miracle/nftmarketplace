"use client"
import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useSimulateContract, useWriteContract } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { NFT_COLLECTION_ABI, NFT_COLLECTION_ADDRESS } from "@/constants/abis/NFTCollection";
import toast from 'react-hot-toast';
import CustomButton from './custom/CustomButton';
// import { useRouter } from 'next/navigation';


interface MintNFTFormProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
}

const MintNFTForm: React.FC<MintNFTFormProps> = ({
  categories,
}) => {
  const { address } = useAccount();
  // const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    royaltyFee: '250', // 2.5% default
    category: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [metadataUrl, setMetadataUrl] = useState<string>();
  const [success, setSuccess] = useState(false);

  const { data: simulateData } = useSimulateContract({
    address: NFT_COLLECTION_ADDRESS as `0x${string}`,
    abi: NFT_COLLECTION_ABI,
    functionName: 'mint',
    args: address && metadataUrl ? [address, metadataUrl, BigInt(formData.royaltyFee)] : undefined,
  });

  const { writeContract, isPending, isError, error: writeError } = useWriteContract();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess(false);

      // Upload image to Pinata
      const imageFormData = new FormData();
      imageFormData.append('file', files[0]);
      const imageRes = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData,
      });

      if (!imageRes.ok) throw new Error('Failed to upload image');
      const { url: imageUrl } = await imageRes.json();

      // Create and upload metadata
      const metadataRes = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          image: imageUrl,
          attributes: []
        }),
      });

      if (!metadataRes.ok) throw new Error('Failed to create metadata');
      const { url } = await metadataRes.json();
      setMetadataUrl(url);

      // Trigger mint transaction
      if (simulateData?.request) {
        writeContract(simulateData.request);
      }

      setSuccess(true);

    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = useCallback(
    () => {
    setFormData({
      name: '',
      description: '',
      royaltyFee: '250',
      category: '',
    });
    setFiles(null);
    setMetadataUrl(undefined);
    setSuccess(true);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['nfts'] });
  },[queryClient])

  // Reset form on successful mint
  useEffect(() => {
    if (!isPending && !isError && metadataUrl) {
      resetForm();
    }
  }, [isPending, isError, metadataUrl, resetForm]);

  if (!address) {
    toast.error('Please connect your wallet first');
  }

  return (
    <section className='max-w-lg mx-auto'>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              placeholder='Enter your NFT name'
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              placeholder='Describe your NFT'
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
            <SelectTrigger
              className='bg-white rounded-[20px] h-12 text-base text-background'
            >
                <SelectValue placeholder="Select category" />
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

          <div>
            <Label htmlFor="royaltyFee">Royalty Fee (%)</Label>
            <Input
              id="royaltyFee"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={Number(formData.royaltyFee) / 100}
              onChange={(e) => setFormData({
                ...formData,
                royaltyFee: String(parseFloat(e.target.value) * 100)
              })}
              className='bg-white rounded-[20px] h-12 text-base text-background block w-full ps-14 p-2.5'
              required
            />
          </div>


          <div>
            <Label htmlFor="file">Upload Image</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className='bg-white rounded-[20px] h-12 text-base text-background cursor-pointer placeholder:text-accent'
              required
            />
            {files && files.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {files[0].name}
              </p>
            )}
          </div>

          {(error || writeError) && (
            <div className="text-red-500 text-sm">
              {error || writeError?.message}
            </div>
          )}

          {success && (
            toast.success("NFT minted successfully")
          )}

        <CustomButton
            type="submit"
            isLoading={!address || uploading || isPending}
            className="w-full bg-accent h-12"
            title={`${uploading || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? 'Uploading...' : 'Minting...'}
              </>
            ) : (
              'Mint NFT'
            )}`}
          />
        </form>
    </section>
  );
};

export default MintNFTForm;