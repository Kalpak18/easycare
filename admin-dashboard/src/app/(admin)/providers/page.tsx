"use client"

import ProvidersTable from "../../../components/providers/ProvidersTable"
import { useProviders } from "../../../hooks/useProviders"

export default function ProvidersPage() {
  const { data, isLoading } = useProviders()

  if (isLoading) return <div>Loading providers...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Providers</h1>

      <ProvidersTable providers={data ?? []} />
    </div>
  )
}