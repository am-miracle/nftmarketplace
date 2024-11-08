# NFT Marketplace

A decentralized NFT marketplace built with Solidity, leveraging the latest smart contract development practices and tools. This marketplace enables users to mint, list, buy, sell, and auction NFTs with support for royalties and marketplace fees.

## Features

- 🎨 **NFT Management**
  - Mint single and batch NFTs
  - Built-in royalty support (ERC2981)
  - Token URI management
  - Burn functionality

- 💹 **Marketplace Operations**
  - List NFTs for direct sale
  - Create timed auctions
  - Place and withdraw bids
  - Update listing prices
  - Cancel listings
  - Withdraw proceeds


## Prerequisites

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/en/) (for deployment scripts and testing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nft-marketplace.git
cd nft-marketplace
```

2. Install Foundry dependencies:
```bash
forge install
```

3. Install Node.js dependencies:
```bash
npm install
```

## Smart Contract Architecture

### NFTCollection.sol
- ERC721 implementation with ERC2981 royalty support
- Supports single and batch minting
- Configurable base URI
- Built-in royalty management

### NFTMarketplace.sol
- Core marketplace functionality
- Supports direct sales and auctions
- Handles royalty distribution
- Manages marketplace fees
- Tracks bid history

## Testing

Run the test suite:
```bash
forge test
```

Run tests with gas reporting:
```bash
forge test --gas-report
```

Run tests with verbosity:
```bash
forge test -vvv
```

## Deployment

1. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration:
```env
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

2. Deploy to testnet (Sepolia):
```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
```

## Contract Addresses

- Sepolia Testnet:
  - NFTCollection: `0x...`
  - NFTMarketplace: `0x...`

## Usage Examples

### Mint an NFT
```solidity
// 1. Approve the marketplace
IERC721(nftAddress).setApprovalForAll(marketplaceAddress, true);

// 2. Mint NFT with royalty
nftCollection.mint(recipient, tokenURI, royaltyFee);
```

### List an NFT
```solidity
// List for direct sale
marketplace.listItem(nftAddress, tokenId, price, false);

// List for auction
marketplace.listItem(nftAddress, tokenId, startingPrice, true);
```

### Place a Bid
```solidity
// Place bid with ETH
marketplace.placeBid{value: bidAmount}(nftAddress, tokenId);
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## Gas Optimization

The contracts implement several gas optimization techniques:
- Efficient storage packing
- Minimal storage operations
- Use of unchecked blocks where safe
- Optimal struct packing

## Error Handling

All error conditions are handled with custom errors for better gas efficiency and clearer error messages:
```solidity
error NFTMarketplace__PriceMustBeAboveZero();
error NFTMarketplace__NotApprovedForMarketplace();
error NFTMarketplace__AlreadyListed();
// ... etc
```

## Events

Key events are emitted for all important state changes:
```solidity
event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price, bool isAuction);
event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
// ... etc
```

## Support

For support, please open an issue in the repository.


// Layout of Contract:
// version
// imports
// errors
// interfaces, libraries, contracts
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions