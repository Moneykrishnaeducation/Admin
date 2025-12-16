import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

const Verify = ({
  isDarkMode,
  modalBg,
  btnGhost,
  verifyRow,
  idFile,
  addressFile,
  idMismatch,
  addressMismatch,
  uploadingId,
  uploadingAddress,
  setVerifyModalOpen,
  handleIdSelect,
  handleAddressSelect,
  handleUploadId,
  handleUploadAddress,
}) => {
  const displayId =
    verifyRow?.id ?? verifyRow?.userId ?? verifyRow?.user_id ?? "";

  const [fetchedUser, setFetchedUser] = useState(null);
  const [verificationData, setVerificationData] = useState({
    id_document: { status: "loading", file_url: null, file_name: null },
    address_document: { status: "loading", file_url: null, file_name: null },
  });

  useEffect(() => {
    let cancelled = false;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("jwt_token") ||
          localStorage.getItem("access_token")
        : null;

    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const userId =
      verifyRow?.id ?? verifyRow?.userId ?? verifyRow?.user_id;

    if (!userId) return;

    async function loadUser() {
      try {
        const resp = await fetch(`/users/${userId}/`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) setFetchedUser(data);
        }
      } catch (_) {
        // silent fail
      }
    }

    async function loadVerification() {
      const id = verifyRow?.id ?? verifyRow?.userId ?? verifyRow?.user_id;
      if (!id) return;
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;
      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      try {
        const resp = await fetch(`/ib-user/${id}/verification/`, { method: "GET", credentials: "include", headers });
        if (resp && resp.ok) {
          const data = await resp.json();
          if (!cancelled) setVerificationData(data);
        } else {
          throw new Error("verification fetch failed");
        }
      } catch (_) {
        if (!cancelled) {
          setVerificationData({
            id_document: { status: "error", file_url: null, file_name: null },
            address_document: {
              status: "error",
              file_url: null,
              file_name: null,
            },
          });
        }
      }
    }

    loadUser();
    loadVerification();

    return () => {
      cancelled = true;
    };
  }, [verifyRow]);

  const displayName =
    fetchedUser?.username ||
    fetchedUser?.name ||
    `${fetchedUser?.first_name || ""} ${
      fetchedUser?.last_name || ""
    }`.trim() ||
    verifyRow?.username ||
    verifyRow?.name ||
    `${verifyRow?.first_name || ""} ${
      verifyRow?.last_name || ""
    }`.trim() ||
    "User";

  const resolvedId =
    fetchedUser?.user_id ?? fetchedUser?.id ?? displayId;

  return (
    <div
      id="docverificationModal"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setVerifyModalOpen(false)}
      />

      <div
        className={`relative max-w-md w-full mx-4 rounded-lg shadow-xl ${modalBg} border ${
          isDarkMode ? "border-yellow-700" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b docVerification-header"
          style={{ borderColor: isDarkMode ? "#b8860b33" : "#eee" }}
        >
          <div className="font-bold text-lg verification-title">
            Document Verification for {displayName} ID:{" "}
            <span
              id="ib-user-id"
              className={`font-extrabold ${
                isDarkMode
                  ? "text-yellow-400"
                  : "text-yellow-600"
              }`}
            >
              {resolvedId}
            </span>
          </div>

          <button
            className="p-1"
            onClick={() => setVerifyModalOpen(false)}
            aria-label="Close verify"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-6">
          {/* ========== ID PROOF ========== */}
          <DocumentSection
            title="ID Proof"
            data={verificationData.id_document}
            file={idFile}
            mismatch={idMismatch}
            isDarkMode={isDarkMode}
            onSelect={handleIdSelect}
            onUpload={handleUploadId}
            uploading={uploadingId}
            inputId="id-proof-input"
            previewId="id-preview-img"
          />

          {/* ========== ADDRESS PROOF ========== */}
          <DocumentSection
            title="Address Proof"
            data={verificationData.address_document}
            file={addressFile}
            mismatch={addressMismatch}
            isDarkMode={isDarkMode}
            onSelect={handleAddressSelect}
            onUpload={handleUploadAddress}
            uploading={uploadingAddress}
            inputId="address-proof-input"
            previewId="address-preview-img"
          />

          {/* Legacy placeholders */}
          <div className="hidden">
            <a id="id-doc-link" />
            <button id="id-change-btn" />
            <button id="id-verify-btn" />
            <span id="id-status" />

            <a id="address-doc-link" />
            <button id="address-change-btn" />
            <button id="address-verify-btn" />
            <span id="address-status" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className={`px-4 py-2 rounded ${btnGhost}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================= */
/* ================ DOCUMENT SECTION ======================= */
/* ========================================================= */

const DocumentSection = ({
  title,
  data,
  file,
  mismatch,
  isDarkMode,
  onSelect,
  onUpload,
  uploading,
  inputId,
  previewId,
}) => {
  const statusColor = {
    not_uploaded: "text-orange-500",
    uploaded: "text-green-500",
    verified: "text-blue-500",
    loading: "text-gray-500",
    error: "text-red-500",
  }[data.status];

  return (
    <div>
      <div className="flex justify-between mb-1">
        <div className="font-semibold">{title}</div>
        <div className={`text-sm ${statusColor}`}>
          • {data.status.replace("_", " ")}
          {mismatch && " • Document Mismatch"}
        </div>
      </div>

      {data.file_url && (
        <div className="mb-2">
          <img
            src={data.file_url}
            alt={data.file_name || title}
            className="h-20 rounded border"
          />
          <div className="text-xs text-gray-500">
            {data.file_name}
          </div>
        </div>
      )}

      {file && file.type.startsWith("image/") && (
        <img
          id={previewId}
          src={URL.createObjectURL(file)}
          alt="Preview"
          className="h-20 rounded border mb-2"
          onLoad={(e) =>
            URL.revokeObjectURL(e.currentTarget.src)
          }
        />
      )}

      <label
        className={`block border border-dashed rounded py-6 text-center cursor-pointer ${
          isDarkMode
            ? "border-yellow-600 bg-gray-800"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*,application/pdf"
          onChange={onSelect}
          className="hidden"
        />
        {file ? file.name : `Select ${title}`}
      </label>

      <button
        onClick={onUpload}
        disabled={data.status === "verified" || uploading}
        className={`w-full mt-2 py-3 rounded ${
          data.status === "verified"
            ? "bg-green-500 text-white"
            : isDarkMode
            ? "bg-yellow-500 text-black"
            : "bg-blue-600 text-white"
        }`}
      >
        {uploading
          ? "Uploading..."
          : data.status === "verified"
          ? "Verified"
          : "Upload"}
      </button>
    </div>
  );
};

export default Verify;

/* ========================================================= */
/* ================ LEGACY GLOBAL ========================== */
/* ========================================================= */

export async function openVerificationModal(userId) {
  if (!userId && userId !== 0) return;

  try {
    const modal = document.getElementById(
      "docverificationModal"
    );
    if (modal) modal.dataset.userId = userId;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("openVerificationModal", {
          detail: { userId },
        })
      );
    }
  } catch (err) {
    console.error("openVerificationModal error:", err);
  }
}

if (typeof window !== "undefined") {
  if (!window.openVerificationModal)
    window.openVerificationModal = openVerificationModal;
}
