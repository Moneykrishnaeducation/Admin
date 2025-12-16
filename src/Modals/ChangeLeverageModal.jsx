import React, { useState, useEffect, useRef } from "react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch("");

const ChangeLeverageModal = ({
  visible,
  onClose,
  accountId,
  currentLeverage,        // e.g. "1:1000"
  leverageOptions = [],
  onUpdate,
}) => {
  const modalRef = useRef(null);

  const [step, setStep] = useState(1);
  const [newLeverage, setNewLeverage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setNewLeverage(currentLeverage);
    }
  }, [visible, currentLeverage]);

  /* ---------------- HELPERS ---------------- */

  // Extract numeric leverage: "1:1000" → 1000
  const extractLeverageValue = (lev) => {
    if (!lev) return null;
    if (typeof lev === "number") return lev;
    if (typeof lev === "string" && lev.includes(":")) {
      return parseInt(lev.split(":")[1], 10);
    }
    return parseInt(lev, 10);
  };

  /* ---------------- CONFIRM STEP ---------------- */
  const openConfirm = () => {
    if (!newLeverage || newLeverage === currentLeverage) return;
    setStep(2);
  };

  /* ---------------- UPDATE LEVERAGE ---------------- */
  const confirmUpdate = async () => {
    setLoading(true);
    try {
      const leverageValue = extractLeverageValue(newLeverage);

      await apiClient.post(
        `/api/demo_accounts/${accountId}/reset_leverage/`,
        { leverage: leverageValue }
      );

      onUpdate(newLeverage);
      onClose();
    } catch (error) {
      console.error("Leverage update failed:", error);
      alert("Failed to update leverage");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESET LEVERAGE (FIXED) ---------------- */
  const resetLeverage = async () => {
    setLoading(true);
    try {
      const leverageValue = extractLeverageValue(currentLeverage);

      await apiClient.post(
        `/api/demo_accounts/${accountId}/reset_leverage/`,
        {
          leverage: leverageValue, // ✅ REQUIRED BY BACKEND
        }
      );

      setNewLeverage(currentLeverage);
      onUpdate(currentLeverage);
      onClose();
    } catch (error) {
      console.error("Reset leverage failed:", error);
      alert("Failed to reset leverage");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-2">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md"
      >
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Change Leverage</h3>
              <button onClick={onClose} className="text-xl">×</button>
            </div>

            <p className="mb-3">
              Current Leverage: <strong>{currentLeverage}</strong>
            </p>

            <label className="block mb-1 text-sm font-medium">
              Select New Leverage
            </label>

            <select
              className="border p-2 rounded w-full mb-4"
              value={newLeverage}
              onChange={(e) => setNewLeverage(e.target.value)}
            >
              {leverageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={resetLeverage}
                disabled={loading}
              >
                Reset
              </button>

              <button
                className="px-4 py-2 bg-yellow-500 rounded"
                onClick={openConfirm}
                disabled={loading}
              >
                Update
              </button>

              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Confirm Leverage Change
              </h3>
              <button onClick={onClose} className="text-xl">×</button>
            </div>

            <p className="mb-5 text-center">
              Change leverage from{" "}
              <strong>{currentLeverage}</strong> to{" "}
              <strong>{newLeverage}</strong>?
            </p>

            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 bg-yellow-500 rounded"
                onClick={confirmUpdate}
                disabled={loading}
              >
                Confirm
              </button>

              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangeLeverageModal;
