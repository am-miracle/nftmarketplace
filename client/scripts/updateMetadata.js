// Contract Update Script

// Set base URI first
await contract.setBaseURI("ipfs://QmViqbutXLYdkfqn9DzMJm2r5EPLKAkkKz5Jq5UaKAXtAn/metadata/");

// Update Token 1
await contract.updateTokenMetadata(
    1,
    "3d illustration of cute white shoes without feet in them. #1",
    "white and blue heart illustration",
    "ipfs://QmNakYxMUict7y3jedkqwH6WnZQqTRV1dhTZ3p7vA257ba/images/1.jpg",
    ["Artist","Source","SourceLink","TokenId"],
    ["Shubham Dhage","Unsplash","https://unsplash.com/photos/white-and-blue-heart-illustration-y7Mrr5CI9po","1"]
);

// Update Token 2
await contract.updateTokenMetadata(
    2,
    "Bitcoin #2",
    "a yellow plastic object sitting on top of a blue surface",
    "ipfs://QmNakYxMUict7y3jedkqwH6WnZQqTRV1dhTZ3p7vA257ba/images/2.jpg",
    ["Artist","Source","SourceLink","TokenId"],
    ["Muhammad Asyfaul","Unsplash","https://unsplash.com/photos/a-yellow-plastic-object-sitting-on-top-of-a-blue-surface-Zaa5wEaQdeA","2"]
);

// Update Token 3
await contract.updateTokenMetadata(
    3,
    "Eighties comics collection #3",
    "blue yellow and red abstract painting",
    "ipfs://QmNakYxMUict7y3jedkqwH6WnZQqTRV1dhTZ3p7vA257ba/images/3.jpg",
    ["Artist","Source","SourceLink","TokenId"],
    ["János Venczák","Unsplash","https://unsplash.com/photos/blue-yellow-and-red-abstract-painting-EmDe2QylecI","3"]
);

