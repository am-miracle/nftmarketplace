// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFTCollection
 * @dev Enhanced NFT contract with advanced features including metadata management,
 *      royalties,
 */
contract NFTCollection is ERC721, ERC721URIStorage, ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    // Custom errors
    error NFTCollection__InvalidArrayLength();
    error NFTCollection__MintToZeroAddress();
    error NFTCollection__InvalidRoyaltyFee();
    error NFTCollection__NonExistentToken();
    error NFTCollection__MaxSupplyReached();
    error NFTCollection__InvalidMetadata();
    error NFTCollection__NotTokenOwner();
    error NFTCollection__URIAlreadyLocked();

    // Type declarations
    using Strings for uint256;

    struct TokenMetadata {
        string name;
        string description;
        string image;
        mapping(string => string) attributes;
    }

    // State Variables
    string private _baseTokenURI;
    bool private _baseURILocked;
    uint96 private _nextTokenId;
    uint96 public constant MIN_ROYALTY_FEE = 0;
    uint96 public constant MAX_ROYALTY_FEE = 1000; // 10% in basis points

    uint256 private immutable i_maxSupply;

    mapping(uint256 => TokenMetadata) private _tokenMetadata;
    mapping(uint256 => bool) private _tokenURILocked;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI, uint96 royaltyFee);
    event BatchTokensMinted(address indexed to, uint256[] tokenIds, string[] tokenURIs, uint96 royaltyFee);
    event BaseURIUpdated(string newBaseURI);
    event BaseURILocked();
    event TokenURILocked(uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string name, string description);

    // Modifiers
    modifier onlyTokenApprovedOrOwner(uint256 tokenId) {
        if (!_tokenExists(tokenId)) revert NFTCollection__NonExistentToken();
        if (
            ownerOf(tokenId) != _msgSender() && !isApprovedForAll(ownerOf(tokenId), _msgSender())
                && getApproved(tokenId) != _msgSender()
        ) {
            revert NFTCollection__NotTokenOwner();
        }
        _;
    }

    constructor(string memory name, string memory symbol, string memory baseTokenURI, uint256 maxSupply)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI;
        i_maxSupply = maxSupply;
    }

    /*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mints a new token
     * @param to The address that will own the minted token
     * @param _tokenURI URI for the token metadata
     * @param royaltyFee Royalty fee in basis points (100 = 1%)
     */
    function mint(address to, string calldata _tokenURI, uint96 royaltyFee)
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        uint256 tokenId = _mintSingle(to, _tokenURI, royaltyFee);
        emit TokenMinted(to, tokenId, _tokenURI, royaltyFee);
        return tokenId;
    }

    /**
     * @dev Batch mints new tokens
     * @param to The address that will own the minted tokens
     * @param tokenURIs Array of URIs for the token metadata
     * @param royaltyFee Royalty fee in basis points (100 = 1%)
     */
    function batchMint(address to, string[] calldata tokenURIs, uint96 royaltyFee)
        external
        onlyOwner
        returns (uint256[] memory)
    {
        uint256 length = tokenURIs.length;
        if (length == 0) revert NFTCollection__InvalidArrayLength();
        if (_nextTokenId + length > i_maxSupply) revert NFTCollection__MaxSupplyReached();

        uint256[] memory tokenIds = new uint256[](length);
        unchecked {
            for (uint256 i = 0; i < length; ++i) {
                tokenIds[i] = _mintSingle(to, tokenURIs[i], royaltyFee);
            }
        }

        emit BatchTokensMinted(to, tokenIds, tokenURIs, royaltyFee);
        return tokenIds;
    }

    /**
     * @dev Sets the base URI for all tokens
     * @param newBaseURI New base URI
     */
    function setBaseURI(string calldata newBaseURI) public onlyOwner {
        if (_baseURILocked) revert NFTCollection__URIAlreadyLocked();
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Locks the base URI permanently
     */
    function lockBaseURI() public onlyOwner {
        _baseURILocked = true;
        emit BaseURILocked();
    }

    /**
     * @dev Updates token metadata
     * @param tokenId ID of the token to update
     * @param name New name for the token
     * @param description New description for the token
     * @param attributeKeys Key-value pairs of attributes
     */
    function updateTokenMetadata(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory image,
        string[] memory attributeKeys,
        string[] memory attributeValues
    ) public onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert NFTCollection__NonExistentToken();
        if (_tokenURILocked[tokenId]) revert NFTCollection__URIAlreadyLocked();
        if (attributeKeys.length != attributeValues.length) revert NFTCollection__InvalidMetadata();

        TokenMetadata storage metadata = _tokenMetadata[tokenId];
        metadata.name = name;
        metadata.description = description;
        metadata.image = image;

        unchecked {
            for (uint256 i = 0; i < attributeKeys.length; ++i) {
                metadata.attributes[attributeKeys[i]] = attributeValues[i];
            }
        }

        emit MetadataUpdated(tokenId, name, description);
    }

    /**
     * @dev Locks a token's URI permanently
     * @param tokenId ID of the token to lock
     */
    function lockTokenURI(uint256 tokenId) public onlyOwner {
        if (!_tokenExists(tokenId)) revert NFTCollection__NonExistentToken();
        _tokenURILocked[tokenId] = true;
        emit TokenURILocked(tokenId);
    }

    // Required overrides

    /*//////////////////////////////////////////////////////////////
                           PUBLIC VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    /*//////////////////////////////////////////////////////////////
                           INTERNAL AND INTERNAL VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _mintSingle(address to, string calldata _tokenURI, uint96 royaltyFee) internal returns (uint256) {
        if (to == address(0)) revert NFTCollection__MintToZeroAddress();
        if (royaltyFee > MAX_ROYALTY_FEE) revert NFTCollection__InvalidRoyaltyFee();
        if (_nextTokenId >= i_maxSupply) revert NFTCollection__MaxSupplyReached();

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        _setTokenRoyalty(tokenId, to, royaltyFee);

        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    // Internal View functions
    /**
     * @dev Checks if a token exists
     * @param tokenId ID of the token to check
     * @return bool whether the token exists
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /*//////////////////////////////////////////////////////////////
                            GETTER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getTokenCount() public view returns (uint256) {
        return _nextTokenId;
    }

    function getMaxSupply() public view returns (uint256) {
        return i_maxSupply;
    }

    function isBaseURILocked() public view returns (bool) {
        return _baseURILocked;
    }

    function getBaseTokenURI() public view returns (string memory) {
        return _baseTokenURI;
    }

    function isTokenURILocked(uint256 tokenId) public view returns (bool) {
        return _tokenURILocked[tokenId];
    }

    function getTokenMetadata(uint256 tokenId)
        public
        view
        returns (string memory name, string memory description, string memory image)
    {
        if (!_tokenExists(tokenId)) revert NFTCollection__NonExistentToken();
        TokenMetadata storage metadata = _tokenMetadata[tokenId];
        return (metadata.name, metadata.description, metadata.image);
    }
}
