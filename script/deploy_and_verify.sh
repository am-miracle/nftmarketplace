#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check if a transaction is mined
wait_for_tx() {
    local tx_hash=$1
    local max_attempts=60
    local attempt=1

    echo "Waiting for transaction $tx_hash to be mined..."
    
    while [ $attempt -le $max_attempts ]; do
        if cast receipt $tx_hash &>/dev/null; then
            echo -e "${GREEN}Transaction mined successfully!${NC}"
            return 0
        fi
        echo "Attempt $attempt of $max_attempts - waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}Transaction failed to mine within timeout${NC}"
    return 1
}

# Deploy NFT Collection
echo "Deploying NFT Collection..."
NFT_DEPLOY_OUTPUT=$(forge script script/DeployNftCollection.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    -vvvv)

# Extract contract address and transaction hash
NFT_ADDRESS=$(echo "$NFT_DEPLOY_OUTPUT" | grep -oP 'Contract Address: \K[0-9a-fA-F]{40}')
NFT_TX=$(echo "$NFT_DEPLOY_OUTPUT" | grep -oP 'Transaction hash: \K0x[0-9a-fA-F]{64}')

# Wait for deployment transaction to be mined
wait_for_tx $NFT_TX
if [ $? -ne 0 ]; then
    echo -e "${RED}NFT Collection deployment failed${NC}"
    exit 1
fi

# Update .env with NFT address
sed -i '' "s/NFT_CONTRACT_ADDRESS=.*/NFT_CONTRACT_ADDRESS=$NFT_ADDRESS/" .env

# Wait for 30 seconds before verification
echo "Waiting 30 seconds before verification..."
sleep 30

# Verify NFT Collection
echo "Verifying NFT Collection..."
forge verify-contract \
    $NFT_ADDRESS \
    src/NFTCollection.sol:NFTCollection \
    --chain-id 11155111 \
    --watch \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(string,string,string,uint256)" "$NFT_NAME" "$NFT_SYMBOL" "$BASE_URI" "$MAX_SUPPLY")

if [ $? -ne 0 ]; then
    echo -e "${RED}NFT Collection verification failed${NC}"
    # Don't exit, try again with the verification script
    forge script script/VerifyContracts.s.sol --rpc-url $SEPOLIA_RPC_URL
fi

echo -e "${GREEN}Deployment and verification completed!${NC}"

#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
source .env

# Check required environment variables
echo "Checking environment variables..."
required_vars=(
    "PRIVATE_KEY"
    "SEPOLIA_RPC_URL"
    "ETHERSCAN_API_KEY"
    "MARKETPLACE_FEE"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env${NC}"
        exit 1
    fi
done

# Function to check if a transaction is mined
wait_for_tx() {
    local tx_hash=$1
    local max_attempts=60
    local attempt=1

    echo "Waiting for transaction $tx_hash to be mined..."
    
    while [ $attempt -le $max_attempts ]; do
        if cast receipt $tx_hash &>/dev/null; then
            echo -e "${GREEN}Transaction mined successfully!${NC}"
            return 0
        fi
        echo "Attempt $attempt of $max_attempts - waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}Transaction failed to mine within timeout${NC}"
    return 1
}

# Deploy NFT Marketplace
echo -e "${YELLOW}Deploying NFT Marketplace...${NC}"
DEPLOY_OUTPUT=$(forge script script/DeployNftMarketplace.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    -vvvv)

# Extract contract address and transaction hash
MARKETPLACE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Contract Address: \K[0-9a-fA-F]{40}')
MARKETPLACE_TX=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Transaction hash: \K0x[0-9a-fA-F]{64}')

if [ -z "$MARKETPLACE_ADDRESS" ] || [ -z "$MARKETPLACE_TX" ]; then
    echo -e "${RED}Failed to extract contract address or transaction hash${NC}"
    exit 1
fi

echo -e "${GREEN}Marketplace deployed at: ${MARKETPLACE_ADDRESS}${NC}"
echo -e "${GREEN}Transaction hash: ${MARKETPLACE_TX}${NC}"

# Wait for deployment transaction to be mined
wait_for_tx $MARKETPLACE_TX
if [ $? -ne 0 ]; then
    echo -e "${RED}NFT Marketplace deployment failed${NC}"
    exit 1
fi

# Update .env with marketplace address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/MARKETPLACE_CONTRACT_ADDRESS=.*/MARKETPLACE_CONTRACT_ADDRESS=$MARKETPLACE_ADDRESS/" .env
else
    # Linux
    sed -i "s/MARKETPLACE_CONTRACT_ADDRESS=.*/MARKETPLACE_CONTRACT_ADDRESS=$MARKETPLACE_ADDRESS/" .env
fi

# Wait before verification
echo -e "${YELLOW}Waiting 30 seconds before verification...${NC}"
sleep 30

# Verify NFT Marketplace
echo -e "${YELLOW}Verifying NFT Marketplace...${NC}"
forge verify-contract \
    $MARKETPLACE_ADDRESS \
    src/NFTMarketplace.sol:NFTMarketplace \
    --chain-id 11155111 \
    --watch \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(uint256)" $MARKETPLACE_FEE)

if [ $? -ne 0 ]; then
    echo -e "${RED}First verification attempt failed. Trying alternative method...${NC}"
    # Try alternative verification method
    forge verify-contract \
        $MARKETPLACE_ADDRESS \
        src/NFTMarketplace.sol:NFTMarketplace \
        --chain sepolia \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        --constructor-args-path verify_args.txt \
        --watch
fi

# Final verification check
if cast code $MARKETPLACE_ADDRESS &>/dev/null; then
    echo -e "${GREEN}NFT Marketplace deployed and verified successfully!${NC}"
    echo -e "${GREEN}Contract Address: ${MARKETPLACE_ADDRESS}${NC}"
    echo -e "${GREEN}Etherscan: https://sepolia.etherscan.io/address/${MARKETPLACE_ADDRESS}${NC}"
else
    echo -e "${RED}Contract deployment verification failed${NC}"
    exit 1
fi

# Initialize marketplace (optional)
echo -e "${YELLOW}Would you like to initialize the marketplace with default categories? (y/n)${NC}"
read -r init_response

if [[ $init_response =~ ^[Yy]$ ]]; then
    echo "Initializing marketplace with default categories..."
    
    # Add default categories
    categories=("Art" "Music" "Photography" "Sports" "Gaming" "Collectibles")
    
    for category in "${categories[@]}"; do
        echo "Adding category: $category"
        forge script script/Interactions.s.sol \
            --rpc-url $SEPOLIA_RPC_URL \
            --private-key $PRIVATE_KEY \
            --sig "addCategory(bytes32,string)" \
            $(cast keccak "$(cast --from-ascii "$category")" | cut -c 1-64) "$category"
    done
fi

echo -e "${GREEN}Deployment and setup completed!${NC}"