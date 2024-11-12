// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {DeployNftCollection} from "../../script/DeployNftCollection.s.sol";
import {NFTCollection} from "../../src/NFTCollection.sol";

contract NftCollectionTest is Test {
    NFTCollection nftCollection;
    HelperConfig helperConfig;
    DeployNftCollection deployer;

    address public USER = makeAddr("user");
    address public MINTER = makeAddr("minter");
    uint256 constant STARTING_USER_BALANCE = 10 ether;

    // Events to test
    event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI, uint96 royaltyFee);
    event BatchTokensMinted(address indexed to, uint256[] tokenIds, string[] tokenURIs, uint96 royaltyFee);
    event BaseURIUpdated(string newBaseURI);
    event BaseURILocked();

    function setUp() external {
        deployer = new DeployNftCollection();
        (nftCollection, helperConfig) = deployer.run();
        vm.deal(USER, STARTING_USER_BALANCE);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_InitialState() public view {
        (,, string memory nftName, string memory nftSymbol, string memory baseTokenURI, uint256 maxSupply,) =
            helperConfig.activeNetworkConfig();

        assertEq(nftCollection.name(), nftName);
        assertEq(nftCollection.symbol(), nftSymbol);
        assertEq(nftCollection.getMaxSupply(), maxSupply);
        assertEq(nftCollection.getBaseTokenURI(), baseTokenURI);
        assertEq(nftCollection.getTokenCount(), 0);
        assertEq(nftCollection.isBaseURILocked(), false);
    }

    /*//////////////////////////////////////////////////////////////
                            MINT FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MintToken() public {
        // Get config values
        (,,,, string memory baseUri,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();
        string memory tokenUri = "ipfs://QmToken1";

        // Only owner can mint
        vm.prank(nftCollection.owner());

        // Test the mint function and expect the TokenMinted event
        vm.expectEmit(true, true, false, true);
        emit TokenMinted(USER, 0, tokenUri, defaultRoyaltyFee);

        uint256 tokenId = nftCollection.mint(USER, tokenUri, defaultRoyaltyFee);

        // Verify the token was minted correctly
        assertEq(nftCollection.ownerOf(tokenId), USER);

        string memory expectedUri = string.concat(baseUri, tokenUri);
        string memory actualUri = nftCollection.tokenURI(tokenId);
        assertEq(actualUri, expectedUri);

        // Verify royalty info
        (address receiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenId, 10000);
        assertEq(receiver, USER);
        assertEq(royaltyAmount, (10000 * defaultRoyaltyFee) / 10000);
    }

    function testFail_MintToZeroAddress() public {
        (,,,,,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();
        vm.prank(nftCollection.owner());
        nftCollection.mint(address(0), "ipfs://QmToken1", defaultRoyaltyFee);
    }

    function testFail_MintWithInvalidRoyaltyFee() public {
        vm.prank(nftCollection.owner());
        nftCollection.mint(USER, "ipfs://QmToken1", 1001); // More than MAX_ROYALTY_FEE (1000)
    }

    function testFail_MintByNonOwner() public {
        (,,,,,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();
        vm.prank(USER);
        nftCollection.mint(USER, "ipfs://QmToken1", defaultRoyaltyFee);
    }

    /*//////////////////////////////////////////////////////////////
                          BATCH MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BatchMintTokens() public {
        // Get config values
        (,,,, string memory baseUri,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();
        vm.startPrank(nftCollection.owner());

        string[] memory tokenUris = new string[](3);
        tokenUris[0] = "ipfs://QmToken2";
        tokenUris[1] = "ipfs://QmToken3";
        tokenUris[2] = "ipfs://QmToken4";

        // Calculate expected token IDs
        uint256[] memory expectedTokenIds = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            expectedTokenIds[i] = i;
        }

        // Expect the BatchTokensMinted event before minting
        vm.expectEmit(true, true, true, true);
        emit BatchTokensMinted(USER, expectedTokenIds, tokenUris, defaultRoyaltyFee);

        // Mint 3 tokens
        uint256[] memory tokenIds = nftCollection.batchMint(USER, tokenUris, defaultRoyaltyFee);

        // Verify each token
        for (uint256 i = 0; i < tokenIds.length; i++) {
            assertEq(tokenIds[i], i);
            assertEq(nftCollection.ownerOf(tokenIds[i]), USER);
            assertEq(nftCollection.tokenURI(tokenIds[i]), string.concat(baseUri, tokenUris[i]));

            // Verify royalty info
            (address receiver, uint256 royaltyAmount) = nftCollection.royaltyInfo(tokenIds[i], 10000);
            assertEq(receiver, USER);
            assertEq(royaltyAmount, (10000 * defaultRoyaltyFee) / 10000);
        }

        // Verify total token count
        assertEq(nftCollection.getTokenCount(), 3);
        assertEq(nftCollection.balanceOf(USER), 3);
        vm.stopPrank();
    }

    function test_BatchMintToMultipleAddresses() public {
        address[] memory receivers = new address[](3);
        receivers[0] = makeAddr("receiver1");
        receivers[1] = makeAddr("receiver2");
        receivers[2] = makeAddr("receiver3");

        vm.startPrank(nftCollection.owner());

        for (uint256 j = 0; j < receivers.length; j++) {
            string[] memory tokenURIs = new string[](2);
            tokenURIs[0] = string.concat("batch", vm.toString(j), "_1.json");
            tokenURIs[1] = string.concat("batch", vm.toString(j), "_2.json");

            uint256[] memory tokenIds = nftCollection.batchMint(receivers[j], tokenURIs, 500);

            for (uint256 i = 0; i < tokenIds.length; i++) {
                assertEq(nftCollection.ownerOf(tokenIds[i]), receivers[j]);
            }
            assertEq(nftCollection.balanceOf(receivers[j]), 2);
        }

        vm.stopPrank();
    }

    function testFail_BatchMintEmptyArray() public {
        vm.startPrank(nftCollection.owner());
        string[] memory emptyURIs = new string[](0);
        nftCollection.batchMint(USER, emptyURIs, 500);
        vm.stopPrank();
    }

    function testFail_BatchMintExceedMaxSupply() public {
        uint256 maxSupply = nftCollection.getMaxSupply();
        string[] memory tokenURIs = new string[](maxSupply + 1);

        for (uint256 i = 0; i < maxSupply + 1; i++) {
            tokenURIs[i] = string.concat("token", vm.toString(i), ".json");
        }

        vm.prank(nftCollection.owner());
        nftCollection.batchMint(USER, tokenURIs, 500);
    }

    /*//////////////////////////////////////////////////////////////
                        METADATA UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateTokenMetadata() public {
        vm.startPrank(nftCollection.owner());

        // First mint a token
        uint256 tokenId = nftCollection.mint(USER, "metadata.json", 500);

        // Prepare metadata
        string memory newName = "Updated NFT Name";
        string memory newDescription = "Updated NFT Description";
        string memory newImage = "https://example.com/new-image.jpg";
        string[] memory attributeKeys = new string[](3);
        string[] memory attributeValues = new string[](3);

        attributeKeys[0] = "trait_type";
        attributeKeys[1] = "level";
        attributeKeys[2] = "rarity";

        attributeValues[0] = "background";
        attributeValues[1] = "5";
        attributeValues[2] = "legendary";

        // Update metadata
        nftCollection.updateTokenMetadata(tokenId, newName, newDescription, newImage, attributeKeys, attributeValues);

        // Verify metadata
        (string memory name, string memory description, string memory image) = nftCollection.getTokenMetadata(tokenId);
        assertEq(name, newName);
        assertEq(description, newDescription);
        assertEq(image, newImage);

        vm.stopPrank();
    }

    function test_UpdateTokenMetadataBeforeLock() public {
        vm.startPrank(nftCollection.owner());

        // Mint token
        uint256 tokenId = nftCollection.mint(USER, "metadata.json", 500);

        // Update metadata multiple times
        for (uint256 i = 1; i <= 3; i++) {
            string[] memory keys = new string[](1);
            string[] memory values = new string[](1);
            keys[0] = "version";
            values[0] = vm.toString(i);

            nftCollection.updateTokenMetadata(
                tokenId,
                string.concat("Name Version ", vm.toString(i)),
                string.concat("Description Version ", vm.toString(i)),
                "https://example.com/new-image.jpg",
                keys,
                values
            );
        }

        // Verify final metadata
        (string memory name, string memory description,) = nftCollection.getTokenMetadata(tokenId);
        assertEq(name, "Name Version 3");
        assertEq(description, "Description Version 3");

        vm.stopPrank();
    }

    function testFail_UpdateMetadataAfterLock() public {
        vm.startPrank(nftCollection.owner());

        // Mint token
        uint256 tokenId = nftCollection.mint(USER, "metadata.json", 500);

        // Lock token URI
        nftCollection.lockTokenURI(tokenId);

        // Try to update metadata after locking
        string[] memory keys = new string[](1);
        string[] memory values = new string[](1);
        nftCollection.updateTokenMetadata(
            tokenId, "New Name", "New Description", "https://example.com/new-image.jpg", keys, values
        );

        vm.stopPrank();
    }

    function testFail_UpdateMetadataForNonexistentToken() public {
        vm.startPrank(nftCollection.owner());

        string[] memory keys = new string[](1);
        string[] memory values = new string[](1);
        nftCollection.updateTokenMetadata(
            999, // Non-existent token ID
            "New Name",
            "New Description",
            "https://example.com/new-image.jpg",
            keys,
            values
        );

        vm.stopPrank();
    }

    function testFail_UpdateMetadataWithMismatchedArrays() public {
        vm.startPrank(nftCollection.owner());

        // Mint token
        uint256 tokenId = nftCollection.mint(USER, "metadata.json", 500);

        // Try to update with mismatched arrays
        string[] memory keys = new string[](2);
        string[] memory values = new string[](1);
        keys[0] = "trait_type";
        keys[1] = "level";
        values[0] = "background";

        nftCollection.updateTokenMetadata(
            tokenId, "New Name", "New Description", "https://example.com/new-image.jpg", keys, values
        );

        vm.stopPrank();
    }

    function testFail_UpdateMetadataByNonOwner() public {
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(USER, "metadata.json", 500);

        vm.prank(USER);
        string[] memory keys = new string[](1);
        string[] memory values = new string[](1);
        nftCollection.updateTokenMetadata(
            tokenId, "New Name", "New Description", "https://example.com/new-image.jpg", keys, values
        );
    }

    /*//////////////////////////////////////////////////////////////
                            BASE URI TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetBaseURI() public {
        string memory newBaseURI = "ipfs://newBaseURI/";

        vm.prank(nftCollection.owner());
        vm.expectEmit(true, true, false, true);
        emit BaseURIUpdated(newBaseURI);

        nftCollection.setBaseURI(newBaseURI);

        // Mint a token to test the new baseURI
        vm.prank(nftCollection.owner());
        uint256 tokenId = nftCollection.mint(USER, "test.json", 100);

        assertEq(nftCollection.tokenURI(tokenId), string.concat(newBaseURI, "test.json"));
    }

    function test_LockBaseURI() public {
        vm.prank(nftCollection.owner());
        vm.expectEmit(true, true, false, true);
        emit BaseURILocked();

        nftCollection.lockBaseURI();

        assertTrue(nftCollection.isBaseURILocked());
    }

    function testFail_SetBaseURIAfterLock() public {
        // Lock the baseURI
        vm.prank(nftCollection.owner());
        nftCollection.lockBaseURI();

        // Try to set new baseURI after locking
        vm.prank(nftCollection.owner());
        nftCollection.setBaseURI("ipfs://newBaseURI/");
    }
}
