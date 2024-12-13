// import { NextResponse } from 'next/server';

// const PINATA_API_KEY = process.env.PINATA_API_KEY;
// const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// export async function POST(request: Request) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file') as File;
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     const data = new FormData();
//     data.append('file', new Blob([buffer]), file.name);

//     const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
//       method: 'POST',
//       headers: {
//         'pinata_api_key': PINATA_API_KEY!,
//         'pinata_secret_api_key': PINATA_SECRET_KEY!,
//       },
//       body: data,
//     });

//     const json = await res.json();
//     const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;

//     return NextResponse.json({ url: ipfsUrl });
//   } catch (error) {
//     console.error('Error uploading to Pinata:', error);
//     return NextResponse.json(
//       { error: 'Failed to upload file' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from 'next/server'
import FormData from 'form-data'
import axios from 'axios'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create form data for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${pinataFormData.getBoundary()}`,
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    )

    return NextResponse.json({
      ipfsHash: response.data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}