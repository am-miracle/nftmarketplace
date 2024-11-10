// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {NFTCollection} from "../src/NFTCollection.sol";
import {NFTMarketplace} from "../src/NFTMarketplace.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";

contract MintNft is Script {
    function mintNft(address nftCollection, string memory tokenUri, uint96 defaultRoyaltyFee, uint256 deployerKey)
        public
    {
        vm.startBroadcast(deployerKey);
        NFTCollection(nftCollection).mint(msg.sender, tokenUri, defaultRoyaltyFee);
        vm.stopBroadcast();
    }

    function createMintNftUsingConfig(address nftCollection, string memory tokenUri) public {
        HelperConfig helperConfig = new HelperConfig();
        (uint256 deployerKey,,,,,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();
        mintNft(nftCollection, tokenUri, defaultRoyaltyFee, deployerKey);
    }

    function run() external {
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);
        string memory tokenUri =
            "https://ipfs.io/ipfs/QmXaY8u2csuYBD2dQMsKu5kHPJGK7zWoTnhfNtcGYRa6Xq?filename=ArtShift-002.json";
        createMintNftUsingConfig(nftCollection, tokenUri);
    }
}

contract BatchMintNft is Script {
    function batchMintNft(
        address nftCollection,
        string[] memory tokenUris,
        uint256 deployerKey,
        uint96 defaultRoyaltyFee
    ) public {
        // Start broadcast only once
        vm.startBroadcast(deployerKey);
        address deployer = vm.addr(deployerKey);

        NFTCollection(nftCollection).batchMint(deployer, tokenUris, defaultRoyaltyFee);

        vm.stopBroadcast();
    }

    function createBatchMintNftUsingConfig(address nftCollection, string[] memory tokenUris) public {
        HelperConfig helperConfig = new HelperConfig();
        (uint256 deployerKey,,,,,, uint96 defaultRoyaltyFee) = helperConfig.activeNetworkConfig();

        // Call batchMintNft directly without additional broadcast
        batchMintNft(nftCollection, tokenUris, deployerKey, defaultRoyaltyFee);
    }

    function run() external {
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);

        string[] memory tokenUris = new string[](2);
        tokenUris[0] = "https://ipfs.io/ipfs/QmXaY8u2csuYBD2dQMsKu5kHPJGK7zWoTnhfNtcGYRa6Xq?filename=ArtShift-002.json";
        tokenUris[1] = "https://ipfs.io/ipfs/QmWh39jqJDR2gxwgYRbrJCev16scwmv1dcQE6cjrXkisDR?filename=ArtShift-003.json";

        createBatchMintNftUsingConfig(nftCollection, tokenUris);
    }
}

contract AddCategory is Script {
    function addCategory(address nftMarketplace, bytes32 category, string memory name, uint256 deployerKey) public {
        vm.startBroadcast(deployerKey);
        NFTMarketplace(nftMarketplace).addCategory(category, name);
        vm.stopBroadcast();
    }

    function createAddCategoryUsingConfig(address nftMarketplace, bytes32 category, string memory name) public {
        HelperConfig helperConfig = new HelperConfig();
        (uint256 deployerKey,,,,,,) = helperConfig.activeNetworkConfig();
        addCategory(nftMarketplace, category, name, deployerKey);
    }

    function run() external {
        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);
        bytes32 category = keccak256(abi.encodePacked("ART"));
        string memory categoryName = "Art";
        createAddCategoryUsingConfig(nftMarketplace, category, categoryName);
    }
}

contract ListNft is Script {
    function listNft(
        address nftMarketplace,
        address nftCollection,
        uint256 tokenId,
        uint256 price,
        bool isAuction,
        bytes32 category,
        uint256 deployerKey
    ) public {
        vm.startBroadcast(deployerKey);
        NFTCollection(nftCollection).approve(nftMarketplace, tokenId);
        NFTMarketplace(nftMarketplace).listItem(nftCollection, tokenId, price, isAuction, category);
        vm.stopBroadcast();
    }

    function createListNftUsingConfig(
        address nftMarketplace,
        address nftCollection,
        uint256 tokenId,
        uint256 price,
        bytes32 category
    ) public {
        HelperConfig helperConfig = new HelperConfig();
        (uint256 deployerKey,,,,,,) = helperConfig.activeNetworkConfig();
        listNft(nftMarketplace, nftCollection, tokenId, price, true, category, deployerKey);
    }

    function run() external {
        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);
        uint256 tokenId = 1;
        uint256 price = 1 ether;
        bytes32 category = keccak256(abi.encodePacked("ART"));
        createListNftUsingConfig(nftMarketplace, nftCollection, tokenId, price, category);
    }
}

contract BuyNft is Script {
    function buyNft(address nftMarketplace, address nftCollection, uint256 tokenId, uint256 price) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).buyItem{value: price}(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    function createBuyUsingConfig(address nftMarketplace, address nftCollection, uint256 tokenId, uint256 price)
        public
    {
        // HelperConfig helperConfig = new HelperConfig();
        // (uint256 deployerKey,,,,,,) = helperConfig.activeNetworkConfig();
        buyNft(nftMarketplace, nftCollection, tokenId, price);
    }

    function run() external {
        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);
        uint256 tokenId = 1;
        uint256 price = 1 ether;
        createBuyUsingConfig(nftMarketplace, nftCollection, tokenId, price);
    }
}

contract PlaceBid is Script {
    address ANOTHER_USER = makeAddr("another_user");
    uint256 public constant STARTING_AMOUNT = 100 ether;

    function placeBid(address nftMarketplace, address nftCollection, uint256 tokenId, uint256 bidAmount) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).placeBid{value: bidAmount}(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    function run() external {
        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);
        uint256 tokenId = 1;
        uint256 bidAmount = 5 ether;
        placeBid(nftMarketplace, nftCollection, tokenId, bidAmount);
    }
}

contract EndAuction is Script {
    function endAuction(address nftMarketplace, address nftCollection, uint256 tokenId) public {
        vm.startBroadcast();
        NFTMarketplace(nftMarketplace).endAuction(nftCollection, tokenId);
        vm.stopBroadcast();
    }

    function run() external {
        address nftMarketplace = DevOpsTools.get_most_recent_deployment("NFTMarketplace", block.chainid);
        address nftCollection = DevOpsTools.get_most_recent_deployment("NFTCollection", block.chainid);
        uint256 tokenId = 1;
        endAuction(nftMarketplace, nftCollection, tokenId);
    }
}
