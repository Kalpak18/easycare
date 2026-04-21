/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { kycService } from "../../services/kyc.service";

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

function isPdf(url: string) {
  return (
    url?.toLowerCase().includes(".pdf") ||
    url?.toLowerCase().includes("/raw/upload/")
  );
}

export default function KycDocuments({ documents, onRefresh }: { documents: any[]; onRefresh?: () => void }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approve = async (id: string) => {
    setLoadingId(id);
    await kycService.approveDocument(id);
    setLoadingId(null);
    onRefresh?.();
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    setLoadingId(rejectingId);
    await kycService.rejectDocument(rejectingId, rejectReason);
    setLoadingId(null);
    setRejectingId(null);
    setRejectReason("");
    onRefresh?.();
  };

  if (!documents?.length) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6 text-center text-gray-400">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">KYC Documents</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {documents.map((doc) => {
          const url: string = doc.fileUrl ?? "";
          const pdf = isPdf(url);

          return (
            <div key={doc.id} className="border rounded-xl overflow-hidden flex flex-col">
              {/* Preview */}
              <div className="relative bg-gray-100 h-44 flex items-center justify-center">
                {url ? (
                  pdf ? (
                    /* PDF: show icon card, clicking opens raw PDF directly */
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-full h-full gap-2 text-red-500 hover:bg-red-50 transition"
                    >
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-600">PDF — Click to Open</span>
                    </a>
                  ) : (
                    /* Image: click to open full size */
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={url}
                        alt={doc.type}
                        className="w-full h-full object-cover hover:opacity-90 transition"
                      />
                    </a>
                  )
                ) : (
                  <span className="text-xs text-gray-400">No file</span>
                )}

                {/* Open button overlay */}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-xs px-2 py-1 rounded shadow text-blue-600 font-medium hover:bg-white"
                  >
                    Open ↗
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {DOC_LABEL[doc.type] ?? doc.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[doc.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {doc.status}
                  </span>
                </div>

                {doc.rejectionReason && (
                  <p className="text-xs text-red-500">{doc.rejectionReason}</p>
                )}

                {doc.status === "PENDING" && (
                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={() => approve(doc.id)}
                      disabled={loadingId === doc.id}
                      className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {loadingId === doc.id ? "…" : "Approve"}
                    </button>
                    <button
                      onClick={() => { setRejectingId(doc.id); setRejectReason(""); }}
                      disabled={loadingId === doc.id}
                      className="flex-1 py-1.5 text-xs bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg space-y-4">
            <div className="text-lg font-bold">Reject Document</div>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Enter reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || !!loadingId}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
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
