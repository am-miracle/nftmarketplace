// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title HelperConfig
 * @notice This contract contains network-specific configurations
 */
contract HelperConfig is Script {
    struct NetworkConfig {
        uint256 deployerKey;
        uint256 marketplaceFee; // in basis points (e.g., 250 = 2.5%)
        string nftName;
        string nftSymbol;
        string nftBaseUri;
        uint256 maxSupply;
        uint96 defaultRoyaltyFee; // in basis points
    }

    uint256 public constant DEFAULT_ANVIL_DEPLOYER_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    NetworkConfig public activeNetworkConfig;

    // Constants
    uint256 public constant DEFAULT_MARKETPLACE_FEE = 250; // 2.5%
    uint256 public constant DEFAULT_MAX_SUPPLY = 10000;
    uint96 public constant DEFAULT_ROYALTY_FEE = 1000; // 10%

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaEthConfig();
        } else if (block.chainid == 1) {
            activeNetworkConfig = getMainnetEthConfig();
        } else {
            activeNetworkConfig = getOrCreateAnvilEthConfig();
        }
    }

    function getSepoliaEthConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployerKey: vm.envUint("PRIVATE_KEY"),
            marketplaceFee: DEFAULT_MARKETPLACE_FEE,
            nftName: "Neflex",
            nftSymbol: "NFLX",
            nftBaseUri: "ipfs://QmYourBaseUri/",
            maxSupply: DEFAULT_MAX_SUPPLY,
            defaultRoyaltyFee: DEFAULT_ROYALTY_FEE
        });
    }

    function getMainnetEthConfig() public view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployerKey: vm.envUint("PRIVATE_KEY"),
            marketplaceFee: DEFAULT_MARKETPLACE_FEE,
            nftName: "Neflex",
            nftSymbol: "NFLX",
            nftBaseUri: "ipfs://QmYourBaseUri/",
            maxSupply: DEFAULT_MAX_SUPPLY,
            defaultRoyaltyFee: DEFAULT_ROYALTY_FEE
        });
    }

    function getOrCreateAnvilEthConfig() public view returns (NetworkConfig memory anvilConfig) {
        if (activeNetworkConfig.deployerKey != 0) {
            return activeNetworkConfig;
        }
        return NetworkConfig({
            deployerKey: DEFAULT_ANVIL_DEPLOYER_KEY,
            marketplaceFee: DEFAULT_MARKETPLACE_FEE,
            nftName: "Neflex",
            nftSymbol: "NFLX",
            nftBaseUri: "https://ipfs.io/ipfs/QmYaDcC1nCpNeQzoEF2tQz7gyu1WqpKKtZfZyK6cP3fcDR",
            maxSupply: DEFAULT_MAX_SUPPLY,
            defaultRoyaltyFee: DEFAULT_ROYALTY_FEE
        });
    }
}
