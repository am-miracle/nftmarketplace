// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import {Test, console} from "forge-std/Test.sol";
// import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
// import {NFTCollection} from "../../src/NFTCollection.sol";
// import {DeployNftMarketplace} from "../../script/DeployNFTMarketplace.s.sol";
// import {DeployNftCollection} from "../../script/DeployNftCollection.s.sol";

// contract Handler is Test {
//     NFTMarketplace marketplace;
//     NFTCollection nftCollection;

//     // Track valid token IDs and their states
//     mapping(uint256 => bool) public tokenExists;
//     mapping(uint256 => bool) public tokenIsListed;
//     mapping(uint256 => address) public tokenOwner;
//     mapping(uint256 => uint256) public tokenPrice;
//     mapping(uint256 => bool) public tokenIsAuction;

//     // Track users and their states
//     mapping(address => uint256) public userEarnings;
//     mapping(address => bool) public isUser;
//     address[] public users;

//     // Categories
//     bytes32[] public validCategories;

//     // Constants
//     uint256 public constant MIN_PRICE = 0.01 ether;
//     uint256 public constant MAX_PRICE = 100 ether;

//     constructor(NFTMarketplace _marketplace, NFTCollection _nftCollection) {
//         marketplace = _marketplace;
//         nftCollection = _nftCollection;

//         // Initialize valid categories from deployment
//         validCategories = marketplace.getCategories();
//     }

//     // Modifiers
//     modifier createUser(address user) {
//         if (!isUser[user]) {
//             isUser[user] = true;
//             users.push(user);
//             vm.deal(user, 100 ether);
//         }
//         _;
//     }

//     // Helper functions
//     function createNFT(address to) public returns (uint256) {
//         string memory uri = "testURI.json";
//         uint96 royaltyFee = 500; // 5%

//         vm.startPrank(nftCollection.owner());
//         uint256 tokenId = nftCollection.mint(to, uri, royaltyFee);
//         tokenExists[tokenId] = true;
//         tokenOwner[tokenId] = to;
//         vm.stopPrank();

//         return tokenId;
//     }

//     function getTokenCount() public view returns (uint256) {
//         return nftCollection.getTokenCount();
//     }

//     function getRandomUser() public view returns (address) {
//         if (users.length == 0) return address(1);
//         return users[bound(uint256(keccak256(abi.encode(block.timestamp))), 0, users.length - 1)];
//     }

//     function getRandomCategory() public view returns (bytes32) {
//         return validCategories[bound(uint256(keccak256(abi.encode(block.timestamp))), 0, validCategories.length - 1)];
//     }

//     function getUsers() external view returns (address[] memory) {
//         return users;
//     }

//     function getListingCount() public view returns (uint256) {
//         uint256 count = 0;
//         uint256 totalTokens = getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (tokenIsListed[i]) count++;
//         }
//         return count;
//     }

//     function getAuctionCount() public view returns (uint256) {
//         uint256 count = 0;
//         uint256 totalTokens = getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (tokenIsListed[i] && tokenIsAuction[i]) count++;
//         }
//         return count;
//     }

//     // Handler Functions
//     function mint(address _to) public createUser(_to) {
//         address to = address(uint160(bound(uint256(uint160(_to)), 1, type(uint160).max)));

//         uint256 tokenId = createNFT(to);
//         tokenExists[tokenId] = true;
//         tokenOwner[tokenId] = to;
//     }

//     function listItem(address seller, uint256 tokenIdSeed, uint256 price, bool isAuction) public createUser(seller) {
//         if (!tokenExists[tokenIdSeed]) {
//             tokenIdSeed = createNFT(seller);
//         }

//         // Bound price to reasonable range
//         price = bound(price, MIN_PRICE, MAX_PRICE);

//         bytes32 category = getRandomCategory();

//         vm.startPrank(seller);
//         if (tokenOwner[tokenIdSeed] == seller && !tokenIsListed[tokenIdSeed]) {
//             nftCollection.approve(address(marketplace), tokenIdSeed);
//             marketplace.listItem(address(nftCollection), tokenIdSeed, price, isAuction, category);

//             tokenIsListed[tokenIdSeed] = true;
//             tokenPrice[tokenIdSeed] = price;
//             tokenIsAuction[tokenIdSeed] = isAuction;
//         }
//         vm.stopPrank();
//     }

//     function buyItem(address buyer, uint256 tokenIdSeed, uint256 paymentAmount) public createUser(buyer) {
//         if (!tokenIsListed[tokenIdSeed] || tokenIsAuction[tokenIdSeed]) return;

//         // Ensure payment meets or exceeds price
//         paymentAmount = bound(paymentAmount, tokenPrice[tokenIdSeed], tokenPrice[tokenIdSeed] * 2);

//         vm.deal(buyer, paymentAmount);
//         vm.prank(buyer);
//         marketplace.buyItem{value: paymentAmount}(address(nftCollection), tokenIdSeed);

