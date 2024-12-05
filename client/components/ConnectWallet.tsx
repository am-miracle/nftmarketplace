"use client";
import { useAccount, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomButton from './custom/CustomButton';

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectedWallet() {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { disconnect } = useDisconnect();

  if (!address) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  const openEtherscan = () => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto h-[60px] px-5 py-3 text-white bg-accent font-semibold text-xl rounded-[20px] border-none shadow-sm hover:scale-95 ease-in-out duration-300 flex items-center">
          <span>{ensName || shortenAddress(address)}</span>
          <ChevronDown size={20} className="h-6 w-6 ml-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full mt-2">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer text-xl">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openEtherscan} className="cursor-pointer text-xl">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Etherscan</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-xl">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}