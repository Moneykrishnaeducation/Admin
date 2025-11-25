import React, { useState, useEffect, useRef } from "react";

const ChangeLeverageModal = ({
  visible,
  onClose,
  currentLeverage,
  leverageOptions = [],
  onUpdate,
}) => {
  const modalRef = useRef(null);

  const [step, setStep] = useState(1);
  const [newLeverage, setNewLeverage] = useState("");

  useEffect(() => {
    if (visible) {
      setStep(1);
      setNewLeverage(currentLeverage);
    }
  }, [visible, currentLeverage]);

  const openConfirm = () => {
    if (!newLeverage) return;
    setStep(2);
  };

  const confirmUpdate = () => {
    onUpdate(newLeverage);
    onClose();
  };

  const resetLeverage = () => {
    setNewLeverage(currentLeverage);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow p-5 w-full max-w-md">

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Change Leverage</h3>
              <button onClick={onClose}>×</button>
            </div>

            <p className="mb-2">Current Leverage: <strong>{currentLeverage}</strong></p>

            <label className="block mb-1">Select New Leverage</label>
            <select
              className="border p-2 rounded w-full mb-4"
              value={newLeverage}
              onChange={(e) => setNewLeverage(e.target.value)}
            >
              {leverageOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={resetLeverage}>
                Reset
              </button>
              <button className="px-4 py-2 bg-yellow-500 rounded" onClick={openConfirm}>
                Update Leverage
              </button>
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Confirm Leverage Change</h3>
              <button onClick={onClose}>×</button>
            </div>

            <p className="mb-4 text-center">
              Are you sure you want to change leverage to <strong>{newLeverage}</strong>?
            </p>

            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-yellow-500 rounded" onClick={confirmUpdate}>
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

export default ChangeLeverageModal;