//         tokenIsListed[tokenIdSeed] = false;
//         tokenOwner[tokenIdSeed] = buyer;
//     }

//     function placeBid(address bidder, uint256 tokenIdSeed, uint256 bidAmount) public createUser(bidder) {
//         if (!tokenIsListed[tokenIdSeed] || !tokenIsAuction[tokenIdSeed]) return;

//         // Ensure bid meets minimum requirements
//         uint256 minBid = tokenPrice[tokenIdSeed];
//         NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenIdSeed);
//         if (listing.highestBid > 0) {
//             minBid = listing.highestBid + 0.1 ether;
//         }

//         bidAmount = bound(bidAmount, minBid, minBid * 2);

//         vm.deal(bidder, bidAmount);
//         vm.prank(bidder);
//         marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenIdSeed);
//     }

//     function cancelListing(address seller, uint256 tokenIdSeed) public {
//         if (!tokenIsListed[tokenIdSeed] || tokenOwner[tokenIdSeed] != seller) return;

//         vm.prank(seller);
//         marketplace.cancelListing(address(nftCollection), tokenIdSeed);

//         tokenIsListed[tokenIdSeed] = false;
//     }

//     function withdrawEarnings(address seller) public createUser(seller) {
//         if (marketplace.getEarnings(seller) == 0) return;

//         vm.prank(seller);
//         marketplace.withdrawEarnings();

//         userEarnings[seller] = 0;
//     }

//     function updateListing(address seller, uint256 tokenIdSeed, uint256 newPrice) public {
//         if (!tokenIsListed[tokenIdSeed] || tokenOwner[tokenIdSeed] != seller || tokenIsAuction[tokenIdSeed]) return;

//         newPrice = bound(newPrice, MIN_PRICE, MAX_PRICE);

//         vm.prank(seller);
//         marketplace.updateListing(address(nftCollection), tokenIdSeed, newPrice);

//         tokenPrice[tokenIdSeed] = newPrice;
//     }

//     // Handler Functions for NFT Batch Operations
//     function batchMintAndList(
//         address seller,
//         uint256[] calldata tokenCount,
//         uint256[] calldata prices,
//         bool[] calldata isAuctions
//     ) public createUser(seller) {
//         // Bound the batch size to prevent excessive gas usage
//         uint256 batchSize = bound(tokenCount.length, 1, 5);

//         // Mint and list multiple NFTs
//         for (uint256 i = 0; i < batchSize; i++) {
//             uint256 tokenId = createNFT(seller);
//             uint256 price = bound(prices[i], MIN_PRICE, MAX_PRICE);

//             vm.startPrank(seller);
//             nftCollection.approve(address(marketplace), tokenId);
//             marketplace.listItem(address(nftCollection), tokenId, price, isAuctions[i], getRandomCategory());
//             vm.stopPrank();

//             tokenIsListed[tokenId] = true;
//             tokenPrice[tokenId] = price;
//             tokenIsAuction[tokenId] = isAuctions[i];
//         }
//     }

//     // Handler Functions for Auction Operations
//     function cancelBid(address bidder, uint256 tokenIdSeed) public {
//         if (!tokenIsListed[tokenIdSeed] || !tokenIsAuction[tokenIdSeed]) return;

//         NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenIdSeed);
//         if (listing.highestBidder != bidder) return;

//         vm.prank(bidder);
//         marketplace.cancelBid(address(nftCollection), tokenIdSeed);
//     }

//     function endAuction(uint256 tokenIdSeed) public {
//         if (!tokenIsListed[tokenIdSeed] || !tokenIsAuction[tokenIdSeed]) return;

//         NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenIdSeed);

//         // Move time past auction end
//         vm.warp(listing.auctionEndTime + 1);

//         marketplace.endAuction(address(nftCollection), tokenIdSeed);

//         // Update state
//         tokenIsListed[tokenIdSeed] = false;
//         if (listing.highestBidder != address(0)) {
//             tokenOwner[tokenIdSeed] = listing.highestBidder;
//         }
//     }

//     // Handler Functions for Token Operations
//     function transferNFT(address from, address to, uint256 tokenIdSeed) public createUser(from) createUser(to) {
//         if (!tokenExists[tokenIdSeed] || tokenIsListed[tokenIdSeed]) return;
//         if (tokenOwner[tokenIdSeed] != from) return;

//         vm.prank(from);
//         nftCollection.transferFrom(from, to, tokenIdSeed);

//         tokenOwner[tokenIdSeed] = to;
//     }

//     // Handler Functions for Price Manipulation
//     function updateListingWithRandomPrice(address seller, uint256 tokenIdSeed) public {
//         if (!tokenIsListed[tokenIdSeed] || tokenOwner[tokenIdSeed] != seller || tokenIsAuction[tokenIdSeed]) return;

