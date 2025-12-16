import React, { useState, useEffect, useRef } from "react";

const AlgoTradingModal = ({ visible, onClose, accountId, onProceed }) => {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setAction("");
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3">
      <div
        ref={modalRef}
        className="
          w-full max-w-md
          bg-white rounded-xl shadow-2xl
          max-h-[90vh] overflow-y-auto
          transition-all
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {step === 1 ? "Algo Trading Settings" : "Confirm Action"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-6 space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <p className="text-sm text-gray-600">
                Manage algo trading for account
                <span className="font-medium text-gray-900"> #{accountId}</span>
              </p>

              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="
                  w-full rounded-lg border border-gray-300
                  px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                "
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
                  className="
                    px-4 py-2 rounded-lg text-sm
                    bg-gray-200 text-gray-700
                    hover:bg-gray-300 transition
                  "
                >
                  Close
                </button>

                <button
                  onClick={handleProceed}
                  className="
                    px-4 py-2 rounded-lg text-sm
                    bg-indigo-600 text-white
                    hover:bg-indigo-500 transition
                  "
                >
                  Proceed
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-700">
                  Are you sure you want to
                </p>

                <p className="text-base font-semibold text-gray-900">
                  {action.toUpperCase()} Algo Trading
                </p>

                <p className="text-sm text-gray-600">
                  for account <span className="font-medium">#{accountId}</span>?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <button
                  onClick={handleConfirm}
                  className="
                    px-4 py-2 rounded-lg text-sm
                    bg-red-600 text-white
                    hover:bg-red-500 transition
                  "
                >
                  Confirm
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="
                    px-4 py-2 rounded-lg text-sm
                    bg-gray-200 text-gray-700
                    hover:bg-gray-300 transition
                  "
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

export default AlgoTradingModal;
