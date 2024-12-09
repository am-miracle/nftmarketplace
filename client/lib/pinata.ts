import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

export async function uploadToPinata(file: File) {
    if (!file) return null;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const metadata = JSON.stringify({
            name: file.name,
        });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', options);

        const res = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                    ...formData.getHeaders()
                },
            }
        );

        const ipfsHash = res.data.IpfsHash;
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        
        return {
            hash: ipfsHash,
            url: imageUrl
        };
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        throw new Error('Failed to upload image to IPFS');
    }
}

export async function uploadMetadataToPinata(metadata: any) {
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            hash: response.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        };
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);
        throw new Error('Failed to upload metadata to IPFS');
    }
}