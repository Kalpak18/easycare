import { useQuery } from "@tanstack/react-query";
import { kycService } from "../services/kyc.service";

export const usePendingKyc = () => {
  return useQuery({
    queryKey: ["kyc-pending"],
    queryFn: kycService.getPendingProviders,
  });
};

export const useProviderKyc = (providerId: string) => {
  return useQuery({
    queryKey: ["provider-kyc", providerId],
    queryFn: () => kycService.getProviderKyc(providerId),
    enabled: !!providerId,
  });
};