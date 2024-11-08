// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NFTCollection} from "../src/NFTCollection.sol";
import {NFTMarketplace} from "../src/NFTMarketplace.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract Interactions is Script {
    function mintNFT(address nftCollection, string memory tokenUri, uint96 royaltyFee) public {
        vm.startBroadcast();
        NFTCollection(nftCollection).mint(msg.sender, tokenUri, royaltyFee);
        vm.stopBroadcast();
    }

    function batchMintNFT(address nftCollection, string[] memory tokenUris, uint96 royaltyFee) public {
        vm.startBroadcast();
        NFTCollection(nftCollection).batchMint(msg.sender, tokenUris, royaltyFee);
        vm.stopBroadcast();
    }

    function listNFT(
        address nftMarketplace,
        address nftCollection,
        uint256 tokenId,
        uint256 price,
        bool isAuction,
        bytes32 category
    ) public {
        vm.startBroadcast();

        // First approve marketplace
        NFTCollection(nftCollection).approve(nftMarketplace, tokenId);

        // Then list the NFT
        NFTMarketplace(nftMarketplace).listItem(nftCollection, tokenId, price, isAuction, category);

        vm.stopBroadcast();
    }

    function buyNFT(address nftMarketplace, address nftCollection, uint256 tokenId, uint256 price) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).buyItem{value: price}(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    function placeBid(address nftMarketplace, address nftCollection, uint256 tokenId, uint256 bidAmount) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).placeBid{value: bidAmount}(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    function endAuction(address nftMarketplace, address nftCollection, uint256 tokenId) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).endAuction(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    // Helper function to run script with most recently deployed contracts
    function run() external {
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);

        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);

        // Example interaction
        string memory tokenUri = "ipfs://QmYourTokenUri/1";
        mintNFT(nftCollection, tokenUri, 1000); // 10% royalty

        string[] memory tokenUris = new string[](2);
        tokenUris[0] = "ipfs://QmYourTokenUri/1";
        tokenUris[1] = "ipfs://QmYourTokenUri/2";
        batchMintNFT(nftCollection, tokenUris, 1000); // 10% royalty

        listNFT(nftMarketplace, nftCollection, 1, 100, false, keccak256(abi.encodePacked("Art")));
        listNFT(nftMarketplace, nftCollection, 2, 200, true, keccak256(abi.encodePacked("Collectibles")));
    }
}
