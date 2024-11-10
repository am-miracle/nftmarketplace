// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NFTCollection} from "../src/NFTCollection.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployNftCollection is Script {
    function run() external returns (NFTCollection, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig();
        (
            uint256 deployerKey,
            ,
            string memory nftName,
            string memory nftSymbol,
            string memory baseTokenURI,
            uint256 maxSupply,
        ) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(deployerKey);

        NFTCollection nftCollection = new NFTCollection(nftName, nftSymbol, baseTokenURI, maxSupply);

        vm.stopBroadcast();

        return (nftCollection, helperConfig);
    }
}
