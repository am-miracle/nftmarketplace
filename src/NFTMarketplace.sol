// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/**
 * @title NFTMarketplace
 * @dev A marketplace for NFTs with support for direct listings and auctions
 */
contract NFTMarketplace is ReentrancyGuard, Pausable, Ownable {
    // Custom errors
    error NFTMarketplace__PriceMustBeAboveZero();
    error NFTMarketplace__NotApprovedForMarketplace();
    error NFTMarketplace__AlreadyListed();
    error NFTMarketplace__NotListed();
    error NFTMarketplace__NotOwner();
    error NFTMarketplace__PriceNotMet();
    error NFTMarketplace__NoProceeds();
    error NFTMarketplace__TransferFailed();
    error NFTMarketplace__AuctionNotActive();
    error NFTMarketplace__AuctionEnded();
    error NFTMarketplace__BidTooLow();
    error NFTMarketplace__AuctionStillActive();
    error NFTMarketplace__NotHighestBidder();
    error NFTMarketplace__InvalidCategory();
    error NFTMarketplace__CategoryExists();
    error NFTMarketplace__CollectionNotVerified();

    // Type declarations
    using Address for address payable;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct Listing {
        address seller;
        address highestBidder;
        bool isAuction;
        uint256 price;
        uint256 auctionEndTime;
        uint256 highestBid;
        bytes32 category;
    }

    struct Collection {
        string name;
        string description;
        address creator;
        bool isVerified;
        uint256 floorPrice;
        uint256 totalVolume;
        uint256 totalSales;
    }

    struct Creator {
        address creatorAddress;
        bool isVerified;
        uint256 totalSales;
        uint256 totalVolume;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    struct ListingKey {
        address nftAddress;
        uint256 tokenId;
    }

    struct TopCreatorAndCollectionData {
        address creatorAndCollection;
        uint256 volume;
    }

    // State variables
    uint256 private constant AUCTION_DURATION = 7 days;
    uint256 private constant MIN_BID_INCREMENT = 0.1 ether;
    uint256 private immutable i_marketplaceFee; // in basis points (e.g., 250 = 2.5%)

    // Mappings
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;
    mapping(address => mapping(uint256 => Bid[])) private s_bids;
    mapping(address => Collection) private s_collections;
    mapping(address => Creator) private s_creators;
    mapping(bytes32 => uint256) private s_categoryStats;
    mapping(address => uint256) private s_collectionStats;
    mapping(bytes32 => ListingKey[]) private s_categoryListings;

    EnumerableSet.AddressSet private s_verifiedCollections;
    EnumerableSet.AddressSet private s_verifiedCreators;
    EnumerableSet.Bytes32Set private s_categories;

    // Events
    event ItemListed(
        address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price, bool isAuction
    );
    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);
    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    event BidPlaced(address indexed bidder, address indexed nftAddress, uint256 indexed tokenId, uint256 amount);
    event BidWithdrawn(address indexed bidder, address indexed nftAddress, uint256 indexed tokenId, uint256 amount);
    event AuctionEnded(address indexed winner, address indexed nftAddress, uint256 indexed tokenId, uint256 amount);
    event ProceedsWithdrawn(address indexed seller, uint256 amount);
    event CategoryAdded(bytes32 indexed category, string name);
    event CollectionVerified(address indexed collection);
    event CreatorVerified(address indexed creator);
    event CreatorUpdated(address indexed creator, uint256 totalSales, uint256 totalVolume);
    event CollectionUpdated(address indexed collection, uint256 floorPrice, uint256 totalVolume, uint256 totalSales);

    constructor(uint256 marketplaceFee) Ownable(msg.sender) {
        i_marketplaceFee = marketplaceFee;
    }

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice List an NFT in the marketplace
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param price Price in ETH
     * @param isAuction Whether this is an auction listing
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price, bool isAuction, bytes32 category)
        external
        nonReentrant
        whenNotPaused
    {
        if (price <= 0) revert NFTMarketplace__PriceMustBeAboveZero();
        if (!s_categories.contains(category)) revert NFTMarketplace__InvalidCategory();

        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NFTMarketplace__NotApprovedForMarketplace();
        }
        if (s_listings[nftAddress][tokenId].seller != address(0)) {
            revert NFTMarketplace__AlreadyListed();
        }
        if (nft.ownerOf(tokenId) != msg.sender) revert NFTMarketplace__NotOwner();

        // Initialize collection if first time listing
        _initializeCollection(nftAddress, price);

        // Update collection floor price
        Collection memory collection = s_collections[nftAddress];
        if (price < collection.floorPrice) {
            collection.floorPrice = price;
        }

        s_categoryStats[category]++;
        s_collectionStats[nftAddress]++;

        s_listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isAuction: isAuction,
            auctionEndTime: isAuction ? block.timestamp + AUCTION_DURATION : 0,
            highestBidder: address(0),
            highestBid: 0,
            category: category
        });

        emit ItemListed(msg.sender, nftAddress, tokenId, price, isAuction);
    }

    /**
     * @notice Cancel a listing
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.seller != msg.sender) revert NFTMarketplace__NotOwner();
        if (listing.isAuction && listing.highestBid > 0) {
            revert NFTMarketplace__AuctionStillActive();
        }
        delete s_listings[nftAddress][tokenId];
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /**
     * @notice Buy a listed NFT
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.seller == address(0)) revert NFTMarketplace__NotListed();
        if (listing.isAuction) revert NFTMarketplace__AuctionNotActive();
        if (msg.value < listing.price) revert NFTMarketplace__PriceNotMet();

        // // Handle royalties
        // uint256 finalPrice = msg.value;
        // (address royaltyReceiver, uint256 royaltyAmount) = IERC2981(nftAddress).royaltyInfo(tokenId, finalPrice);
        // if (royaltyAmount > 0) {
        //     payable(royaltyReceiver).sendValue(royaltyAmount);
        //     finalPrice -= royaltyAmount;
        // }

        // // Calculate and transfer marketplace fee
        // uint256 marketplaceFee = (finalPrice * i_marketplaceFee) / 10000;
        // payable(owner()).sendValue(marketplaceFee);

        // // Transfer remaining amount to seller
        // uint256 sellerProceeds = finalPrice - marketplaceFee;
        // s_proceeds[listing.seller] += sellerProceeds;
        _processPaymentAndCalculateProceeds(nftAddress, tokenId, msg.value, listing.seller);

        delete s_listings[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, msg.value);
    }

    /**
     * @notice Place a bid on an auction
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function placeBid(address nftAddress, uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (!listing.isAuction) revert NFTMarketplace__AuctionNotActive();
        if (block.timestamp > listing.auctionEndTime) revert NFTMarketplace__AuctionEnded();
        if (msg.value <= listing.highestBid + MIN_BID_INCREMENT) {
            revert NFTMarketplace__BidTooLow();
        }

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).sendValue(listing.highestBid);
        }

        // Update listing with new highest bid
        s_listings[nftAddress][tokenId].highestBidder = msg.sender;
        s_listings[nftAddress][tokenId].highestBid = msg.value;

        // Record bid history
        s_bids[nftAddress][tokenId].push(Bid({bidder: msg.sender, amount: msg.value, timestamp: block.timestamp}));

        emit BidPlaced(msg.sender, nftAddress, tokenId, msg.value);
    }

    /**
     * @notice Cancel a bid on an auction
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function cancelBid(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (!listing.isAuction) revert NFTMarketplace__AuctionNotActive();
        if (listing.highestBidder != msg.sender) revert NFTMarketplace__NotHighestBidder();
        if (block.timestamp >= listing.auctionEndTime) revert NFTMarketplace__AuctionEnded();

        uint256 bidAmount = listing.highestBid;

        // Find the previous highest bid
        Bid[] storage bids = s_bids[nftAddress][tokenId];
        uint256 previousHighestBid = 0;
        address previousHighestBidder = address(0);

        // Start from the second-to-last bid (if it exists)
        if (bids.length > 1) {
            for (uint256 i = bids.length - 2; i >= 0; i--) {
                if (bids[i].bidder != msg.sender) {
                    previousHighestBid = bids[i].amount;
                    previousHighestBidder = bids[i].bidder;
                    break;
                }
                if (i == 0) break;
            }
        }

        // Update the listing with the previous highest bid
        s_listings[nftAddress][tokenId].highestBidder = previousHighestBidder;
        s_listings[nftAddress][tokenId].highestBid = previousHighestBid;

        // Remove the cancelled bid from history
        if (bids.length > 0) {
            bids.pop();
        }

        // Refund the cancelled bid
        payable(msg.sender).sendValue(bidAmount);

        emit BidWithdrawn(msg.sender, nftAddress, tokenId, bidAmount);
    }

    /**
     * @notice End an auction and transfer NFT to highest bidder
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function endAuction(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (!listing.isAuction) revert NFTMarketplace__AuctionNotActive();
        if (block.timestamp <= listing.auctionEndTime) revert NFTMarketplace__AuctionStillActive();

        if (listing.highestBidder != address(0)) {
            // Handle royalties
            _processPaymentAndCalculateProceeds(nftAddress, tokenId, listing.highestBid, listing.seller);

            // Transfer NFT to winner
            IERC721(nftAddress).safeTransferFrom(listing.seller, listing.highestBidder, tokenId);
            emit AuctionEnded(listing.highestBidder, nftAddress, tokenId, listing.highestBid);
        }

        delete s_listings[nftAddress][tokenId];
    }

    /**
     * @notice Withdraw proceeds from sales
     */
    function withdrawProceeds() external nonReentrant {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) revert NFTMarketplace__NoProceeds();
        s_proceeds[msg.sender] = 0;
        payable(msg.sender).sendValue(proceeds);
        emit ProceedsWithdrawn(msg.sender, proceeds);
    }

    /**
     * @notice Update price of a listing
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param newPrice New price in ETH
     */
    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external nonReentrant {
        if (newPrice <= 0) revert NFTMarketplace__PriceMustBeAboveZero();
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.seller != msg.sender) revert NFTMarketplace__NotOwner();
        if (listing.isAuction) revert NFTMarketplace__AuctionNotActive();

        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice, false);
    }

    /**
     * @notice Register and verify a collection
     */
    function registerCollection(address collection, string calldata name, string calldata description, address creator)
        external
        onlyOwner
    {
        s_collections[collection] = Collection({
            name: name,
            description: description,
            isVerified: true,
            floorPrice: 0,
            totalVolume: 0,
            totalSales: 0,
            creator: creator
        });

        // Initialize or update creator data
        Creator memory creatorData = s_creators[creator];
        if (creatorData.creatorAddress == address(0)) {
            creatorData.creatorAddress = creator;
        }

        s_verifiedCollections.add(collection);
        emit CollectionVerified(collection);
    }

    /**
     * @notice Add a new category
     */
    function addCategory(bytes32 category, string calldata name) external onlyOwner {
        if (s_categories.contains(category)) revert NFTMarketplace__CategoryExists();
        s_categories.add(category);
        emit CategoryAdded(category, name);
    }

    /**
     * @notice Verify a creator
     */
    function verifyCreator(address creator) external onlyOwner {
        s_creators[creator].isVerified = true;
        s_verifiedCreators.add(creator);
        emit CreatorVerified(creator);
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev Handles royalty calculations and payments
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param amount Total amount to calculate royalties from
     * @return remainingAmount Amount after royalty deduction
     */
    function _handleRoyalties(address nftAddress, uint256 tokenId, uint256 amount) internal returns (uint256) {
        (address royaltyReceiver, uint256 royaltyAmount) = IERC2981(nftAddress).royaltyInfo(tokenId, amount);
        if (royaltyAmount > 0) {
            payable(royaltyReceiver).sendValue(royaltyAmount);
            return amount - royaltyAmount;
        }
        return amount;
    }

    /**
     * @dev Calculates and transfers marketplace fee
     * @param amount Amount to calculate fee from
     * @return remainingAmount Amount after fee deduction
     */
    function _handleMarketplaceFee(uint256 amount) internal returns (uint256) {
        uint256 marketplaceFee = (amount * i_marketplaceFee) / 10000;
        payable(owner()).sendValue(marketplaceFee);
        return amount - marketplaceFee;
    }

    /**
     * @dev Updates seller proceeds in storage
     * @param seller Address of the seller
     * @param amount Amount to add to seller's proceeds
     */
    function _updateSellerProceeds(address seller, uint256 amount) internal {
        s_proceeds[seller] += amount;
    }

    /**
     * @dev Processes payment and calculates seller proceeds after royalties and fees
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param paymentAmount Total payment amount
     * @param seller Address of the seller
     * @return sellerProceeds Amount to be transferred to the seller
     */
    function _processPaymentAndCalculateProceeds(
        address nftAddress,
        uint256 tokenId,
        uint256 paymentAmount,
        address seller
    ) internal returns (uint256) {
        // Handle royalties
        uint256 remainingAfterRoyalties = _handleRoyalties(nftAddress, tokenId, paymentAmount);

        // Handle marketplace fee
        uint256 remainingAfterFees = _handleMarketplaceFee(remainingAfterRoyalties);

        // Update Collections Stats
        Collection memory collection = s_collections[nftAddress];
        collection.totalSales++;
        collection.totalVolume += paymentAmount;

        // Update Creator stats
        address creator = IERC721(nftAddress).ownerOf(0);
        Creator memory creatorData = s_creators[creator];
        creatorData.totalSales++;
        creatorData.totalVolume += paymentAmount;

        // Update category stats
        bytes32 category = s_listings[nftAddress][tokenId].category;
        s_categoryStats[category]--;
        s_collectionStats[nftAddress]--;

        // Update seller proceeds
        _updateSellerProceeds(seller, remainingAfterFees);

        emit CreatorUpdated(creator, creatorData.totalSales, creatorData.totalVolume);
        emit CollectionUpdated(nftAddress, collection.floorPrice, collection.totalVolume, collection.totalSales);

        return remainingAfterFees;
    }

    function _initializeCollection(address collection, uint256 price) internal {
        Collection storage collectionData = s_collections[collection];
        if (collectionData.floorPrice == 0) {
            collectionData.floorPrice = price;
            try IERC721Metadata(collection).name() returns (string memory name) {
                collectionData.name = name;
            } catch {
                collectionData.name = "";
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                           PRIVATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function buildMaxHeap(TopCreatorAndCollectionData[] memory heap, uint256 size) private pure {
        unchecked {
            for (uint256 i = size / 2; i > 0; --i) {
                heapify(heap, i, size);
            }
        }
    }

    function heapify(TopCreatorAndCollectionData[] memory heap, uint256 i, uint256 size) private pure {
        uint256 largest = i;
        uint256 left = i * 2;
        uint256 right = i * 2 + 1;

        unchecked {
            if (left <= size && heap[left - 1].volume > heap[largest - 1].volume) {
                largest = left;
            }
            if (right <= size && heap[right - 1].volume > heap[largest - 1].volume) {
                largest = right;
            }
            if (largest != i) {
                (heap[i - 1], heap[largest - 1]) = (heap[largest - 1], heap[i - 1]);
                heapify(heap, largest, size);
            }
        }
    }

    function extractMax(TopCreatorAndCollectionData[] memory heap, uint256 size)
        private
        pure
        returns (TopCreatorAndCollectionData memory max)
    {
        max = heap[0];
        heap[0] = heap[size - 1];
        heapify(heap, 1, size - 1);
        return max;
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }

    function getBidHistory(address nftAddress, uint256 tokenId) external view returns (Bid[] memory) {
        return s_bids[nftAddress][tokenId];
    }

    /**
     * @notice Get trending collections sorted by volume
     */
    function getTrendingCollections(uint256 limit)
        external
        view
        returns (address[] memory collections, Collection[] memory collectionData)
    {
        uint256 totalCollections = s_verifiedCollections.length();
        limit = limit > totalCollections ? totalCollections : limit;

        // Initialize return arrays
        collections = new address[](limit);
        collectionData = new Collection[](limit);

        // Use a heap data structure to efficiently find the top collections
        TopCreatorAndCollectionData[] memory topCollections = new TopCreatorAndCollectionData[](totalCollections);

        unchecked {
            // Populate the heap with all collections and their volumes
            for (uint256 i; i < totalCollections; i++) {
                address collection = s_verifiedCollections.at(i);
                topCollections[i] = TopCreatorAndCollectionData(collection, s_collections[collection].totalVolume);
            }

            // Build the max heap
            buildMaxHeap(topCollections, totalCollections);

            // Extract the top `limit` collections from the heap
            for (uint256 i; i < limit; i++) {
                TopCreatorAndCollectionData memory top = extractMax(topCollections, totalCollections - i);
                collections[i] = top.creatorAndCollection;
                collectionData[i] = s_collections[top.creatorAndCollection];
            }
        }

        return (collections, collectionData);
    }

    /**
     * @notice Get top creators by volume
     */
    function getTopCreators(uint256 limit)
        external
        view
        returns (address[] memory creators, Creator[] memory creatorData)
    {
        uint256 totalCreators = s_verifiedCreators.length();
        limit = limit > totalCreators ? totalCreators : limit;

        // Initialize return arrays
        creators = new address[](limit);
        creatorData = new Creator[](limit);

        // Use a heap data structure to efficiently find the top creators
        TopCreatorAndCollectionData[] memory topCreators = new TopCreatorAndCollectionData[](totalCreators);

        unchecked {
            // Populate the heap with all creators and their volumes
            for (uint256 i; i < totalCreators; i++) {
                address creator = s_verifiedCreators.at(i);
                topCreators[i] = TopCreatorAndCollectionData(creator, s_creators[creator].totalVolume);
            }

            // Build the max heap
            buildMaxHeap(topCreators, totalCreators);

            // Extract the top `limit` creators from the heap
            for (uint256 i; i < limit; i++) {
                TopCreatorAndCollectionData memory top = extractMax(topCreators, totalCreators - i);
                creators[i] = top.creatorAndCollection;
                creatorData[i] = s_creators[top.creatorAndCollection];
            }
        }

        return (creators, creatorData);
    }

    /**
     * @notice Get listings by category
     */
    function getListingsByCategory(bytes32 category, uint256 offset, uint256 limit)
        external
        view
        returns (
            address[] memory sellers,
            uint256[] memory prices,
            address[] memory nftAddresses,
            uint256[] memory tokenIds,
            uint256 total
        )
    {
        total = s_categoryStats[category];

        if (offset >= total || limit == 0) {
            return (new address[](0), new uint256[](0), new address[](0), new uint256[](0), total);
        }

        uint256 length;
        unchecked {
            uint256 remaining = total - offset;
            length = remaining < limit ? remaining : limit;
        }

        sellers = new address[](length);
        prices = new uint256[](length);
        nftAddresses = new address[](length);
        tokenIds = new uint256[](length);

        unchecked {
            for (uint256 i; i < length; ++i) {
                ListingKey memory key = s_categoryListings[category][offset + i];
                Listing storage listing = s_listings[key.nftAddress][key.tokenId];

                sellers[i] = listing.seller;
                prices[i] = listing.price;
                nftAddresses[i] = key.nftAddress;
                tokenIds[i] = key.tokenId;
            }
        }
    }

    /**
     * @notice Get all categories
     */
    function getCategories() external view returns (bytes32[] memory categories) {
        uint256 length = s_categories.length();
        categories = new bytes32[](length);
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                categories[i] = s_categories.at(i);
            }
        }
        return categories;
    }

    function getCollection(address collection) external view returns (Collection memory) {
        return s_collections[collection];
    }

    function getCreator(address creator) external view returns (Creator memory) {
        return s_creators[creator];
    }

    function getCategoryStats(bytes32 category) external view returns (uint256) {
        return s_categoryStats[category];
    }

    function getCollectionStats(address collection) external view returns (uint256) {
        return s_collectionStats[collection];
    }
}
