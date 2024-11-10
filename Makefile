-include .env

.PHONY: all test clean deploy help install snapshot format anvil

help:
	@echo "Usage:"
	@echo " make deploy [ARGS=...]\n	example: make deploy ARGS=\"--network sepolia\""

all: clean remove install update build

clean:; forge clean

remove:; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install:; forge install https://github.com/OpenZeppelin/openzeppelin-contracts.git --no-commit && forge install https://github.com/smartcontractkit/chainlink.git --no-commit && forge install https://github.com/Cyfrin/foundry-devops.git --no-commit && forge install https://github.com/transmissions11/solmate.git --no-commit && forge install https://github.com/foundry-rs/forge-std.git --no-commit

update:; forge update

build:; forge build

test:; forge test

snapshot:; forge snapshot

format:; forge fmt

anvil:; anvil --block-time 1

NETWORK_ARGS := --rpc-url $(ANVIL_RPC_URL) --private-key $(ANVIL_DEFAULT_KEY) --broadcast -vvvv

ifeq ($(findstring --network sepolia,$(ARGS)),--network sepolia)
	NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv
endif

deployNftCollection:
	@forge script script/DeployNftCollection.s.sol:DeployNftCollection $(NETWORK_ARGS)

deployNftMarketplace:
	@forge script script/DeployNftMarketplace.s.sol:DeployNftMarketplace $(NETWORK_ARGS)

mintNft:
	@forge script script/Interactions.s.sol:MintNft $(NETWORK_ARGS)

batchMintNft:
	@forge script script/Interactions.s.sol:BatchMintNft $(NETWORK_ARGS)

listNft:
	@forge script script/Interactions.s.sol:ListNft $(NETWORK_ARGS)

addCategory:
	@forge script script/Interactions.s.sol:AddCategory $(NETWORK_ARGS)

buyNFT:
	@forge script script/Interactions.s.sol:BuyNft $(NETWORK_ARGS)

placeBid:
	@forge script script/Interactions.s.sol:PlaceBid $(NETWORK_ARGS)

endAuction:
	@forge script script/Interactions.s.sol:EndAuction $(NETWORK_ARGS)