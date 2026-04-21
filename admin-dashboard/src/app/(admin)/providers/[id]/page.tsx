"use client"

import { useParams } from "next/navigation"
import { useProvider } from "../../../../hooks/useProviders"
import { useQueryClient } from "@tanstack/react-query"
import ProviderProfile from "../../../../components/providers/ProviderProfile"
import KycDocuments from "../../../../components/providers/KycDocuments"

export default function ProviderDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const qc = useQueryClient()

  const { data, isLoading } = useProvider(id)

  const refresh = () => qc.invalidateQueries({ queryKey: ["provider", id] })

  if (isLoading) return <div className="text-gray-400 p-8">Loading provider...</div>

  return (
    <div className="space-y-6">
      <ProviderProfile provider={data} />
      <KycDocuments documents={data?.documents ?? []} onRefresh={refresh} />
    </div>
  )
}