import { api } from './api';
import { ProviderDocument } from '../types/kyc';

export const KycService = {
  async getMyDocuments(): Promise<ProviderDocument[]> {
    const res = await api.get('/providers/kyc/documents');
    return res.data;
  },

  async uploadDocument(type: string, base64Image: string) {
    // Step 1: upload raw file to Cloudinary via backend
    const uploadRes = await api.post('/providers/kyc/upload-file', {
      image: base64Image,
    });
    const fileUrl: string = uploadRes.data.fileUrl;

    // Step 2: save the document record
    return api.post('/providers/kyc/upload', { type, fileUrl });
  },
};
