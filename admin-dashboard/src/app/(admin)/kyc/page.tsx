"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { usePendingKyc } from "../../../hooks/useKyc";
import { kycService } from "../../../services/kyc.service";

const DOC_LABEL: Record<string, string> = {
  PROFILE_PHOTO: "Profile Photo",
  AADHAAR_FRONT: "Aadhaar Front",
  AADHAAR_BACK: "Aadhaar Back",
  PAN_CARD: "PAN Card",
  BANK_PROOF: "Bank Proof",
  SKILL_CERTIFICATE: "Skill Certificate",
  POLICE_VERIFICATION: "Police Verification",
  DRIVING_LICENSE: "Driving License",
  VEHICLE_RC: "Vehicle RC",
  VEHICLE_INSURANCE: "Vehicle Insurance",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function KycPage() {
  const { data, isLoading, error } = usePendingKyc();
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: kycService.approveDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-pending"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kycService.rejectDocument(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-pending"] });
      setRejectingId(null);
      setRejectReason("");
    },
  });

  if (isLoading) return <div className="text-gray-400">Loading…</div>;
  if (error) return <div className="text-red-500">Failed to load KYC data.</div>;
  if (!data || data.length === 0)
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-2">✅</div>
        <div className="font-semibold">No pending KYC reviews</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending KYC Reviews</h1>

      {data.map((provider: { providerId: string; name: string; phone: string; pendingCount: number; documents?: { id: string; type: string; status: string; fileUrl?: string; rejectionReason?: string }[] }) => (
        <div key={provider.providerId} className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* Provider header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-gray-900">{provider.name}</div>
              <div className="text-sm text-gray-500">{provider.phone}</div>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
              {provider.pendingCount} pending
            </span>
          </div>

          {/* Documents */}
          <div className="divide-y">
            {provider.documents?.map((doc: { id: string; type: string; status: string; fileUrl?: string; rejectionReason?: string }) => (
              <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800">
                    {DOC_LABEL[doc.type] ?? doc.type}
                  </div>
                  {doc.rejectionReason && (
                    <div className="text-xs text-red-500 mt-0.5">{doc.rejectionReason}</div>
                  )}
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[doc.status] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {doc.status}
                </span>

                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline whitespace-nowrap"
                  >
                    View
                  </a>
                )}

                {doc.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(doc.id)}
                      disabled={approveMutation.isPending}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(doc.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg space-y-4">
            <div className="text-lg font-bold">Reject Document</div>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none"
              rows={3}
              placeholder="Enter reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate({ id: rejectingId, reason: rejectReason })
                }
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-2 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 px-6"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
