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

    modifier listItem() {
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, false, ART_CATEGORY);
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

        uint256 initialSellerProceeds = marketplace.getProceeds(SELLER);
        // uint256 initialBuyerBalance = BUYER.balance;
        // uint256 initialSellerBalance = SELLER.balance;

        // Calculate expected royalty
        (address royaltyReceiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, price);

        // Calculate marketplace fee
        uint256 marketplaceFee = (price * marketplace.getMarketplaceFee()) / 10000;

        // Expected seller proceeds
        uint256 sellerProceeds = price - marketplaceFee - royaltyAmount;

        vm.prank(BUYER);
        vm.expectEmit(true, true, true, true);
        emit ItemBought(
            BUYER, address(nftCollection), tokenId, price, SELLER, block.timestamp, royaltyAmount, royaltyReceiver
        );

        marketplace.buyItem{value: price}(address(nftCollection), tokenId);

        // Verify NFT ownership transferred
        assertEq(nftCollection.ownerOf(tokenId), BUYER);

        // Verify proceeds updated correctly
        assertEq(marketplace.getProceeds(SELLER), initialSellerProceeds + sellerProceeds);

        // Verify listing was removed
        NFTMarketplace.Listing memory listing = marketplace.getListing(address(nftCollection), tokenId);
        assertEq(listing.seller, address(0));
    }

    function testFail_BuyItemNotListed() public {
        vm.prank(BUYER);
        marketplace.buyItem{value: 1 ether}(address(nftCollection), 0);
    }

    function testFail_BuyItemInsufficientPayment() public listItem {
        vm.prank(BUYER);
        marketplace.buyItem{value: 0.5 ether}(address(nftCollection), 0);
    }

    function testFail_BuyItemAuction() public {
        // List item as auction
        vm.startPrank(SELLER);
        nftCollection.approve(address(marketplace), 0);
        marketplace.listItem(address(nftCollection), 0, 1 ether, true, ART_CATEGORY);
        vm.stopPrank();

        // Try to buy auction item directly
        vm.prank(BUYER);
        marketplace.buyItem{value: 1 ether}(address(nftCollection), 0);
    }

    function test_BuyMultipleItems() public {
        vm.startPrank(nftCollection.owner());
        // Mint multiple NFTs to seller
        uint256[] memory tokenIds = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            tokenIds[i] = nftCollection.mint(
                SELLER,
                string.concat("token", vm.toString(i + 1), ".json"),
                500 // 5% royalty
            );
        }
        vm.stopPrank();

        // List all NFTs
        vm.startPrank(SELLER);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftCollection.approve(address(marketplace), tokenIds[i]);
            marketplace.listItem(address(nftCollection), tokenIds[i], 1 ether, false, ART_CATEGORY);
        }
        vm.stopPrank();

        // Buy all NFTs
        vm.startPrank(BUYER);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            marketplace.buyItem{value: 1 ether}(address(nftCollection), tokenIds[i]);
            assertEq(nftCollection.ownerOf(tokenIds[i]), BUYER);
        }
        vm.stopPrank();
    }

    function test_BuyItemWithRoyalties() public listItem {
        uint256 tokenId = 0;
        uint256 price = 1 ether;
        // uint256 initialRoyaltyReceiverBalance = SELLER.balance;

        ( /* address royaltyReceiver */ , uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, price);

        vm.prank(BUYER);
        marketplace.buyItem{value: price}(address(nftCollection), tokenId);

        // Calculate expected proceeds after royalties and marketplace fee
        uint256 marketplaceFee = (price * marketplace.getMarketplaceFee()) / 10000;
        uint256 expectedProceeds = price - marketplaceFee - royaltyAmount;

        // Verify royalty receiver got paid
        assertEq(marketplace.getProceeds(SELLER), expectedProceeds);
    }
}
