import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { requestsService } from "../services/requests.service"

export const useRequests = () => {
  return useQuery({
    queryKey: ["requests"],
    queryFn: requestsService.getRequests,
  })
}

export const useCancelRequest = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: requestsService.cancelRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] })
    },
  })
}