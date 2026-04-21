/* eslint-disable @next/next/no-img-element */
"use client";

import { KycDocument } from "../../types/kyc";
import { kycService } from "../../services/kyc.service";

export default function KycDocuments({
  documents,
}: {
  documents: KycDocument[];
}) {
  const approve = async (id: string) => {
    await kycService.approveDocument(id);
    alert("Document approved");
  };

  const reject = async (id: string) => {
    await kycService.rejectDocument(id);
    alert("Document rejected");
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-white p-4 rounded-xl shadow">
          <img
            src={doc.url}
            alt={doc.type}
            className="w-full h-48 object-cover rounded"
          />

          <div className="mt-3 text-sm font-medium">{doc.type}</div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => approve(doc.id)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Approve
            </button>

            <button
              onClick={() => reject(doc.id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}