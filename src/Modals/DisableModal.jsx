import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('');

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
  const [localAction, setLocalAction] = useState(action);

  // Sync prop action with local state
  useEffect(() => {
    if (!action) return;
    setLocalAction(action.charAt(0).toUpperCase() + action.slice(1).toLowerCase());
  }, [action]);

  if (!visible) return null;

  // Toggle between Enable/Disable in UI
  const toggleAction = () => {
    const newAction = localAction === "Enable" ? "Disable" : "Enable";
    setLocalAction(newAction);
    if (onActionChange) onActionChange(newAction);
  };

  // Confirm button handler
const handleConfirm = async () => {
  setError("");
  setLoading(true);

  try {
    // Normalize action: only "enable" or "disable"
    let normalizedAction = localAction.toLowerCase();
    if (!["enable", "disable"].includes(normalizedAction)) {
      // fallback if localAction has extra text like "enable account"
      normalizedAction = normalizedAction.includes("enable") ? "enable" : "disable";
    }

    const payload = {
      accountId: accountId,       // exact camelCase as backend
      action: normalizedAction,   // only "enable" or "disable"
    };

    const data = await apiClient.post("/api/admin/toggle-account-status/", payload);

    if (onStatusUpdated) {
      onStatusUpdated({
        account_id: data.account_id,
        is_enabled: data.is_enabled,
      });
    }

    setLoading(false);
    onClose();
  } catch (err) {
    setError(err.message || "Something went wrong");
    setLoading(false);
  }
};

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className={`px-4 py-2 rounded shadow text-black ${
          localAction === "Enable"
            ? "bg-green-400 hover:bg-green-500"
            : "bg-red-400 hover:bg-red-500"
        }`}
      >
        {loading ? "Processing..." : localAction}
      </button>

      <button
        onClick={onClose}
        disabled={loading}
        className="bg-gray-200 px-4 py-2 rounded"
      >
        Cancel
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Account ${accountId}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Status</span>
          <button
            onClick={toggleAction}
            className={`relative w-16 h-8 rounded-full transition ${
              localAction === "Enable" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <div
              className={`absolute top-1 h-6 w-6 bg-white rounded-full transition ${
                localAction === "Enable" ? "left-1" : "right-1"
              }`}
            ></div>
          </button>
        </div>

        {/* Confirmation message */}
        <p>
          Are you sure you want to{" "}
          <span className="text-yellow-500 font-semibold">{localAction}</span> this
          account?
        </p>

        {/* Error display */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </ModalWrapper>
  );
};

export default DisableModal;
