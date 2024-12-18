"use client";
import { useAccount, useDisconnect, useEnsName, useSignMessage, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, ExternalLink, Key, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { SUPPORTED_NETWORK } from '@/lib/providers';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import CustomButton from './custom/CustomButton';

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
const MESSAGE_TO_SIGN = "Welcome to NEFLEX an NFT Marketplace! Click to sign in and accept the Terms of Service.";

export function ConnectedWallet() {
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
    const { disconnect } = useDisconnect();
    const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
    const { signMessage } = useSignMessage({
        mutation: {
            onSuccess(data) {
              toast.success("Successfully signed");
              setShowSignDialog(false);
              // Store the signature or update user verification status
              // You might want to send this to your backend
              console.log('Signature:', data);
            },
              onError(error: Error) {
                if (error instanceof Error) {
                    toast.error("Error signing message" + error.message);
                }
            },
        }
  });
  const [showSignDialog, setShowSignDialog] = useState(false);

  if (!address) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

    const openEtherscan = () => {
        const baseUrl = chain?.id === SUPPORTED_NETWORK.id
        ? 'https://sepolia.etherscan.io'
        : 'https://etherscan.io';
        window.open(`${baseUrl}/address/${address}`, '_blank');
    };

    const handleSignMessage = () => {
    signMessage({ message: MESSAGE_TO_SIGN });
  };

  const isWrongNetwork = chain?.id !== SUPPORTED_NETWORK.id;

  if (isWrongNetwork) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-red-500 bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-lg">
          Please switch to Sepolia Testnet
        </div>
        <CustomButton
            onClick={() => switchChain({chainId: SUPPORTED_NETWORK.id})}
            type="button"
                title='Switch to Sepolia'
                className='bg-accent w-full'
        />
      </div>
    );
  }


    return (
      <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="w-full h-[60px] px-5 py-3 text-white bg-accent font-semibold text-xl rounded-[20px] border-none shadow-sm hover:scale-95 ease-in-out duration-300 flex items-center">
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
                <DropdownMenuItem
                    onClick={() => setShowSignDialog(true)}
                    className="cursor-pointer text-xl"
                >
                    <Key className="mr-2 h-4 w-4" />
                    <span>Sign Message</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer text-xl">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Disconnect</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sign Message to Verify</DialogTitle>
                    <DialogDescription className="pt-4">
                        <div className="bg-secondary p-4 rounded-lg mb-4 font-mono text-sm">
                            {MESSAGE_TO_SIGN}
                        </div>
                        <CustomButton
                            title='Sign Message'
                            type='button'
                            onClick={handleSignMessage}
                            className="w-full"
                        />
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
      </>
  );
}