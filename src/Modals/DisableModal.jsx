import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";

const DisableModal = ({
  visible,
  onClose,
  accountId,
  action,
  onActionChange,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!visible) return null;

  // ============ GET CSRF TOKEN ============
  const getCsrfToken = async () => {
    try {
      const res = await fetch("/api/csrf/", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      if (data?.csrfToken) return data.csrfToken;

      throw new Error("Failed to fetch CSRF token");
    } catch (err) {
      console.error("CSRF ERROR:", err);
      throw err;
    }
  };

  // ============ CONFIRM BUTTON HANDLER ============
  const handleConfirm = async () => {
    setError("");
    setLoading(true);

    try {
      const csrfToken = await getCsrfToken();

      const res = await fetch("/api/admin/toggle-account-status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          account_id: accountId,
          action: action.toLowerCase(), // enable / disable
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Server error");

      // Notify parent to refresh table or update UI
      if (onStatusUpdated) {
        onStatusUpdated({
          account_id: data.account_id,
          is_enabled: data.is_enabled,
        });
      }

      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title={`Account ${accountId}`} visible={visible} onClose={onClose}>
      <div className="mb-6">
        {/* Toggle Button */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300">Status:</span>

          <button
            onClick={onActionChange}
            className={`relative w-16 h-8 rounded-full transition ${
              action === "Enable" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <div
              className={`absolute top-1 h-6 w-6 bg-white rounded-full transition ${
                action === "Enable" ? "left-1" : "right-1"
              }`}
            ></div>
          </button>
        </div>

        {/* Confirmation Message */}
        <p className="mb-6">
          Are you sure you want to{" "}
          <span className="text-yellow-400 font-medium">{action}</span> this account?
        </p>

        {/* Error */}
        {error && (
          <p className="text-red-400 mb-4 text-sm">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded text-black transition ${
              action === "Enable"
                ? "bg-green-400 hover:bg-green-500"
                : "bg-red-400 hover:bg-red-500"
            }`}
          >
            {loading ? "Processing..." : action}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DisableModal;
