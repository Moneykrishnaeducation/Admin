import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch("");

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

  // --------------------------------------------------
  // SYNC ACTION PROP → LOCAL STATE
  // --------------------------------------------------
  useEffect(() => {
    if (!action) return;
    setLocalAction(
      action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()
    );
  }, [action]);

  if (!visible) return null;

  // --------------------------------------------------
  // TOGGLE ENABLE / DISABLE
  // --------------------------------------------------
  const toggleAction = () => {
    const next = localAction === "Enable" ? "Disable" : "Enable";
    setLocalAction(next);
    if (onActionChange) onActionChange(next);
  };

  // --------------------------------------------------
  // CONFIRM ACTION
  // --------------------------------------------------
  const handleConfirm = async () => {
    setError("");
    setLoading(true);

    try {
      // normalize action for backend
      let normalizedAction = localAction.toLowerCase();
      if (!["enable", "disable"].includes(normalizedAction)) {
        normalizedAction = normalizedAction.includes("enable")
          ? "enable"
          : "disable";
      }

      const payload = {
        accountId: accountId,
        action: normalizedAction,
      };

      const data = await apiClient.post(
        "/api/admin/toggle-account-status/",
        payload
      );

      // notify parent
      if (onStatusUpdated) {
        onStatusUpdated({
          account_id: data.account_id,
          is_enabled: data.is_enabled,
        });
      }

      onClose();
    } catch (err) {
      setError(err.message || "Unable to update account status");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // MODAL FOOTER
  // --------------------------------------------------
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className={`
          px-5 py-2 rounded-lg font-semibold shadow
          transition disabled:opacity-50 disabled:cursor-not-allowed
          ${
            localAction === "Enable"
              ? "bg-green-400 hover:bg-green-500 text-black"
              : "bg-red-400 hover:bg-red-500 text-black"
          }
        `}
      >
        {loading ? "Processing..." : localAction}
      </button>

      <button
        onClick={onClose}
        disabled={loading}
        className="
          bg-gray-200 text-gray-800
          px-5 py-2 rounded-lg
          hover:bg-gray-300 transition
        "
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
      <div className="space-y-6">

        {/* STATUS TOGGLE */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-medium">
            Account Status
          </span>

          <button
            onClick={toggleAction}
            className={`
              relative w-16 h-8 rounded-full transition
              ${localAction === "Enable" ? "bg-green-500" : "bg-red-500"}
            `}
          >
            <span
              className={`
                absolute top-1 h-6 w-6 bg-white rounded-full transition
                ${localAction === "Enable" ? "left-1" : "right-1"}
              `}
            />
          </button>
        </div>

        {/* CONFIRM MESSAGE */}
        <p className="text-gray-200">
          Are you sure you want to{" "}
          <span className="text-yellow-400 font-semibold">
            {localAction}
          </span>{" "}
          this account?
        </p>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="text-red-500 text-sm font-medium">
            {error}
          </p>
        )}
      </div>
    </ModalWrapper>
  );
};

export default DisableModal;
