// uploadImages.ts
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

class ImageUploader {
    private readonly PINATA_API_KEY: string;
    private readonly PINATA_SECRET_KEY: string;
    private readonly UNSPLASH_ACCESS_KEY: string;
    private readonly basePath: string;
    private readonly imagesPath: string;

    constructor() {
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataSecretKey = process.env.PINATA_SECRET_KEY;
        const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

        if (!pinataApiKey || !pinataSecretKey || !unsplashAccessKey) {
            throw new Error('Missing API credentials');
        }

        this.PINATA_API_KEY = pinataApiKey;
        this.PINATA_SECRET_KEY = pinataSecretKey;
        this.UNSPLASH_ACCESS_KEY = unsplashAccessKey;

        // Setup folder structure
        this.basePath = path.join(__dirname, 'collection');
        this.imagesPath = path.join(this.basePath, 'images');
        this.setupFolders();
    }

    private setupFolders() {
        if (fs.existsSync(this.basePath)) {
            fs.rmSync(this.basePath, { recursive: true });
        }
        fs.mkdirSync(this.basePath);
        fs.mkdirSync(this.imagesPath);
    }

    private async getCartoonImage(): Promise<UnsplashImage> {
        try {
            const response = await axios.get('https://api.unsplash.com/photos/random', {
                params: {
                    query: 'cartoons',
                    orientation: 'landscape',
                    content_filter: 'high'
                },
                headers: {
                    Authorization: `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
                }
            });

            return {
                title: response.data.description || 'Cartoon Character',
                artist: response.data.user.name,
                imageUrl: response.data.urls.regular,
                description: response.data.alt_description || 'Cartoon character illustration',
                unsplashLink: response.data.links.html
            };
        } catch (error) {
            console.error('Error fetching from Unsplash:', error);
            throw error;
        }
    }

    private async saveImage(imageUrl: string, index: number): Promise<void> {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imagePath = path.join(this.imagesPath, `${index}.jpg`);
        fs.writeFileSync(imagePath, Buffer.from(response.data));
    }

    private async uploadFolderToPinata(): Promise<string> {
        try {
            const formData = new FormData();
            
            // Add all files in the images folder
            const files = fs.readdirSync(this.imagesPath);
            for (const file of files) {
                const filePath = path.join(this.imagesPath, file);
                const fileStream = fs.createReadStream(filePath);
                formData.append('file', fileStream, { filepath: `images/${file}` });
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

    public async uploadImages(numberOfImages: number = 5): Promise<{ 
        folderHash: string, 
        images: UnsplashImage[] 
    }> {
        try {
            console.log(`Starting image upload (${numberOfImages} images)...`);
            const imageDataArray: UnsplashImage[] = [];

            // Download and save all images
            for (let i = 1; i <= numberOfImages; i++) {
                console.log(`\nProcessing image ${i}/${numberOfImages}`);
                const imageData = await this.getCartoonImage();
                await this.saveImage(imageData.imageUrl, i);
                imageDataArray.push(imageData);
                console.log('Saved image:', imageData.title);
            }

            // Upload the entire images folder
            console.log('\nUploading images folder to IPFS...');
            const folderHash = await this.uploadFolderToPinata();
            console.log('Images folder uploaded successfully');

            // Save image data for metadata creation
            const resultData = {
                folderHash,
                images: imageDataArray
            };
            fs.writeFileSync('imageData.json', JSON.stringify(resultData, null, 2));

            return resultData;
        } catch (error) {
            console.error('Error uploading images:', error);
            throw error;
        }
    }
}

async function main() {
    try {
        const uploader = new ImageUploader();
        const result = await uploader.uploadImages(3);
        
        console.log('\nImage Upload Success! 🎉');
        console.log('\nFolder Hash:', result.folderHash);
        console.log('Images folder URL:', `https://gateway.pinata.cloud/ipfs/${result.folderHash}/images`);
        console.log('\nImage data saved to imageData.json');
        console.log('Run uploadMetadata.ts next to complete the process.');
        
    } catch (error) {
        console.error('Main process failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default ImageUploader;