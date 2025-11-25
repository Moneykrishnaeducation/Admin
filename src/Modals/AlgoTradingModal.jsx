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
    onProceed(action); // pass enable/disable to parent
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Enable/Disable Algo for Account {accountId}</h3>
              <button onClick={onClose}>×</button>
            </div>

            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            >
              <option value="" disabled>Select Action</option>
              <option value="enable">Enable Algo</option>
              <option value="disable">Disable Algo</option>
            </select>

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Close</button>
              <button className="px-4 py-2 bg-yellow-500 rounded" onClick={handleProceed}>Proceed</button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Confirm Action</h3>
              <button onClick={onClose}>×</button>
            </div>

            <p className="mb-4 text-center">
              Are you sure you want to <strong>{action}</strong> algo for account <strong>{accountId}</strong>?
            </p>

            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleConfirm}>
                Confirm
              </button>
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setStep(1)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlgoTradingModal;
