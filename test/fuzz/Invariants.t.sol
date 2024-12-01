// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import {Test, console} from "forge-std/Test.sol";
// import {StdInvariant} from "forge-std/StdInvariant.sol";
// import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
// import {NFTCollection} from "../../src/NFTCollection.sol";
// import {Handler} from "./Handler.t.sol";
// import {DeployNftMarketplace} from "../../script/DeployNFTMarketplace.s.sol";
// import {DeployNftCollection} from "../../script/DeployNftCollection.s.sol";

// contract InvariantsTest is StdInvariant, Test {
//     NFTMarketplace marketplace;
//     NFTCollection nftCollection;
//     Handler handler;

//     function setUp() external {
//         // Deploy contracts
//         DeployNftMarketplace marketplaceDeployer = new DeployNftMarketplace();
//         DeployNftCollection nftDeployer = new DeployNftCollection();

//         (marketplace,) = marketplaceDeployer.run();
//         (nftCollection,) = nftDeployer.run();

//         // Setup handler
//         handler = new Handler(marketplace, nftCollection);
//         targetContract(address(handler));
//     }

//     // Ownership Invariants
//     function invariant_NFTOwnership() public view {
//         // Every NFT must have a valid owner
//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenExists(i)) {
//                 address owner = nftCollection.ownerOf(i);
//                 assertTrue(owner != address(0), "NFT must have valid owner");
//                 assertEq(owner, handler.tokenOwner(i), "Handler owner tracking must match NFT contract");
//             }
//         }
//     }

//     function invariant_ListingOwnership() public view {
//         // Listed NFTs must be owned by their sellers
//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenIsListed(i)) {
//                 NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), i);
//                 assertEq(nftCollection.ownerOf(i), listing.seller, "Listed NFT must be owned by seller");
//             }
//         }
//     }

//     // Marketplace State Invariants
//     function invariant_ValidListingPrice() public view {
//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenIsListed(i)) {
//                 NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), i);
//                 assertTrue(listing.price > 0, "Listed price must be greater than 0");
//                 assertEq(listing.price, handler.tokenPrice(i), "Handler price tracking must match listing");
//             }
//         }
//     }

//     function invariant_NoUnlistedTokensInMarket() public view {
//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (!handler.tokenIsListed(i)) {
//                 NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), i);
//                 assertEq(listing.seller, address(0), "Unlisted token must have no listing");
//             }
//         }
//     }

//     // Auction Invariants
//     function invariant_ValidAuctionState() public view {
//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenIsListed(i) && handler.tokenIsAuction(i)) {
//                 NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), i);
//                 assertTrue(listing.isAuction, "Token marked as auction must be auction");
//                 assertTrue(listing.auctionEndTime > listing.highestBid, "Auction end time must be valid");
//                 if (listing.highestBid > 0) {
//                     assertTrue(listing.highestBidder != address(0), "Bids must have valid bidder");
//                 }
//             }
//         }
//     }

//     // Financial Invariants
//     function invariant_ValidEarnings() public view {
//         // Check each user's earnings
//         for (uint256 i = 0; i < handler.getUsers().length; i++) {
//             address user = handler.getUsers()[i];
//             uint256 earnings = marketplace.getEarnings(user);
//             assertEq(earnings, handler.userEarnings(user), "Handler earnings tracking must match marketplace");
//             assertTrue(earnings <= address(marketplace).balance, "Earnings cannot exceed contract balance");
//         }
//     }

//     function invariant_MarketplaceBalance() public view {
//         uint256 totalEarnings = 0;
//         for (uint256 i = 0; i < handler.getUsers().length; i++) {
//             address user = handler.getUsers()[i];
//             totalEarnings += marketplace.getEarnings(user);
//         }
//         assertLe(totalEarnings, address(marketplace).balance, "Total earnings must not exceed balance");
//     }

//     // Category Invariants
//     function invariant_ValidCategories() public view {
//         bytes32[] memory categories = marketplace.getCategories();
//         assertTrue(categories.length > 0, "Must have valid categories");

//         uint256 totalTokens = handler.getTokenCount();
//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenIsListed(i)) {
//                 NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), i);
//                 bool validCategory = false;
//                 for (uint256 j = 0; j < categories.length; j++) {
//                     if (listing.category == categories[j]) {
//                         validCategory = true;
//                         break;
//                     }
//                 }
//                 assertTrue(validCategory, "Listed items must have valid category");
//             }
//         }
//     }

//     // State Consistency Invariants
//     function invariant_StateConsistency() public view {
//         uint256 listingCount = handler.getListingCount();
//         uint256 auctionCount = handler.getAuctionCount();

//         (uint256 totalListings, uint256 totalAuctions,) = marketplace.getMarketplaceStats();
//         assertEq(listingCount, totalListings, "Listing count must match");
//         assertEq(auctionCount, totalAuctions, "Auction count must match");
//     }

//     // Mathematic Invariants
//     function invariant_MarketplaceMath() public view {
//         uint256 totalTokens = handler.getTokenCount();
//         uint256 listingCount = 0;
//         uint256 auctionCount = 0;

//         for (uint256 i = 0; i < totalTokens; i++) {
//             if (handler.tokenIsListed(i)) {
//                 listingCount++;
//                 if (handler.tokenIsAuction(i)) {
//                     auctionCount++;
//                 }
//             }
//         }

//         assertTrue(auctionCount <= listingCount, "Auction count cannot exceed listing count");
//         assertTrue(listingCount <= totalTokens, "Listing count cannot exceed token count");
//     }

//     // System State Invariants
//     function invariant_CallSummary() public view {
//         console.log("Total NFTs minted:", handler.getTokenCount());
//         console.log("Total listings:", handler.getListingCount());
//         console.log("Total auctions:", handler.getAuctionCount());
//         console.log("Total users:", handler.getUsers().length);
//     }
// }
