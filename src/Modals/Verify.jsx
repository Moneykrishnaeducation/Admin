import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // ✅ THEME CONTEXT

/* ========================================================= */
/* ====================== MAIN MODAL ======================== */
/* ========================================================= */

const Verify = ({
  verifyRow,
  modalBg,
  btnGhost,
  setVerifyModalOpen,
  refreshActionPanelForUser,
}) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  const userId =
    verifyRow?.id ?? verifyRow?.user_id ?? verifyRow?.userId ?? "";

  const [userName, setUserName] = useState("User");

  const [docs, setDocs] = useState({
    id: initialDocState(),
    address: initialDocState(),
  });

  /* ================= AUTH HEADERS ================= */

  async function authHeaders() {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("jwt_token") ||
      localStorage.getItem("token");

    return {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /* ================= LOAD USER + STATUS ================= */

  useEffect(() => {
    if (!userId) return;
    loadUser();
    loadVerification();
  }, [userId]);

  async function loadUser() {
    try {
      const resp = await fetch(`/api/admin/user-info/${userId}/`, {
        method: "GET",
        credentials: "include",
        headers: await authHeaders(),
      });

      if (resp.ok) {
        const data = await resp.json();
        setUserName(
          data?.username ||
            data?.name ||
            `${data?.first_name || ""} ${data?.last_name || ""}`.trim() ||
            "User"
        );
      }
    } catch {}
  }

  async function loadVerification() {
    try {
      const resp = await fetch(
        `/api/admin/verification/status/${userId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: await authHeaders(),
        }
      );

      if (!resp.ok) throw new Error();

      const data = await resp.json();
      const documents = data?.data?.documents || {};

      setDocs({
        id: normalizeDoc(documents.identity),
        address: normalizeDoc(documents.residence),
      });
    } catch {
      setDocs({
        id: { ...initialDocState(), status: "error" },
        address: { ...initialDocState(), status: "error" },
      });
    }
  }

  /* ================= UPLOAD ================= */

  async function uploadDocument(type) {
    const doc = docs[type];
    if (!doc.file) return alert("Please select a file");

    const serverType = type === "id" ? "ID" : "Address";

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("document_type", serverType);
    formData.append(
      "filename_hint",
      type === "id" ? "idproof" : "addressproof"
    );
    formData.append("file", doc.file);

    updateDoc(type, { uploading: true });

    try {
      const resp = await fetch("/api/upload-document/", {
        method: "POST",
        headers: await authHeaders(),
        body: formData,
      });

      if (!resp.ok) throw new Error("Upload failed");

      updateDoc(type, {
        uploading: false,
        status: "pending",
        file: null,
      });

      await verifyDocument(type, true);
    } catch (err) {
      alert(err.message);
      updateDoc(type, { uploading: false });
    }
  }

  /* ================= VERIFY ================= */

  async function verifyDocument(type, auto = false) {
    const serverType = type === "id" ? "ID" : "Address";

    updateDoc(type, { verifying: true });

    try {
      const resp = await fetch(`/api/verify-document/${serverType}/`, {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!resp.ok) throw new Error("Verification failed");

      updateDoc(type, {
        status: "verified",
        verifying: false,
      });

      await loadVerification();
      refreshActionPanelForUser?.(userId);
    } catch {
      updateDoc(type, {
        status: auto ? "pending" : "uploaded",
        verifying: false,
      });
    }
  }

  function updateDoc(type, patch) {
    setDocs((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  }

  /* ================= UI ================= */

  // Consistent backdrop blur overlay for both themes
  const overlayCls =
    "absolute inset-0 bg-neutral-900/60 backdrop-blur-lg transition-all duration-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={overlayCls}
        onClick={() => setVerifyModalOpen(false)}
      />

      <div className={`relative max-w-lg w-full mx-2 rounded-lg shadow-xl ${modalBg}`}>
        {/* HEADER */}
        <div className="relative flex justify-between items-start p-3 sm:p-4 border-b">
          <div className="font-bold text-sm sm:text-base pr-8">
            Document Verification for {userName}{" "}
            <span className="text-yellow-500 block sm:inline">ID: {userId}</span>
          </div>
          <button onClick={() => setVerifyModalOpen(false)} className="absolute top-3 sm:top-4 right-3 sm:right-4 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <DocumentBlock
            title="ID Proof"
            doc={docs.id}
            type="id"
            onSelect={(file) => updateDoc("id", file)}
            onUpload={() => uploadDocument("id")}
            onVerify={() => verifyDocument("id")}
            isDarkMode={isDarkMode}
          />

          <DocumentBlock
            title="Address Proof"
            doc={docs.address}
            type="address"
            onSelect={(file) => updateDoc("address", file)}
            onUpload={() => uploadDocument("address")}
            onVerify={() => verifyDocument("address")}
            isDarkMode={isDarkMode}
          />

          <div className="text-center sm:text-right w-full">
            <button
              className={`${btnGhost} px-3 sm:px-4 py-2 rounded bg-yellow-500 text-black text-sm sm:text-base font-semibold`}
              onClick={() => setVerifyModalOpen(false)}
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
/* ================= DOCUMENT BLOCK ======================== */
/* ========================================================= */

function DocumentBlock({
  title,
  doc,
  type,
  onSelect,
  onUpload,
  onVerify,
  isDarkMode,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-2">
        <h4 className="font-semibold text-sm sm:text-base">{title}</h4>
        <span className={`text-xs sm:text-sm ${statusColor(doc.status)}`}>
          • {doc.status.replace("_", " ")}
        </span>
      </div>

      {doc.preview && (
        <img
          src={doc.preview}
          alt="preview"
          className="h-24 sm:h-40 w-full mb-2 border rounded"
        />
      )}

      {doc.file_url && !doc.preview && (
        <img
          src={doc.file_url}
          alt="preview"
          className="h-24 sm:h-40 w-full mb-2 border rounded"
        />
      )}

      <label
        className={`block border-dashed border rounded py-2 sm:py-4 text-center cursor-pointer text-xs sm:text-base ${
          isDarkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <input
          type="file"
          hidden
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (f.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onload = () =>
                onSelect({ file: f, preview: reader.result });
              reader.readAsDataURL(f);
            } else {
              onSelect({ file: f, preview: null });
            }
          }}
        />
        {doc.file?.name || `Select ${title}`}
      </label>

      <div className="flex gap-1 sm:gap-2 mt-2">
        <button
          className={`flex-1 py-2 rounded transition text-xs sm:text-sm font-semibold ${
            doc.status === "verified" || doc.status === "approved"
              ? "bg-green-600 text-white cursor-not-allowed opacity-75"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          disabled={!doc.file && (doc.status !== "verified" && doc.status !== "approved") || doc.verifying || doc.status === "verified" || doc.status === "approved"}
          onClick={async () => {
            await onUpload();
            await onVerify();
          }}
        >
          {doc.verifying 
            ? "Verifying..." 
            : (doc.status === "verified" || doc.status === "approved")
              ? "✅ Verified" 
              : "✅ Verify"}
        </button>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ===================== HELPERS =========================== */
/* ========================================================= */

function initialDocState() {
  return {
    status: "not_uploaded",
    file: null,
    preview: null,
    file_url: null,
    uploading: false,
    verifying: false,
  };
}

function normalizeDoc(doc) {
  if (!doc) return initialDocState();
  return {
    ...initialDocState(),
    status: doc.status || "uploaded",
    file_url: doc.file_url,
  };
}

function statusColor(status) {
  return {
    verified: "text-green-500",
    uploaded: "text-orange-500",
    pending: "text-orange-500",
    not_uploaded: "text-red-500",
    error: "text-red-600",
  }[status];
}

export default Verify;
