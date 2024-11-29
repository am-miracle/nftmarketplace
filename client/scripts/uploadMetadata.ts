// uploadMetadata.ts
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface UnsplashImage {
    title: string;
    artist: string;
    imageUrl: string;
    description: string;
    unsplashLink: string;
}

interface ImageData {
    folderHash: string;
    images: UnsplashImage[];
}

interface TokenMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Record<string, string>;
}

class MetadataUploader {
    private readonly PINATA_API_KEY: string;
    private readonly PINATA_SECRET_KEY: string;
    private readonly basePath: string;
    private readonly metadataPath: string;

    constructor() {
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataSecretKey = process.env.PINATA_SECRET_KEY;

        if (!pinataApiKey || !pinataSecretKey) {
            throw new Error('Missing Pinata API credentials');
        }

        this.PINATA_API_KEY = pinataApiKey;
        this.PINATA_SECRET_KEY = pinataSecretKey;

        // Setup folder structure
        this.basePath = path.join(__dirname, 'collection');
        this.metadataPath = path.join(this.basePath, 'metadata');
        this.setupFolders();
    }

    private setupFolders() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath);
        }
        if (!fs.existsSync(this.metadataPath)) {
            fs.mkdirSync(this.metadataPath);
        }
    }

    private createMetadata(tokenId: number, imageData: UnsplashImage, imagesHash: string): TokenMetadata {
        return {
            name: `${imageData.title} #${tokenId}`,
            description: imageData.description,
            image: `ipfs://${imagesHash}/images/${tokenId}.jpg`,
            attributes: {
                "Artist": imageData.artist,
                "Source": "Unsplash",
                "SourceLink": imageData.unsplashLink,
                "TokenId": tokenId.toString()
            }
        };
    }

    private async uploadFolderToPinata(): Promise<string> {
        try {
            const formData = new FormData();
            
            // Add all files in the metadata folder
            const files = fs.readdirSync(this.metadataPath);
            for (const file of files) {
                const filePath = path.join(this.metadataPath, file);
                const fileStream = fs.createReadStream(filePath);
                formData.append('file', fileStream, { filepath: `metadata/${file}` });
            }

            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    maxBodyLength: Infinity,
                    headers: {
                        'pinata_api_key': this.PINATA_API_KEY,
                        'pinata_secret_api_key': this.PINATA_SECRET_KEY,
                        ...formData.getHeaders()
                    }
                }
            );

            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading folder to IPFS:', error);
            throw error;
        }
    }

    private generateContractUpdateScript(metadataHash: string, imageData: ImageData): void {
        let script = '// Contract Update Script\n\n';
        script += `// Set base URI first\n`;
        script += `await contract.setBaseURI("ipfs://${metadataHash}/metadata/");\n\n`;
        
        imageData.images.forEach((image, index) => {
            const tokenId = index + 1;
            const metadata = this.createMetadata(tokenId, image, imageData.folderHash);
            const attributeKeys = Object.keys(metadata.attributes);
            const attributeValues = attributeKeys.map(key => metadata.attributes[key]);
            
            script += `// Update Token ${tokenId}\n`;
            script += `await contract.updateTokenMetadata(\n`;
            script += `    ${tokenId},\n`;
            script += `    "${metadata.name}",\n`;
            script += `    "${metadata.description}",\n`;
            script += `    "${metadata.image}",\n`;
            script += `    ${JSON.stringify(attributeKeys)},\n`;
            script += `    ${JSON.stringify(attributeValues)}\n`;
            script += `);\n\n`;
        });

        fs.writeFileSync('updateMetadata.js', script);
    }

    public async uploadMetadata(): Promise<string> {
        try {
            // Read image data from file
            if (!fs.existsSync('imageData.json')) {
                throw new Error('imageData.json not found. Run uploadImages.ts first.');
            }

            const imageData: ImageData = JSON.parse(
                fs.readFileSync('imageData.json', 'utf-8')
            );

            console.log(`Creating metadata for ${imageData.images.length} tokens...`);

            // Create metadata files
            imageData.images.forEach((image, index) => {
                const tokenId = index + 1;
                const metadata = this.createMetadata(tokenId, image, imageData.folderHash);
                
                fs.writeFileSync(
                    path.join(this.metadataPath, `${tokenId}.json`),
                    JSON.stringify(metadata, null, 2)
                );
            });

            // Upload metadata folder
            console.log('\nUploading metadata folder to IPFS...');
            const metadataHash = await this.uploadFolderToPinata();
            console.log('Metadata folder uploaded successfully');

            // Generate contract update script
            this.generateContractUpdateScript(metadataHash, imageData);

            return metadataHash;
        } catch (error) {
            console.error('Error uploading metadata:', error);
            throw error;
        }
    }
}

async function main() {
    try {
        const uploader = new MetadataUploader();
        const metadataHash = await uploader.uploadMetadata();
        
        console.log('\nMetadata Upload Success! 🎉');
        console.log('\nMetadata Folder Hash:', metadataHash);
        console.log('Metadata Base URI:', `ipfs://${metadataHash}/metadata/`);
        console.log('View Metadata:', `https://gateway.pinata.cloud/ipfs/${metadataHash}/metadata`);
        console.log('\nContract update script has been generated: updateMetadata.js');
        
    } catch (error) {
        console.error('Main process failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default MetadataUploader;