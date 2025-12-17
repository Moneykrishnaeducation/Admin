import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const AlgoTradingModal = ({ visible, onClose, accountId, onProceed }) => {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState("");
  const modalRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (visible) {
      setStep(1);
      setAction("");
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const handleProceed = () => {
    if (!action) return;
    setStep(2);
  };

  const handleConfirm = () => {
    onProceed(action);
    onClose();
  };

  if (!visible) return null;

  /* ---------------- THEME CLASSES ---------------- */

  const overlay = "bg-black/70 backdrop-blur-sm";

  const modalBg = isDarkMode ? "bg-black" : "bg-white";
  const border = isDarkMode ? "border-white/10" : "border-gray-200";

  const title = isDarkMode ? "text-yellow-400" : "text-gray-900";
  const text = isDarkMode ? "text-gray-400" : "text-gray-600";
  const strong = isDarkMode ? "text-white" : "text-gray-900";

  const input =
    isDarkMode
      ? "bg-black border-yellow-400 text-white"
      : "bg-white border-gray-300 text-black";

  const btnPrimary =
    "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-400";

  const btnSecondary = isDarkMode
    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
    : "bg-gray-200 text-gray-700 hover:bg-gray-300";

  /* ---------------- RENDER ---------------- */

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlay} px-4`}>
      <div
        ref={modalRef}
        className={`
          w-full max-w-md
          ${modalBg}
          rounded-2xl shadow-2xl
          border ${border}
          max-h-[85vh]
          overflow-hidden
          animate-[scaleIn_0.2s_ease-out]
        `}
      >
        {/* HEADER (STICKY) */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${border} ${modalBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${title}`}>
              {step === 1 ? "Algo Trading Settings" : "Confirm Action"}
            </h3>
            <button
              onClick={onClose}
              className={`text-xl ${text} hover:${strong}`}
            >
              ×
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto overscroll-contain">
          {step === 1 && (
            <>
              <p className={`text-sm ${text}`}>
                Manage algo trading for account
                <span className={`font-medium ${strong}`}> #{accountId}</span>
              </p>

              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className={`
                  w-full rounded-xl px-4 py-3 text-sm
                  border ${input}
                  focus:outline-none focus:ring-2
                `}
              >
                <option value="" disabled>
                  Select Action
                </option>
                <option value="enable">Enable Algo</option>
                <option value="disable">Disable Algo</option>
              </select>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl text-sm transition ${btnSecondary}`}
                >
                  Close
                </button>

                <button
                  onClick={handleProceed}
                  className={`px-5 py-2.5 rounded-xl text-sm transition focus:ring-2 ${btnPrimary}`}
                >
                  Proceed
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center space-y-3">
                <p className={`text-sm ${text}`}>
                  Are you sure you want to
                </p>

                <p className={`text-lg font-semibold ${strong}`}>
                  {action.toUpperCase()} Algo Trading
                </p>

                <p className={`text-sm ${text}`}>
                  for account
                  <span className={`font-medium ${strong}`}> #{accountId}</span>?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <button
                  onClick={handleConfirm}
                  className={`px-5 py-2.5 rounded-xl text-sm transition focus:ring-2 ${btnPrimary}`}
                >
                  Confirm
                </button>

                <button
                  onClick={() => setStep(1)}
                  className={`px-5 py-2.5 rounded-xl text-sm transition ${btnSecondary}`}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ANIMATION */}
      <style>
        {`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AlgoTradingModal;
