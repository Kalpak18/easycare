import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

// 10 MB ceiling for base64-encoded uploads (base64 is ~4/3 raw size)
const MAX_BASE64_BYTES = 10 * 1024 * 1024;

export async function uploadToCloudinary(file: string, folder = 'provider-kyc') {
  // Validate MIME from data URI header (e.g. "data:image/jpeg;base64,...")
  const mimeMatch = file.match(/^data:([^;]+);base64,/);
  if (!mimeMatch) {
    throw new BadRequestException('File must be a valid base64 data URI');
  }

  const mime = mimeMatch[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new BadRequestException('Only JPEG, PNG, WebP, and PDF files are allowed');
  }

  // Rough byte-size check on the base64 payload
  const base64Data = file.slice(file.indexOf(',') + 1);
  if (base64Data.length > MAX_BASE64_BYTES) {
    throw new BadRequestException('File exceeds the 10 MB limit');
  }

  const isPdf = mime === 'application/pdf';

  const result = await cloudinary.uploader.upload(file, {
    folder,
    resource_type: isPdf ? 'raw' : 'image',
  });

  return result.secure_url;
}