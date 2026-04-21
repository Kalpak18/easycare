export type AuthStackParamList = {
  Login: undefined;
  Otp: { contact: string; method: 'phone' | 'email' };
  CompleteProfile: { contact: string; method: 'phone' | 'email' };
};

export type CustomerTabParamList = {
  Home: undefined;
  MyRequests: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  NearbyProviders: { categoryId: string; categoryName: string };
  CreateRequest: {
    categoryId: string;
    categoryName: string;
    preferredSource?: 'MARKETPLACE' | 'COMPANY';
  };
};

export type RequestStackParamList = {
  MyRequestsList: undefined;
  RequestDetail: { requestId: string };
};
