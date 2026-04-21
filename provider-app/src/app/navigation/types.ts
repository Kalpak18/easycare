import { DocumentType } from '../../types/kyc';

export type KycStackParamList = {
  KycIntro: undefined;
  KycStatus: undefined;
  UploadDocument: {
    type: DocumentType;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  Otp: { contact: string; method: 'phone' | 'email' };
  CompleteProfile: { contact: string; method: 'phone' | 'email' };
};


export type JobsStackParamList = {
  JobsList: undefined;
  JobDetails: {
    requestId: string;
  };
};