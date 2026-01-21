import React, { useState, useEffect, useRef } from "react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";

const apiClient = new AdminAuthenticatedFetch("");

const ChangeLeverageModal = ({
  visible,
  onClose,
  accountId,
  currentLeverage,
  leverageOptions = [],
  onUpdate,
}) => {
  const modalRef = useRef(null);
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  const [step, setStep] = useState(1);
  const [newLeverage, setNewLeverage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setNewLeverage(currentLeverage ?? "");
    }
  }, [visible, currentLeverage]);

  useEffect(() => {
    // If currentLeverage doesn't match any option, default to first available option
    if (visible && leverageOptions && leverageOptions.length) {
      const matches = leverageOptions.map(String).includes(String(currentLeverage));
      if (!matches) {
        setNewLeverage((prev) => (prev ? prev : leverageOptions[0] || ""));
      }
    }
  }, [visible, currentLeverage, leverageOptions]);

  // Resolve account id robustly: accept number/string or object with `id`.
  const resolvedAccountId = (() => {
    if (!accountId) return null;
    // string or numeric id
    if (typeof accountId === "string") {
      const t = accountId.trim();
      if (t === "" || t === "undefined") return null;
      const onlyDigits = t.replace(/[^0-9]/g, "");
      if (onlyDigits && onlyDigits.length === String(t).length) return Number(t);
      if (!Number.isNaN(Number(t))) return Number(t);
      return t;
    }
    if (typeof accountId === "number") return accountId;
    if (typeof accountId === "object") {
      // common shapes
      const possible = ["id", "accountId", "account_id", "demoAccountId", "demo_account_id", "pk"];
      for (const k of possible) {
        if (accountId[k]) return accountId[k];
      }
      return null;
    }
    return null;
  })();

  useEffect(() => {
    // console.debug("ChangeLeverageModal: resolvedAccountId=", resolvedAccountId, "accountIdProp=", accountId);
  }, [resolvedAccountId, accountId]);

  /* ---------------- HELPERS ---------------- */
  const extractLeverageValue = (lev) => {
    if (!lev) return null;
    if (typeof lev === "number") return lev;
    if (typeof lev === "string" && lev.includes(":")) {
      return parseInt(lev.split(":")[1], 10);
    }
    return parseInt(lev, 10);
  };

  const openConfirm = () => {
    if (!newLeverage || newLeverage === currentLeverage) return;
    if (!resolvedAccountId) {
      alert("Account ID is missing. Cannot change leverage.");
      return;
    }
    setStep(2);
  };

  const confirmUpdate = async () => {
    if (!resolvedAccountId) {
      alert("Account ID is missing. Cannot update leverage.");
      return;
    }
    setLoading(true);
    try {
      const leverageValue = extractLeverageValue(newLeverage);
      if (!leverageValue || Number.isNaN(leverageValue)) {
        alert("Invalid leverage selected.");
        return;
      }
      // Use admin trading-account leverage endpoint for trading accounts
      await apiClient.post(`/api/admin/change-leverage/`, {
        account_id: resolvedAccountId,
        new_leverage: leverageValue,
      });
      onUpdate(newLeverage);
      onClose();
    } catch  {
      // console.error("Leverage update failed:", error);
      alert("Failed to update leverage");
    } finally {
      setLoading(false);
    }
  };

  const resetLeverage = async () => {
    if (!resolvedAccountId) {
      alert("Account ID is missing. Cannot reset leverage.");
      return;
    }
    setLoading(true);
    try {
      const leverageValue = extractLeverageValue(currentLeverage);
      if (!leverageValue || Number.isNaN(leverageValue)) {
        alert("Invalid leverage to reset to.");
        return;
      }
      // Reset uses same admin endpoint but sends current leverage as the new value
      await apiClient.post(`/api/admin/change-leverage/`, {
        account_id: resolvedAccountId,
        new_leverage: leverageValue,
      });
      setNewLeverage(currentLeverage);
      onUpdate(currentLeverage);
      onClose();
    } catch {
      // console.error("Reset leverage failed:", error);
      alert("Failed to reset leverage");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  /* ---------------- THEME CLASSES ---------------- */
  const modalBg = isDarkMode ? "bg-black" : "bg-white";
  const textMain = isDarkMode ? "text-white" : "text-black";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-600";
  const borderCls = isDarkMode ? "border-gray-700" : "border-gray-200";

  const selectCls = `
    w-full rounded-lg border px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-yellow-400
    ${isDarkMode
      ? "bg-black text-white border-yellow-400"
      : "bg-white text-black border-yellow-400"}
  `;

  const btnPrimary =
    "px-4 py-2 rounded-lg bg-yellow-400 text-black font-medium hover:brightness-95 transition";
  const btnGray =
    "px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3">
      <div
        ref={modalRef}
        className={`
          w-full max-w-md rounded-2xl shadow-2xl
          ${modalBg} ${borderCls} border
          max-h-[90vh] overflow-y-auto
        `}
      >
        {/* HEADER */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${borderCls}`}>
          <h3 className={`text-base sm:text-lg font-semibold ${textMain}`}>
            {step === 1 ? "Change Leverage" : "Confirm Leverage Change"}
          </h3>
          <button
            onClick={onClose}
            className={`text-xl ${textMuted} hover:${textMain}`}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-6 space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <p className={`text-sm ${textMuted}`}>
                Current Leverage:
                <span className={`ml-1 font-semibold ${textMain}`}>
                  {currentLeverage}
                </span>
              </p>

              <div>
                <label className={`block mb-1 text-sm font-medium ${textMuted}`}>
                  Select New Leverage
                </label>
                <select
                  className={selectCls}
                  value={newLeverage}
                  onChange={(e) => setNewLeverage(e.target.value)}
                >
                  <option value="" disabled>
                    Select leverage
                  </option>
                  {leverageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetLeverage}
                  disabled={loading || !currentLeverage}
                  className={btnGray + " disabled:opacity-50"}
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={openConfirm}
                  disabled={loading || !newLeverage || newLeverage === currentLeverage}
                  className={btnPrimary + " disabled:opacity-50"}
                >
                  Update
                </button>

                <button
                  onClick={onClose}
                  disabled={loading}
                  className={btnGray + " disabled:opacity-50"}
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="text-center space-y-3">
                <p className={`text-sm ${textMuted}`}>
                  You are about to change leverage
                </p>

                <p className={`text-base font-semibold ${textMain}`}>
                  {currentLeverage} → {newLeverage}
                </p>

                <p className={`text-sm ${textMuted}`}>
                  Account ID: <span className="font-medium">#{accountId}</span>
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={confirmUpdate}
                  disabled={loading}
                  className={btnPrimary + " disabled:opacity-50"}
                >
                  Confirm
                </button>

                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className={btnGray + " disabled:opacity-50"}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeLeverageModal;
