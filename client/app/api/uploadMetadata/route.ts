

// const PINATA_API_KEY = process.env.PINATA_API_KEY;
// const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// export async function POST(request: Request) {
//   try {
//     const metadata = await request.json();

//     const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'pinata_api_key': PINATA_API_KEY!,
//         'pinata_secret_api_key': PINATA_SECRET_KEY!,
//       },
//       body: JSON.stringify(metadata),
//     });

//     const json = await res.json();
//     const metadataUrl = `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;

//     return NextResponse.json({ url: metadataUrl });
//   } catch (error) {
//     console.error('Error uploading metadata to Pinata:', error);
//     return NextResponse.json(
//       { error: 'Failed to create metadata' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

// Define interfaces for the metadata and Pinata response
interface Metadata {
  name: string;
  description: string;
  image: string;
  attributes?: Record<string, string | number>;
}

interface PinataResponse {
  IpfsHash: string;
}

export async function POST(request: Request) {
  try {
    // Parse and validate metadata
    const metadata: Metadata = await request.json()

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      return NextResponse.json(
        { error: 'Missing required metadata fields' },
        { status: 400 }
      )
    }

    // Create the proper metadata object structure
    const pinataMetadata = {
      name: `${metadata.name} Metadata`
    }

    const pinataOptions = {
      cidVersion: 1
    }

    const data = {
      pinataContent: {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes || []
      },
      pinataMetadata: pinataMetadata,
      pinataOptions: pinataOptions
    }

    console.log('Sending metadata to Pinata:', JSON.stringify(data, null, 2))

    try {
      const response = await axios.post<PinataResponse>(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': process.env.PINATA_API_KEY!,
            'pinata_secret_api_key': process.env.PINATA_SECRET_KEY!,
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          },
        }
      )

      return NextResponse.json({
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      })

    } catch (error) {
      // More specific error handling for Axios errors
      if (error instanceof AxiosError) {
        console.error('Pinata API error:', error.response?.data || error.message)
        return NextResponse.json(
          { 
            error: 'Metadata upload failed', 
            details: error.response?.data || error.message
          },
          { status: error.response?.status || 500 }
        )
      }

      // Handle other types of errors
      throw error
    }

  } catch (error) {
    // Generic error handling for parsing or other unexpected errors
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Metadata processing failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}