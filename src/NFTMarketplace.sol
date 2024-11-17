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
    error NFTMarketplace__NoEarnings();
    error NFTMarketplace__TransferFailed();
    error NFTMarketplace__AuctionNotActive();
    error NFTMarketplace__AuctionAlreadyActive();
    error NFTMarketplace__AuctionEnded();
    error NFTMarketplace__BidBelowStartingPrice(uint256 startingPrice);
    error NFTMarketplace__BidIncrementTooLow(uint256 minBidRequired);
    error NFTMarketplace__AuctionStillActive();
    error NFTMarketplace__NotHighestBidder();
    error NFTMarketplace__InvalidCategory();

    // Type declarations
    using Address for address payable;
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

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    struct ActiveListing {
        address nftAddress;
        uint256 tokenId;
        bytes32 category;
    }

    // State variables
    uint256 private constant AUCTION_DURATION = 7 days;
    uint256 private constant MIN_BID_INCREMENT = 0.1 ether;
    uint256 private immutable i_marketplaceFee; // in basis points (e.g., 250 = 2.5%)

    // Mappings
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_earnings;
    mapping(address => mapping(uint256 => Bid[])) private s_bids;
    mapping(bytes32 => ActiveListing[]) private s_categoryListings;

    EnumerableSet.Bytes32Set private s_categories;

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

    event EarningsWithdrawn(address indexed seller, uint256 amount, uint256 timestamp);

    event CategoryAdded(bytes32 indexed category, string name, uint256 timestamp);

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
        string memory collectionName = _getCollectionName(nftAddress);
        address creator = _getCreator(nftAddress);

        s_listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isAuction: isAuction,
            auctionEndTime: isAuction ? block.timestamp + AUCTION_DURATION : 0,
            highestBidder: address(0),
            highestBid: 0,
            category: category
        });

        s_categoryListings[category].push(ActiveListing({nftAddress: nftAddress, tokenId: tokenId, category: category}));

        emit ItemListed(
            msg.sender, nftAddress, tokenId, price, isAuction, category, block.timestamp, collectionName, creator
        );
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
        emit ItemCanceled(msg.sender, nftAddress, tokenId, block.timestamp);
    }

    /**
     * @notice Buy a listed NFT
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function buyItem(address nftAddress, uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.seller == address(0)) revert NFTMarketplace__NotListed();
        if (listing.isAuction) revert NFTMarketplace__AuctionAlreadyActive();
        if (msg.value < listing.price) revert NFTMarketplace__PriceNotMet();

        _processPaymentAndTransferNFT(nftAddress, tokenId, msg.value, listing.seller, msg.sender);

        delete s_listings[nftAddress][tokenId];
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
        // Check against starting price if no bids yet
        if (listing.highestBid == 0) {
            if (msg.value < listing.price) revert NFTMarketplace__BidBelowStartingPrice(listing.price);
        } else {
            // Check against minimum bid increment if there are previous bids
            uint256 minBidRequired = listing.highestBid + MIN_BID_INCREMENT;

            if (msg.value <= minBidRequired) {
                revert NFTMarketplace__BidIncrementTooLow(minBidRequired);
            }
        }

        // Refund previous highest bidder
        _handleBidPlacement(listing);

        // Update listing with new highest bid
        s_listings[nftAddress][tokenId].highestBidder = msg.sender;
        s_listings[nftAddress][tokenId].highestBid = msg.value;

        // Record bid history
        s_bids[nftAddress][tokenId].push(Bid({bidder: msg.sender, amount: msg.value, timestamp: block.timestamp}));

        emit BidPlaced(msg.sender, nftAddress, tokenId, msg.value, block.timestamp);
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
        _handleBidCancellation(nftAddress, tokenId, listing);

        emit BidWithdrawn(msg.sender, nftAddress, tokenId, bidAmount, block.timestamp);
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
            // Handle royalties and Transfer NFT to winner
            _processPaymentAndTransferNFT(
                nftAddress, tokenId, listing.highestBid, listing.seller, listing.highestBidder
            );

            emit AuctionEnded(
                listing.highestBidder, nftAddress, tokenId, listing.highestBid, listing.seller, block.timestamp
            );
        }

        delete s_listings[nftAddress][tokenId];
    }

    /**
     * @notice Withdraw earnings from sales
     */
    function withdrawEarnings() external nonReentrant {
        uint256 earnings = s_earnings[msg.sender];
        if (earnings <= 0) revert NFTMarketplace__NoEarnings();
        s_earnings[msg.sender] = 0;
        payable(msg.sender).sendValue(earnings);
        emit EarningsWithdrawn(msg.sender, earnings, block.timestamp);
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

        string memory collectionName = _getCollectionName(nftAddress);
        address creator = _getCreator(nftAddress);

        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(
            msg.sender,
            nftAddress,
            tokenId,
            newPrice,
            listing.isAuction,
            listing.category,
            block.timestamp,
            collectionName,
            creator
        );
    }

    /**
     * @notice Add a new category
     */
    function addCategory(bytes32 category, string memory name) external onlyOwner {
        s_categories.add(category);
        emit CategoryAdded(category, name, block.timestamp);
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
     * @dev Processes payment and calculates seller earnings after royalties and fees and Transfer Nft
     * @param nftAddress Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param paymentAmount Total payment amount
     * @param seller Address of the seller
     *  @param buyer Address of the buyer
     */
    function _processPaymentAndTransferNFT(
        address nftAddress,
        uint256 tokenId,
        uint256 paymentAmount,
        address seller,
        address buyer
    ) internal {
        // Handle royalties
        (address royaltyReceiver, uint256 royaltyAmount) = IERC2981(nftAddress).royaltyInfo(tokenId, paymentAmount);

        uint256 remainingAmount = paymentAmount;

        if (royaltyAmount > 0) {
            payable(royaltyReceiver).sendValue(royaltyAmount);
            remainingAmount -= royaltyAmount;
        }

        // Calculate marketplace fee
        uint256 marketplaceFee = (remainingAmount * i_marketplaceFee) / 10000;
        payable(owner()).sendValue(marketplaceFee);

        // Update seller earnings
        uint256 sellerEarnings = remainingAmount - marketplaceFee;
        s_earnings[seller] += sellerEarnings;

        // Transfer NFT
        IERC721(nftAddress).safeTransferFrom(seller, buyer, tokenId);

        emit ItemBought(
            buyer, nftAddress, tokenId, paymentAmount, seller, block.timestamp, royaltyAmount, royaltyReceiver
        );
    }

    function _handleBidPlacement(Listing memory listing) internal {
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).sendValue(listing.highestBid);
        }
    }

    function _handleBidCancellation(address nftAddress, uint256 tokenId, Listing memory listing) internal {
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

        // refund the cancelled bid
        payable(msg.sender).sendValue(listing.highestBid);
    }

    /**
     * @dev Gets the collection name from the NFT contract
     * @param nftAddress The address of the NFT contract
     * @return The name of the collection
     */
    function _getCollectionName(address nftAddress) internal view returns (string memory) {
        // Using IERC721Metadata interface to get the collection name
        return IERC721Metadata(nftAddress).name();
    }

    /**
     * @dev Gets the creator address from the NFT contract
     * @param nftAddress The address of the NFT contract
     * @return The address of the creator
     */
    function _getCreator(address nftAddress) internal view returns (address) {
        // First check: Owner of token 0 (common pattern for creator-owned collections)
        address creator = IERC721(nftAddress).ownerOf(0);
        if (creator != address(0)) {
            return creator;
        }

        // Second check: Contract owner/deployer (fallback)
        return Ownable(nftAddress).owner();
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getListing(address nftAddress, uint256 tokenId) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getEarnings(address seller) external view returns (uint256) {
        return s_earnings[seller];
    }

    function getBidHistory(address nftAddress, uint256 tokenId) external view returns (Bid[] memory) {
        return s_bids[nftAddress][tokenId];
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

    /**
     * @notice Get listings by category with pagination
     */
    function getListingsByCategory(bytes32 category, uint256 offset, uint256 limit)
        external
        view
        returns (
            address[] memory sellers,
            uint256[] memory prices,
            address[] memory nftAddresses,
            uint256[] memory tokenIds
        )
    {
        ActiveListing[] storage categoryListings = s_categoryListings[category];
        uint256 totalLength = categoryListings.length;

        if (offset >= totalLength) {
            return (new address[](0), new uint256[](0), new address[](0), new uint256[](0));
        }

        // Calculate actual length considering offset and limit
        uint256 end = (offset + limit) > totalLength ? totalLength : (offset + limit);
        uint256 resultLength = end - offset;

        // Initialize arrays
        sellers = new address[](resultLength);
        prices = new uint256[](resultLength);
        nftAddresses = new address[](resultLength);
        tokenIds = new uint256[](resultLength);

        // Populate arrays
        for (uint256 i = 0; i < resultLength; i++) {
            ActiveListing memory activeListing = categoryListings[offset + i];
            Listing memory listing = s_listings[activeListing.nftAddress][activeListing.tokenId];

            if (listing.seller != address(0)) {
                sellers[i] = listing.seller;
                prices[i] = listing.price;
                nftAddresses[i] = activeListing.nftAddress;
                tokenIds[i] = activeListing.tokenId;
            }
        }
    }

    /**
     * @notice Get active auctions
     */
    function getActiveAuctions()
        external
        view
        returns (
            address[] memory nftAddresses,
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices,
            uint256[] memory endTimes,
            uint256[] memory highestBids
        )
    {
        // First, count active auctions
        uint256 activeAuctionsCount = 0;
        bytes32[] memory categories = this.getCategories();

        for (uint256 c = 0; c < categories.length; c++) {
            ActiveListing[] storage categoryListings = s_categoryListings[categories[c]];
            for (uint256 i = 0; i < categoryListings.length; i++) {
                Listing memory listing = s_listings[categoryListings[i].nftAddress][categoryListings[i].tokenId];
                if (listing.isAuction && block.timestamp <= listing.auctionEndTime) {
                    activeAuctionsCount++;
                }
            }
        }

        // Initialize return arrays
        nftAddresses = new address[](activeAuctionsCount);
        tokenIds = new uint256[](activeAuctionsCount);
        sellers = new address[](activeAuctionsCount);
        prices = new uint256[](activeAuctionsCount);
        endTimes = new uint256[](activeAuctionsCount);
        highestBids = new uint256[](activeAuctionsCount);

        // Populate arrays
        uint256 currentIndex = 0;
        for (uint256 c = 0; c < categories.length; c++) {
            ActiveListing[] storage categoryListings = s_categoryListings[categories[c]];
            for (uint256 i = 0; i < categoryListings.length; i++) {
                Listing memory listing = s_listings[categoryListings[i].nftAddress][categoryListings[i].tokenId];
                if (listing.isAuction && block.timestamp <= listing.auctionEndTime) {
                    nftAddresses[currentIndex] = categoryListings[i].nftAddress;
                    tokenIds[currentIndex] = categoryListings[i].tokenId;
                    sellers[currentIndex] = listing.seller;
                    prices[currentIndex] = listing.price;
                    endTimes[currentIndex] = listing.auctionEndTime;
                    highestBids[currentIndex] = listing.highestBid;
                    currentIndex++;
                }
            }
        }
    }

    /**
     * @notice Get marketplace statistics
     */
    function getMarketplaceStats()
        external
        view
        returns (uint256 totalActiveListings, uint256 totalAuctions, uint256 totalCategories)
    {
        totalCategories = s_categories.length();
        bytes32[] memory categories = this.getCategories();

        for (uint256 c = 0; c < categories.length; c++) {
            ActiveListing[] storage categoryListings = s_categoryListings[categories[c]];
            for (uint256 i = 0; i < categoryListings.length; i++) {
                Listing memory listing = s_listings[categoryListings[i].nftAddress][categoryListings[i].tokenId];
                if (listing.seller != address(0)) {
                    totalActiveListings++;
                    if (listing.isAuction) {
                        totalAuctions++;
                    }
                }
            }
        }
    }

    /**
     * @notice Get user activity (listings and bids)
     */
    function getUserActivity(address user)
        external
        view
        returns (uint256 activeListings, uint256 activeBids, uint256 availableEarnings)
    {
        availableEarnings = s_earnings[user];
        bytes32[] memory categories = this.getCategories();

        for (uint256 c = 0; c < categories.length; c++) {
            ActiveListing[] storage categoryListings = s_categoryListings[categories[c]];
            for (uint256 i = 0; i < categoryListings.length; i++) {
                Listing memory listing = s_listings[categoryListings[i].nftAddress][categoryListings[i].tokenId];
                if (listing.seller == user) {
                    activeListings++;
                }
                if (listing.highestBidder == user) {
                    activeBids++;
                }
            }
        }
    }

    /**
     * @notice Get marketplace fee
     */
    function getMarketplaceFee() external view returns (uint256) {
        return i_marketplaceFee;
    }

    function getCollectionName(address nftAddress) external view returns (string memory) {
        return _getCollectionName(nftAddress);
    }

    function getCreator(address nftAddress) external view returns (address) {
        return _getCreator(nftAddress);
    }

    function getMinBidIncrement() external pure returns (uint256) {
        return MIN_BID_INCREMENT;
    }
}