//         uint256 newPrice = bound(uint256(keccak256(abi.encode(block.timestamp))), MIN_PRICE, MAX_PRICE);

//         vm.prank(seller);
//         marketplace.updateListing(address(nftCollection), tokenIdSeed, newPrice);

//         tokenPrice[tokenIdSeed] = newPrice;
//     }

//     // Handler Functions for Market Data
//     function checkListingsByCategory(bytes32 category) public view returns (uint256) {
//         (address[] memory sellers,,,) = marketplace.getListingsByCategory(category, 0, 100);

//         return sellers.length;
//     }

//     function checkActiveBids(uint256 tokenIdSeed) public view returns (uint256) {
//         if (!tokenIsListed[tokenIdSeed] || !tokenIsAuction[tokenIdSeed]) return 0;

//         NFTMarketplace.Bid[] memory bids = marketplace.getBidHistory(address(nftCollection), tokenIdSeed);
//         return bids.length;
//     }

//     // Handler Functions for User Activity
//     function checkUserActivity(address user) public view returns (uint256, uint256, uint256) {
//         (uint256 activeListings, uint256 activeBids, uint256 availableEarnings) = marketplace.getUserActivity(user);

//         return (activeListings, activeBids, availableEarnings);
//     }

//     // Handler Functions for Market Statistics
//     function getMarketStats() public view returns (uint256, uint256, uint256) {
//         (uint256 totalActiveListings, uint256 totalAuctions, uint256 totalCategories) =
//             marketplace.getMarketplaceStats();

//         return (totalActiveListings, totalAuctions, totalCategories);
//     }

//     // Handler Functions for Complex Scenarios
//     function listAndPlaceMultipleBids(address seller, address[] calldata bidders, uint256[] calldata bidAmounts)
//         public
//         createUser(seller)
//     {
//         // Create and list NFT for auction
//         uint256 tokenId = createNFT(seller);
//         uint256 startingPrice = MIN_PRICE;

//         vm.startPrank(seller);
//         nftCollection.approve(address(marketplace), tokenId);
//         marketplace.listItem(address(nftCollection), tokenId, startingPrice, true, getRandomCategory());
//         vm.stopPrank();

//         tokenIsListed[tokenId] = true;
//         tokenIsAuction[tokenId] = true;
//         tokenPrice[tokenId] = startingPrice;

//         // Place multiple bids
//         uint256 previousBid = startingPrice;
//         for (uint256 i = 0; i < bidders.length && i < 5; i++) {
//             address bidder = bidders[i];
//             if (!isUser[bidder]) continue;

//             uint256 bidAmount = bound(bidAmounts[i], previousBid + 0.1 ether, previousBid * 2);

//             vm.deal(bidder, bidAmount);
//             vm.prank(bidder);
//             marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);

//             previousBid = bidAmount;
//         }
//     }

//     // Handler Functions for Edge Cases
//     function relistCancelledItem(address seller, uint256 tokenIdSeed, uint256 newPrice) public {
//         if (!tokenExists[tokenIdSeed] || tokenIsListed[tokenIdSeed]) return;
//         if (tokenOwner[tokenIdSeed] != seller) return;

//         newPrice = bound(newPrice, MIN_PRICE, MAX_PRICE);

//         vm.startPrank(seller);
//         nftCollection.approve(address(marketplace), tokenIdSeed);
//         marketplace.listItem(address(nftCollection), tokenIdSeed, newPrice, false, getRandomCategory());
//         vm.stopPrank();

//         tokenIsListed[tokenIdSeed] = true;
//         tokenPrice[tokenIdSeed] = newPrice;
//         tokenIsAuction[tokenIdSeed] = false;
//     }

//     function buyAndResellItem(address initialBuyer, address finalBuyer, uint256 tokenIdSeed, uint256 resellPrice)
//         public
//         createUser(initialBuyer)
//         createUser(finalBuyer)
//     {
//         if (!tokenIsListed[tokenIdSeed] || tokenIsAuction[tokenIdSeed]) return;

//         // Initial purchase
//         uint256 initialPrice = tokenPrice[tokenIdSeed];
//         vm.deal(initialBuyer, initialPrice);
//         vm.prank(initialBuyer);
//         marketplace.buyItem{value: initialPrice}(address(nftCollection), tokenIdSeed);

//         tokenIsListed[tokenIdSeed] = false;
//         tokenOwner[tokenIdSeed] = initialBuyer;

//         // Resell
//         resellPrice = bound(resellPrice, MIN_PRICE, MAX_PRICE);

//         vm.startPrank(initialBuyer);
//         nftCollection.approve(address(marketplace), tokenIdSeed);
//         marketplace.listItem(address(nftCollection), tokenIdSeed, resellPrice, false, getRandomCategory());
//         vm.stopPrank();

//         tokenIsListed[tokenIdSeed] = true;
//         tokenPrice[tokenIdSeed] = resellPrice;
//     }
// }
