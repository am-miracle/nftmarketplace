// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
import {NFTCollection} from "../../src/NFTCollection.sol";
import {DeployNftMarketplace} from "../../script/DeployNFTMarketplace.s.sol";
import {DeployNftCollection} from "../../script/DeployNftCollection.s.sol";

contract NFTMarketplaceIntegrationTest is Test {
    NFTMarketplace marketplace;
    NFTCollection nftCollection;

    address public deployer;
    address public seller;
    address public buyer;
    address public bidder1;
    address public bidder2;

    uint256 public constant LISTING_PRICE = 1 ether;
    uint256 public constant STARTING_BALANCE = 10 ether;
    bytes32 public constant ART_CATEGORY = keccak256(abi.encodePacked("Art"));

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price,
        bool isAuction,
        bytes32 category,
        uint256 timestamp,
        string collectionName,
        address creator
    );

    function setUp() public {
        // Deploy contracts
        DeployNftMarketplace marketplaceDeployer = new DeployNftMarketplace();
        DeployNftCollection nftDeployer = new DeployNftCollection();

        (marketplace,) = marketplaceDeployer.run();
        (nftCollection,) = nftDeployer.run();

        // Setup accounts
        deployer = makeAddr("deployer");
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        bidder1 = makeAddr("bidder1");
        bidder2 = makeAddr("bidder2");

        // Fund accounts
        vm.deal(seller, STARTING_BALANCE);
        vm.deal(buyer, STARTING_BALANCE);
        vm.deal(bidder1, STARTING_BALANCE);
        vm.deal(bidder2, STARTING_BALANCE);
    }

    function test_CompleteDirectSaleFlow() public {
        // Initial state check
        assertEq(marketplace.getEarnings(seller), 0);

        // Mint NFT to seller
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(seller, "token1.json", 500); // 5% royalty

        // List NFT
        vm.startPrank(seller);
        nftCollection.approve(address(marketplace), tokenId);

        vm.expectEmit(true, true, true, true);
        emit ItemListed(
            seller,
            address(nftCollection),
            tokenId,
            LISTING_PRICE,
            false,
            ART_CATEGORY,
            block.timestamp,
            marketplace.getCollectionName(address(nftCollection)),
            marketplace.getCreator(address(nftCollection))
        );

        marketplace.listItem(address(nftCollection), tokenId, LISTING_PRICE, false, ART_CATEGORY);
        vm.stopPrank();

        // Verify listing
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, seller);
        assertEq(listing.price, LISTING_PRICE);
        assertFalse(listing.isAuction);

        // Record initial balances
        uint256 initialMarketplaceBalance = marketplace.owner().balance;

        // Get royalty info and record initial royalty reciever balance
        (address royaltyReceiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, LISTING_PRICE);
        uint256 initialRoyaltyReceiverBalance = royaltyReceiver.balance;

        // Buy NFT
        vm.prank(buyer);
        marketplace.buyItem{value: LISTING_PRICE}(address(nftCollection), tokenId);

        // Calculate fees and earnings
        uint256 remainingAfterRoyalty = LISTING_PRICE - royaltyAmount;
        uint256 marketplaceFee = (remainingAfterRoyalty * marketplace.getMarketplaceFee()) / 10000;
        uint256 sellerEarnings = remainingAfterRoyalty - marketplaceFee;

        // Verify final state
        assertEq(nftCollection.ownerOf(tokenId), buyer);
        assertEq(marketplace.getEarnings(seller), sellerEarnings);
        assertEq(marketplace.owner().balance, initialMarketplaceBalance + marketplaceFee);
        assertEq(royaltyReceiver.balance - initialRoyaltyReceiverBalance, royaltyAmount);

        uint256 balanceBeforeWithdraw = seller.balance;

        // Withdraw earnings
        vm.prank(seller);
        marketplace.withdrawEarnings();
        assertEq(seller.balance - balanceBeforeWithdraw, sellerEarnings, "Withdrawn amount does not match earnings");
        assertEq(marketplace.getEarnings(seller), 0);
    }

    function test_CompleteAuctionFlow() public {
        // Mint NFT
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(seller, "token1.json", 500);

        // List NFT as auction
        vm.startPrank(seller);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, LISTING_PRICE, true, ART_CATEGORY);
        vm.stopPrank();

        // store bid balance before bidders make a bid
        uint256 initialBidder2Balance = bidder2.balance;
        uint256 initialBidder1Balance = bidder1.balance;

        // Place bids
        uint256 bid1 = 1.5 ether;
        uint256 bid2 = 2 ether;

        vm.prank(bidder1);
        marketplace.placeBid{value: bid1}(address(nftCollection), tokenId);

        vm.prank(bidder2);
        marketplace.placeBid{value: bid2}(address(nftCollection), tokenId);

        // Store balances before auction end
        uint256 initialMarketplaceBalance = marketplace.owner().balance;

        (address royaltyReceiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, bid2);
        uint256 initialRoyaltyReceiver = royaltyReceiver.balance;

        // End auction
        vm.warp(block.timestamp + 7 days + 1);
        marketplace.endAuction(address(nftCollection), tokenId);

        // Calculate fees and earnings
        uint256 remainingAfterRoyalty = bid2 - royaltyAmount;
        uint256 marketplaceFee = (remainingAfterRoyalty * marketplace.getMarketplaceFee()) / 10000;
        uint256 sellerEarnings = remainingAfterRoyalty - marketplaceFee;

        // Verify final state
        assertEq(nftCollection.ownerOf(tokenId), bidder2);
        assertEq(marketplace.getEarnings(seller), sellerEarnings);
        assertEq(marketplace.owner().balance, initialMarketplaceBalance + marketplaceFee);
        assertEq(bidder1.balance, initialBidder1Balance); // First bidder refunded
        assertEq(bidder2.balance, initialBidder2Balance - bid2); // Winning bidder paid
        assertEq(royaltyReceiver.balance - initialRoyaltyReceiver, royaltyAmount);

        uint256 balanceBeforeWithdraw = seller.balance;

        // Withdraw earnings
        vm.prank(seller);
        marketplace.withdrawEarnings();
        assertEq(seller.balance - balanceBeforeWithdraw, sellerEarnings);
    }

    function test_ListUpdateBuyFlow() public {
        // Mint NFT
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(seller, "token1.json", 500);

        // List NFT
        vm.startPrank(seller);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, LISTING_PRICE, false, ART_CATEGORY);

        // Update price
        uint256 newPrice = 2 ether;
        marketplace.updateListing(address(nftCollection), tokenId, newPrice);
        vm.stopPrank();

        // Verify updated listing
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.price, newPrice);

        // Buy at new price
        vm.prank(buyer);
        marketplace.buyItem{value: newPrice}(address(nftCollection), tokenId);

        // Verify ownership
        assertEq(nftCollection.ownerOf(tokenId), buyer);
    }

    function test_AuctionBidCancelFlow() public {
        // Mint and list NFT
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(seller, "token1.json", 500);

        vm.startPrank(seller);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, LISTING_PRICE, true, ART_CATEGORY);
        vm.stopPrank();

        // Place bid
        uint256 bidAmount = 1.5 ether;
        uint256 initialBalance = bidder1.balance;

        vm.prank(bidder1);
        marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);

        // Cancel bid
        vm.prank(bidder1);
        marketplace.cancelBid(address(nftCollection), tokenId);

        // Verify refund and state
        assertEq(bidder1.balance, initialBalance);
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.highestBidder, address(0));
        assertEq(listing.highestBid, 0);
    }

    function test_MultiUserBiddingFlow() public {
        // Setup
        address[] memory bidders = new address[](3);
        uint256[] memory bids = new uint256[](3);

        bidders[0] = makeAddr("bidder1");
        bidders[1] = makeAddr("bidder2");
        bidders[2] = makeAddr("bidder3");

        bids[0] = 1.5 ether;
        bids[1] = 2.0 ether;
        bids[2] = 2.5 ether;

        for (uint256 i = 0; i < bidders.length; i++) {
            vm.deal(bidders[i], STARTING_BALANCE);
        }

        // Mint and list NFT
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(seller, "token1.json", 500);

        vm.startPrank(seller);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, LISTING_PRICE, true, ART_CATEGORY);
        vm.stopPrank();

        // Place bids
        for (uint256 i = 0; i < bidders.length; i++) {
            vm.prank(bidders[i]);
            marketplace.placeBid{value: bids[i]}(address(nftCollection), tokenId);

            // Verify bid state
            NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
            assertEq(listing.highestBidder, bidders[i]);
            assertEq(listing.highestBid, bids[i]);
        }

        // End auction
        vm.warp(block.timestamp + 7 days + 1);
        marketplace.endAuction(address(nftCollection), tokenId);

        // Verify final state
        assertEq(nftCollection.ownerOf(tokenId), bidders[2]); // Highest bidder wins
    }
}
