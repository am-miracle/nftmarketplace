import { NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const metadata = await request.json();

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_SECRET_KEY!,
      },
      body: JSON.stringify(metadata),
    });

    const json = await res.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;

    return NextResponse.json({ url: metadataUrl });
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    return NextResponse.json(
      { error: 'Failed to create metadata' },
      { status: 500 }
    );
  }
}