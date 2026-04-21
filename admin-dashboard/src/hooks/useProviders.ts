import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { providersService } from "../services/providers.service"

export const useProviders = () => {
  return useQuery({
    queryKey: ["providers"],
    queryFn: providersService.getProviders
  })
}

export const useVerifyProvider = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: providersService.verifyProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] })
    }
  })
}

export const useBlockProvider = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: providersService.blockProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] })
    }
  })
}

export const useUnblockProvider = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: providersService.unblockProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] })
    }
  })
}

export const useProvider = (id: string) => {
  return useQuery({
    queryKey: ["provider", id],
    queryFn: () => providersService.getProvider(id),
    enabled: !!id
  })
}