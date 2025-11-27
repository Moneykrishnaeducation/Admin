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
  const displayId = verifyRow?.id ?? verifyRow?.userId ?? verifyRow?.user_id ?? "";
  const [fetchedUser, setFetchedUser] = useState(null);
  const [verificationData, setVerificationData] = useState({
    id_document: { status: "loading", file_url: null, file_name: null },
    address_document: { status: "loading", file_url: null, file_name: null },
  });

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      const id = verifyRow?.id ?? verifyRow?.userId ?? verifyRow?.user_id;
      if (!id) return;
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;
      const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const endpoints = [
        `/users/${id}/`,
        `/api/admin/users/${id}`,
        `/api/users/${id}`,
      ];
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: "GET", credentials: "include", headers });
          if (resp && resp.ok) {
            const data = await resp.json();
            if (!cancelled) setFetchedUser(data);
            break;
          }
        } catch (err) {
          // try next
        }
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
          if (!cancelled) setVerificationData({
            id_document: { status: "error", file_url: null, file_name: null },
            address_document: { status: "error", file_url: null, file_name: null },
          });
        }
      } catch (err) {
        if (!cancelled) setVerificationData({
          id_document: { status: "error", file_url: null, file_name: null },
          address_document: { status: "error", file_url: null, file_name: null },
        });
      }
    }
    loadUser();
    loadVerification();
    return () => {
      cancelled = true;
    };
  }, [verifyRow]);

  const displayName =
    (fetchedUser && (fetchedUser.username || fetchedUser.name || `${fetchedUser.first_name || ""} ${fetchedUser.last_name || ""}`.trim())) ||
    verifyRow?.username ||
    verifyRow?.name ||
    `${verifyRow?.first_name || ""} ${verifyRow?.last_name || ""}`.trim() ||
    "User";
  const resolvedId = (fetchedUser && (fetchedUser.user_id ?? fetchedUser.id)) || displayId;
  return (
    <div id="docverificationModal" className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setVerifyModalOpen(false)}
      />
      <div
        className={`relative max-w-md w-full mx-4 rounded-lg shadow-xl ${modalBg} border ${
          isDarkMode ? "border-yellow-700" : "border-gray-200"
        }`}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-4 border-b docVerification-header"
          style={{ borderColor: isDarkMode ? "#b8860b33" : "#eee" }}
        >
          <div>
            <div
              className={`text-center font-bold ${
                isDarkMode ? "text-yellow-300" : "text-black"
              } text-lg verification-title`}
            >
              Document Verification for {displayName} ID: {" "}
              <span
                id="ib-user-id"
                className={`text-center font-extrabold ${
                  isDarkMode ? "text-yellow-400" : "text-yellow-600"
                } mt-1`}
              >
                {resolvedId}
              </span>
            </div>
          </div>
          <button
            className="p-1"
            onClick={() => setVerifyModalOpen(false)}
            aria-label="Close verify"
          >
            <X />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* ID Proof */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">ID Proof</div>
              <div className="flex items-center gap-2">
                {verificationData.id_document.status === "not_uploaded" && (
                  <div className="text-sm text-orange-500">• Not Uploaded</div>
                )}
                {verificationData.id_document.status === "uploaded" && (
                  <div className="text-sm text-green-500">• Uploaded</div>
                )}
                {verificationData.id_document.status === "verified" && (
                  <div className="text-sm text-blue-500">• Verified</div>
                )}
                {verificationData.id_document.status === "loading" && (
                  <div className="text-sm text-gray-500">• Loading...</div>
                )}
                {verificationData.id_document.status === "error" && (
                  <div className="text-sm text-red-500">• Error</div>
                )}
                {idMismatch && (
                  <div className="text-sm text-red-500">• Document Mismatch</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Preview uploaded ID Document */}
              {verificationData.id_document.file_url && (verificationData.id_document.status === "uploaded" || verificationData.id_document.status === "verified") && (
                <div className="flex flex-col space-y-2 mt-2">
                  <img
                    src={verificationData.id_document.file_url}
                    alt={verificationData.id_document.file_name || "ID Document"}
                    className="h-20 w-auto rounded border border-gray-300"
                  />
                  {verificationData.id_document.file_name && (
                    <div className="text-xs text-gray-500">{verificationData.id_document.file_name}</div>
                  )}
                </div>
              )}
              {/* Preview selected ID File */}
              {idFile && idFile.type.startsWith("image/") && (
                <div className="flex space-x-4 mt-2 overflow-x-auto">
                  <img
                    id="id-preview-img"
                    src={URL.createObjectURL(idFile)}
                    alt="ID Preview"
                    className="h-20 w-auto rounded border border-gray-300"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
              )}
              <label
                className={`flex-1 flex items-center justify-center rounded border border-dashed py-6 cursor-pointer ${
                  isDarkMode
                    ? "border-yellow-600 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <input
                  id="id-proof-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleIdSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="mb-2 text-sm">
                    {idFile ? idFile.name : "Select ID Proof"}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-yellow-300" : "text-gray-600"
                    }`}
                  >
                    Click to choose file
                  </div>
                </div>
              </label>

              <button
                id="id-upload-btn"
                onClick={handleUploadId}
                disabled={verificationData.id_document.status === "verified" || uploadingId}
                className={`flex-1 ${
                  uploadingId || verificationData.id_document.status === "verified" ? "opacity-70 pointer-events-none" : ""
                } px-4 py-3 rounded ${
                  verificationData.id_document.status === "verified"
                    ? "bg-green-500 text-white"
                    : isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                }`}
              >
                {uploadingId ? "Uploading..." : verificationData.id_document.status === "verified" ? "Verified" : "Upload"}
              </button>
            </div>
          </div>

          {/* Address Proof */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Address Proof</div>
              <div className="flex items-center gap-2">
                {verificationData.address_document.status === "not_uploaded" && (
                  <div className="text-sm text-orange-500">• Not Uploaded</div>
                )}
                {verificationData.address_document.status === "uploaded" && (
                  <div className="text-sm text-green-500">• Uploaded</div>
                )}
                {verificationData.address_document.status === "verified" && (
                  <div className="text-sm text-blue-500">• Verified</div>
                )}
                {verificationData.address_document.status === "loading" && (
                  <div className="text-sm text-gray-500">• Loading...</div>
                )}
                {verificationData.address_document.status === "error" && (
                  <div className="text-sm text-red-500">• Error</div>
                )}
                {addressMismatch && (
                  <div className="text-sm text-red-500">• Document Mismatch</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Preview uploaded Address Document */}
              {verificationData.address_document.file_url && (verificationData.address_document.status === "uploaded" || verificationData.address_document.status === "verified") && (
                <div className="flex flex-col space-y-2 mt-2">
                  <img
                    src={verificationData.address_document.file_url}
                    alt={verificationData.address_document.file_name || "Address Document"}
                    className="h-20 w-auto rounded border border-gray-300"
                  />
                  {verificationData.address_document.file_name && (
                    <div className="text-xs text-gray-500">{verificationData.address_document.file_name}</div>
                  )}
                </div>
              )}
              {/* Preview selected Address File */}
              {addressFile && addressFile.type.startsWith("image/") && (
                <div className="flex space-x-4 mt-2 overflow-x-auto">
                  <img
                    id="address-preview-img"
                    src={URL.createObjectURL(addressFile)}
                    alt="Address Preview"
                    className="h-20 w-auto rounded border border-gray-300"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
              )}

              <label
                className={`flex-1 flex items-center justify-center rounded border border-dashed py-6 cursor-pointer ${
                  isDarkMode
                    ? "border-yellow-600 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <input
                  id="address-proof-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAddressSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="mb-2 text-sm">
                    {addressFile ? addressFile.name : "Select Address Proof"}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-yellow-300" : "text-gray-600"
                    }`}
                  >
                    Click to choose file
                  </div>
                </div>
              </label>
              <button
                id="address-upload-btn"
                onClick={handleUploadAddress}
                disabled={verificationData.address_document.status === "verified" || uploadingAddress}
                className={`flex-1 ${
                  uploadingAddress || verificationData.address_document.status === "verified" ? "opacity-70 pointer-events-none" : ""
                } px-4 py-3 rounded ${
                  verificationData.address_document.status === "verified"
                    ? "bg-green-500 text-white"
                    : isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                }`}
              >
                {uploadingAddress ? "Uploading..." : verificationData.address_document.status === "verified" ? "Verified" : "Upload"}
              </button>
            </div>
          </div>

          {/* Hidden placeholders for legacy scripts that expect these IDs */}
          <div className="hidden">
            <a id="id-doc-link" href="#" />
            <button id="id-change-btn" />
            <button id="id-verify-btn" />
            <span id="id-status" />

            <a id="address-doc-link" href="#" />
            <button id="address-change-btn" />
            <button id="address-verify-btn" />
            <span id="address-status" />
          </div>

          <div className="flex justify-end gap-3 mt-2">
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

export default Verify;

// Exported helper for legacy scripts: adapted from legacy JS
export async function openVerificationModal(userId) {
  try {
    // Defensive: if userId is falsy, don't proceed — avoids runtime errors from empty calls
    if (!userId && userId !== 0) {
      // eslint-disable-next-line no-console
      console.warn("openVerificationModal called without userId, ignoring.");
      return;
    }
    const modal = document.getElementById("docverificationModal");
    if (modal) {
      modal.dataset.userId = userId;

      // Update the user ID display in modal header
      const userIdSpan = document.getElementById("ib-user-id");
      const headerElement = document.querySelector(
        ".docVerification-header .verification-title"
      );

      if (userIdSpan) {
        userIdSpan.textContent = userId;
      }

      // Try to fetch user details via helper or backend API
      let userDetails = null;
      

      // Update header text
      if (headerElement) {
        const displayName = (userDetails && (userDetails.username || `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim())) || "User";
        headerElement.innerHTML = `Document Verification for ${displayName} ID: <span class="userid" id="ib-user-id">${userId}</span>`;
      }

      // Store fetched user details on modal for other scripts if available
      try {
        if (modal && userDetails) {
          modal.dataset.user = JSON.stringify(userDetails);
        }
      } catch (err) {
        // ignore serialization errors
      }
      // Dispatch a global event so React components can react to legacy calls
      try {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new CustomEvent("openVerificationModal", { detail: { userId, userDetails } }));
        }
        // Also provide a direct hook for React if present
        if (typeof window !== "undefined" && typeof window.__openVerificationModalReact === "function") {
          try {
            window.__openVerificationModalReact(userId, userDetails);
          } catch (err) {
            // noop
          }
        }
      } catch (err) {
        // noop
      }
    }

    if (typeof toggleModal === "function") {
      try {
        toggleModal("docverificationModal", true);
      } catch (err) {
        // noop
      }
    }

    // Initialize document handlers if available
    if (typeof handleDocumentSection === "function") {
      try {
        handleDocumentSection(
          "id-proof-input",
          "id-preview-img",
          "id-doc-link",
          "id-upload-btn",
          "id-change-btn",
          "id-verify-btn",
          "id-status"
        );
        handleDocumentSection(
          "address-proof-input",
          "address-preview-img",
          "address-doc-link",
          "address-upload-btn",
          "address-change-btn",
          "address-verify-btn",
          "address-status"
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("handleDocumentSection error:", err);
      }
    }

    if (typeof loadUserVerificationStatus === "function") {
      try {
        await loadUserVerificationStatus(userId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("loadUserVerificationStatus error:", err);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("openVerificationModal error:", err);
  }
}

// Expose as global for legacy inline scripts that expect a global function
try {
  if (typeof window !== "undefined") {
    // Avoid overwriting if already set
    if (!window.openVerificationModal) window.openVerificationModal = openVerificationModal;
  }
} catch (err) {
  // ignore
}
