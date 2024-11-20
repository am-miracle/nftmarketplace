// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {DeployNftMarketplace} from "../../script/DeployNftMarketplace.s.sol";
import {DeployNftCollection} from "../../script/DeployNftCollection.s.sol";
import {NFTMarketplace} from "../../src/NFTMarketplace.sol";
import {NFTCollection} from "../../src/NFTCollection.sol";

contract NFTMarketplaceTest is Test {
    NFTMarketplace marketplace;
    NFTCollection nftCollection;
    HelperConfig helperConfig;

    address public SELLER = makeAddr("seller");
    address public BUYER = makeAddr("buyer");
    uint256 public constant STARTING_USER_BALANCE = 10 ether;

    // Categories
    bytes32 public constant ART_CATEGORY = keccak256(abi.encodePacked("Art"));
    bytes32 public constant COLLECTIBLES_CATEGORY = keccak256(abi.encodePacked("Collectibles"));

    // Events
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

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 timestamp);
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price,
        address seller,
        uint256 timestamp,
        uint256 royaltyAmount,
        address royaltyReceiver
    );
    event BidPlaced(
        address indexed bidder, address indexed nftAddress, uint256 indexed tokenId, uint256 amount, uint256 timestamp
    );
    event BidWithdrawn(
        address indexed bidder, address indexed nftAddress, uint256 indexed tokenId, uint256 amount, uint256 timestamp
    );
    event AuctionEnded(
        address indexed winner,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 amount,
        address seller,
        uint256 timestamp
    );

    modifier listItem() {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
        vm.stopPrank();
        _;
    }

    modifier createAuction() {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, true, ART_CATEGORY);
        vm.stopPrank();
        _;
    }

    function setUp() external {
        DeployNftMarketplace marketplaceDeployer = new DeployNftMarketplace();
        DeployNftCollection nftDeployer = new DeployNftCollection();

        // Deploy marketplace
        (marketplace, helperConfig) = marketplaceDeployer.run();

        // Deploy NFT collection
        (nftCollection,) = nftDeployer.run();

        // Fund accounts
        vm.deal(SELLER, STARTING_USER_BALANCE);
        vm.deal(BUYER, STARTING_USER_BALANCE);

        // Mint NFT to seller
        vm.startPrank(nftCollection.owner());
        nftCollection.mint(SELLER, "token1.json", 500); // 5% royalty
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_InitialState() public view {
        (, uint256 marketplaceFee,,,,,) = helperConfig.activeNetworkConfig();

        assertEq(marketplace.getMarketplaceFee(), marketplaceFee);

        // Verify initial categories
        bytes32[] memory categories = marketplace.getCategories();
        assertTrue(categories.length > 0);

        // Check if Art category exists
        bool hasArtCategory = false;
        for (uint256 i = 0; i < categories.length; i++) {
            if (categories[i] == ART_CATEGORY) {
                hasArtCategory = true;
                break;
            }
        }
        assertTrue(hasArtCategory);
    }

    /*//////////////////////////////////////////////////////////////
                        LISTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ListItem() public {
        uint256 tokenId = 0;
        uint256 listingPrice = 1 ether;

        vm.startPrank(SELLER);

        // Approve marketplace
        nftCollection.approve(address(marketplace), tokenId);

        // Test listing
        vm.expectEmit(true, true, true, true);
        emit ItemListed(
            SELLER,
            address(nftCollection),
            tokenId,
            listingPrice,
            false,
            ART_CATEGORY,
            block.timestamp,
            marketplace.getCollectionName(address(nftCollection)),
            marketplace.getCreator(address(nftCollection))
        );

        marketplace.listItem(address(nftCollection), tokenId, listingPrice, false, ART_CATEGORY);

        // Verify listing
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        address actualAddress = listing.seller;
        address expectedAddress = SELLER;
        assertEq(actualAddress, expectedAddress);

        assertEq(listing.price, listingPrice);
        assertEq(listing.isAuction, false);
        assertEq(listing.category, ART_CATEGORY);

        vm.stopPrank();
    }

    function testFail_ListItemPriceZero() public {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 0, false, ART_CATEGORY);
        vm.stopPrank();
    }

    function testFail_ListItemNotApproved() public {
        vm.prank(SELLER);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
    }

    function testFail_ListItemNotOwner() public {
        vm.startPrank(BUYER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
        vm.stopPrank();
    }

    function testFail_ListItemInvalidCategory() public {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, keccak256(abi.encodePacked("InvalidCategory")));
        vm.stopPrank();
    }

    function test_ListItemAsAuction() public {
        uint256 tokenId = 0;
        uint256 listingPrice = 1 ether;

        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), tokenId);

        marketplace.listItem(address(nftCollection), tokenId, listingPrice, true, ART_CATEGORY);

        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, SELLER);
        assertEq(listing.price, listingPrice);
        assertEq(listing.isAuction, true);
        assertTrue(listing.auctionEndTime > block.timestamp);

        vm.stopPrank();
    }

    function testFail_ListItemAlreadyListed() public {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);

        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
        marketplace.listItem(address(nftCollection), 0, 2 ether, false, ART_CATEGORY);

        vm.stopPrank();
    }

    function test_ListItemWithRoyalty() public {
        uint256 tokenId = 0;
        uint256 listingPrice = 1 ether;

        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, listingPrice, false, ART_CATEGORY);

        // Verify royalty info
        (address receiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, listingPrice);
        assertEq(receiver, SELLER);
        assertEq(royaltyAmount, (listingPrice * 500) / 10000); // 5% royalty

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        BUYING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BuyItemWithoutAuction() public listItem {
        uint256 tokenId = 0;
        uint256 price = 1 ether;

        // Calculate royalty
        (address royaltyReceiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, price);

        // Calculate marketplace fee from remaining amount after royalty
        uint256 remainingAmount = price - royaltyAmount;
        uint256 marketplaceFee = (remainingAmount * marketplace.getMarketplaceFee()) / 10000;

        // Expected seller earnings
        uint256 initialSellerEarnings = marketplace.getEarnings(SELLER);
        uint256 sellerEarnings = remainingAmount - marketplaceFee;

        vm.prank(BUYER);
        vm.expectEmit(true, true, true, true);
        emit ItemBought(
            BUYER, address(nftCollection), tokenId, price, SELLER, block.timestamp, royaltyAmount, royaltyReceiver
        );

        marketplace.buyItem{value: price}(address(nftCollection), tokenId);

        // Verify NFT ownership transferred
        assertEq(nftCollection.ownerOf(tokenId), BUYER);

        // Verify earnings updated correctly
        assertEq(marketplace.getEarnings(SELLER), initialSellerEarnings + sellerEarnings);

        // Verify listing was removed
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, address(0));
    }

    function test_RevertWhen_BuyingNotListedItem() public {
        uint256 tokenId = 0;
        uint256 price = 1 ether;

        // Mint NFT to seller but don't list it
        vm.prank(nftCollection.owner());
        nftCollection.mint(SELLER, "token1.json", 500);

        // Verify NFT is owned by seller and not listed
        assertEq(nftCollection.ownerOf(tokenId), SELLER);
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, address(0), "Item should not be listed");

        // Try to buy unlisted NFT
        vm.startPrank(BUYER);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__NotListed.selector);
        marketplace.buyItem{value: price}(address(nftCollection), tokenId);
        vm.stopPrank();

        // Verify state remains unchanged
        assertEq(nftCollection.ownerOf(tokenId), SELLER);
        assertEq(marketplace.getEarnings(SELLER), 0);
    }

    function testFail_BuyItemInsufficientPayment() public listItem {
        vm.prank(BUYER);
        marketplace.buyItem{value: 0.5 ether}(address(nftCollection), 0);
    }

    function test_RevertWhen_BuyingActiveAuction() public {
        // List item as auction
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, true, ART_CATEGORY);
        vm.stopPrank();

        // Try to buy auction item directly
        vm.startPrank(BUYER);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__AuctionAlreadyActive.selector);
        marketplace.buyItem{value: 1 ether}(address(nftCollection), 0);
        vm.stopPrank();
    }

    /**
     * @notice This function tests if the royalty calculations and payments are handled correctly when someone buys an NFT
     */
    function test_SellerEarningsAfterRoyaltiesAndFees() public listItem {
        uint256 tokenId = 0;
        uint256 price = 1 ether;

        // Get initial balances
        uint256 initialSellerEarnings = marketplace.getEarnings(SELLER);
        uint256 initialSellerBalance = SELLER.balance;
        uint256 initialMarketplaceBalance = marketplace.owner().balance;

        // Calculate expected splits
        (address royaltyReceiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, price);
        uint256 remainingAfterRoyalty = price - royaltyAmount;
        uint256 marketplaceFee = (remainingAfterRoyalty * marketplace.getMarketplaceFee()) / 10000;
        uint256 expectedSellerEarnings = remainingAfterRoyalty - marketplaceFee;

        // Execute purchase
        hoax(BUYER, price);
        marketplace.buyItem{value: price}(address(nftCollection), tokenId);

        // Verify NFT ownership changed
        assertEq(nftCollection.ownerOf(tokenId), BUYER, "NFT should transfer to buyer");

        // Verify earnings and balances
        assertEq(
            marketplace.getEarnings(SELLER),
            initialSellerEarnings + expectedSellerEarnings,
            "Seller earnings should be price minus royalty and marketplace fee"
        );
        assertEq(
            royaltyReceiver.balance,
            initialSellerBalance + royaltyAmount,
            "Royalty receiver should get their share immediately"
        );
        assertEq(
            marketplace.owner().balance,
            initialMarketplaceBalance + marketplaceFee,
            "Marketplace owner should get their fee immediately"
        );

        // Verify listing is removed
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, address(0), "Listing should be removed after successful purchase");
    }

    /*//////////////////////////////////////////////////////////////
                            AUCTION BIDDING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PlaceFirstBid() public createAuction {
        uint256 tokenId = 0;
        uint256 bidAmount = 1.5 ether;

        vm.startPrank(BUYER);
        vm.expectEmit(true, true, true, true);
        emit BidPlaced(BUYER, address(nftCollection), tokenId, bidAmount, block.timestamp);
        marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);
        vm.stopPrank();

        // Verify bid was recorded
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.highestBidder, BUYER);
        assertEq(listing.highestBid, bidAmount);
    }

    function test_PlaceHigherBid() public createAuction {
        uint256 tokenId = 0;
        address firstBidder = makeAddr("firstBidder");
        address secondBidder = makeAddr("secondBidder");
        uint256 firstBid = 1.5 ether;
        uint256 secondBid = 2 ether;

        // Place first bid
        hoax(firstBidder, firstBid);
        marketplace.placeBid{value: firstBid}(address(nftCollection), tokenId);

        // Store first bidder's balance before second bid
        uint256 firstBidderBalanceBefore = firstBidder.balance;

        // Place higher bid
        hoax(secondBidder, secondBid);
        vm.expectEmit(true, true, true, true);
        emit BidPlaced(secondBidder, address(nftCollection), tokenId, secondBid, block.timestamp);
        marketplace.placeBid{value: secondBid}(address(nftCollection), tokenId);

        // Verify new bid was recorded
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.highestBidder, secondBidder);
        assertEq(listing.highestBid, secondBid);

        // Verify previous bidder was refunded
        assertEq(firstBidder.balance, firstBidderBalanceBefore + firstBid);
    }

    function test_RevertWhen_BidOnNonAuction() public {
        // List item as direct sale
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
        vm.stopPrank();

        // Try to place bid
        hoax(BUYER, 1.5 ether);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__AuctionNotActive.selector);
        marketplace.placeBid{value: 1.5 ether}(address(nftCollection), 0);
    }

    function test_RevertWhen_AuctionEnded() public createAuction {
        uint256 tokenId = 0;
        uint256 bidAmount = 1.5 ether;

        // Move time past auction end
        vm.warp(block.timestamp + 7 days + 1);

        // Try to place bid
        hoax(BUYER, bidAmount);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__AuctionEnded.selector);
        marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);
    }

    function test_RevertWhen_BidBelowStartingPrice() public createAuction {
        uint256 tokenId = 0;
        uint256 startingPrice = 1 ether;
        uint256 lowBid = 0.5 ether; // Below starting price of 1 ether

        // Verify auction is set up correctly
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.price, startingPrice, "Starting price should be set correctly");
        assertTrue(listing.isAuction, "Should be an auction");

        vm.startPrank(BUYER);
        vm.expectRevert(
            abi.encodeWithSelector(NFTMarketplace.NFTMarketplace__BidBelowStartingPrice.selector, startingPrice)
        );
        marketplace.placeBid{value: lowBid}(address(nftCollection), tokenId);
        vm.stopPrank();
    }

    function test_RevertWhen_BidIncrementTooLow() public createAuction {
        uint256 tokenId = 0;
        uint256 startingPrice = 1 ether;
        uint256 firstBid = 1.5 ether;
        uint256 lowIncrement = 1.55 ether; // Only 0.05 ETH higher than first bid

        // Verify auction is set up correctly
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.price, startingPrice, "Starting price should be set correctly");
        assertTrue(listing.isAuction, "Should be an auction");

        hoax(makeAddr("firstBidder"), firstBid);
        marketplace.placeBid{value: firstBid}(address(nftCollection), tokenId);

        uint256 minBidRequired = firstBid + marketplace.getMinBidIncrement();

        hoax(makeAddr("secondBidder"), lowIncrement);
        vm.expectRevert(
            abi.encodeWithSelector(NFTMarketplace.NFTMarketplace__BidIncrementTooLow.selector, minBidRequired)
        );
        marketplace.placeBid{value: lowIncrement}(address(nftCollection), tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                            CANCEL BID TESTS
    //////////////////////////////////////////////////////////////*/
    function test_CancelBid() public createAuction {
        uint256 tokenId = 0;
        uint256 bidAmount = 2 ether;

        hoax(BUYER, bidAmount);
        marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);

        vm.prank(BUYER);
        vm.expectEmit(true, true, true, true);
        emit BidWithdrawn(BUYER, address(nftCollection), tokenId, bidAmount, block.timestamp);
        marketplace.cancelBid(address(nftCollection), tokenId);

        // Verify bid was cancelled
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.highestBidder, address(0));
        assertEq(listing.highestBid, 0);
    }

    function test_CancelBid_WithPreviousBids() public createAuction {
        uint256 tokenId = 0;

        // Setup bidders
        address firstBidder = makeAddr("firstBidder");
        address secondBidder = makeAddr("secondBidder");
        uint256 firstBid = 1.5 ether;
        uint256 secondBid = 2 ether;

        // Place first bid
        hoax(firstBidder, firstBid);
        marketplace.placeBid{value: firstBid}(address(nftCollection), tokenId);

        // Place second bid
        hoax(secondBidder, secondBid);
        marketplace.placeBid{value: secondBid}(address(nftCollection), tokenId);

        // Store state before cancellation
        uint256 initialSecondBidderBalance = secondBidder.balance;
        uint256 initialFirstBidderBalance = firstBidder.balance;

        // Cancel second bid
        vm.prank(secondBidder);
        marketplace.cancelBid(address(nftCollection), tokenId);

        // Verify auction reverted to first bid
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.highestBidder, firstBidder, "Should revert to first bidder");
        assertEq(listing.highestBid, firstBid, "Should revert to first bid amount");
        assertEq(secondBidder.balance, initialSecondBidderBalance + secondBid, "Second bidder should be refunded");
        assertEq(firstBidder.balance, initialFirstBidderBalance, "First bidder balance should not change");
    }

    function test_RevertWhen_CancelBidNotHighestBidder() public createAuction {
        uint256 tokenId = 0;
        address bidder = makeAddr("bidder");
        address notBidder = makeAddr("notBidder");

        hoax(bidder, 2 ether);
        marketplace.placeBid{value: 2 ether}(address(nftCollection), tokenId);

        // Try to cancel bid from non-bidder
        vm.prank(notBidder);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__NotHighestBidder.selector);
        marketplace.cancelBid(address(nftCollection), tokenId);
    }

    function test_RevertWhen_CancelBidAuctionEnded() public createAuction {
        uint256 tokenId = 0;
        uint256 bidAmount = 2 ether;

        hoax(BUYER, bidAmount);
        marketplace.placeBid{value: bidAmount}(address(nftCollection), tokenId);

        // Move time past auction end
        vm.warp(block.timestamp + 7 days + 1);

        // Try to cancel bid after auction ended
        vm.prank(BUYER);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__AuctionEnded.selector);
        marketplace.cancelBid(address(nftCollection), tokenId);
    }

    function test_RevertWhen_CancelBidNonAuction() public {
        uint256 tokenId = 0;

        // Setup direct sale listing
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), tokenId);
        marketplace.listItem(address(nftCollection), tokenId, 1 ether, false, ART_CATEGORY);
        vm.stopPrank();

        // Try to cancel non-existent bid
        vm.prank(BUYER);
        vm.expectRevert(NFTMarketplace.NFTMarketplace__AuctionNotActive.selector);
        marketplace.cancelBid(address(nftCollection), tokenId);
    }

    function test_CancelBidUpdatesHistory() public createAuction {
        uint256 tokenId = 0;

        // Place and cancel multiple bids
        address[] memory bidders = new address[](3);
        uint256[] memory bids = new uint256[](3);

        for (uint256 i = 0; i < 3; i++) {
            bidders[i] = makeAddr(string.concat("bidder", vm.toString(i)));
            bids[i] = (i + 2) * 1 ether;

            hoax(bidders[i], bids[i]);
            marketplace.placeBid{value: bids[i]}(address(nftCollection), tokenId);
        }

        // Cancel highest bid
        vm.prank(bidders[2]);
        marketplace.cancelBid(address(nftCollection), tokenId);

        // Get bid history
        NFTMarketplace.Bid[] memory bidHistory = marketplace.getBidHistory(address(nftCollection), tokenId);

        // Verify bid history
        assertTrue(bidHistory.length == 2, "Should have two bids in history");
        assertEq(bidHistory[0].bidder, bidders[0], "First bid should remain");
        assertEq(bidHistory[0].amount, bids[0], "First bid amount should remain");
        assertEq(bidHistory[1].bidder, bidders[1], "Second bid should remain");
        assertEq(bidHistory[1].amount, bids[1], "Second bid amount should remain");
    }

    /*//////////////////////////////////////////////////////////////
                           END AUCTION TESTS
    //////////////////////////////////////////////////////////////*/
    function test_EndAuction_WithWinner() public createAuction {
        uint256 tokenId = 0;
        uint256 winningBid = 2 ether;

        hoax(BUYER, winningBid);
        marketplace.placeBid{value: winningBid}(address(nftCollection), tokenId);

        // Move time past auction end
        vm.warp(block.timestamp + 7 days + 1);

        // Store initial balances
        uint256 initialMarketplaceOwnerBalance = marketplace.owner().balance;
        uint256 initialSellerEarnings = marketplace.getEarnings(SELLER);

        // Calculate expected splits
        (
            /**
             * address royaltyReceiver
             */
            ,
            uint256 royaltyAmount
        ) = nftCollection.royaltyInfo(tokenId, winningBid);
        uint256 remainingAfterRoyalty = winningBid - royaltyAmount;
        uint256 marketplaceFee = (remainingAfterRoyalty * marketplace.getMarketplaceFee()) / 10000;
        uint256 expectedSellerEarnings = remainingAfterRoyalty - marketplaceFee;

        // End auction
        vm.expectEmit(true, true, true, true);
        emit AuctionEnded(BUYER, address(nftCollection), tokenId, winningBid, SELLER, block.timestamp);
        marketplace.endAuction(address(nftCollection), tokenId);

        // Verify final state
        assertEq(nftCollection.ownerOf(tokenId), BUYER, "NFT should transfer to winner");
        assertEq(
            marketplace.getEarnings(SELLER),
            initialSellerEarnings + expectedSellerEarnings,
            "Seller earnings should be updated"
        );
        assertEq(
            marketplace.owner().balance,
            initialMarketplaceOwnerBalance + marketplaceFee,
            "Marketplace should receive fee"
        );

        // Verify auction listing is removed
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, address(0), "Listing should be removed");
    }
}
