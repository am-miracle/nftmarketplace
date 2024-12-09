import Astro from "../../assets/astro.svg";
import Edena from "../../assets/Edena.svg";
import Nft from "../../assets/nft.svg";


export const mockNFTs = [
  {
    id: "1",
    tokenId: "1",
    name: "Cool NFT #1",
    description: "A very cool NFT",
    image: Nft,
    contractAddress: "0x123...",
    owner: {
      id: "0x456...",
      username: "CoolCollector",
      profileImage: null
    },
    listing: {
      price: "1000000000000000000", // 1 ETH in wei
      isAuction: false
    }
    },
    {
    id: "2",
    tokenId: "2",
    name: "Cool NFT #2",
    description: "A very Astro fiction NFT",
    image: Astro,
    contractAddress: "0x123...",
    owner: {
      id: "0x456...",
      username: "Astro",
      profileImage: null
    },
    listing: {
      price: "2000000000000000000", // 1 ETH in wei
      isAuction: true
    }
    },
    {
    id: "3",
    tokenId: "3",
    name: "Cool NFT #3",
    description: "A very Edena NFT",
    image: Edena,
    contractAddress: "0x123...",
    owner: {
      id: "0x456...",
      username: "Edena",
      profileImage: null
    },
    listing: {
      price: "3000000000000000000", // 1 ETH in wei
      isAuction: false
    }
  },
  // Add more mock NFTs...
];