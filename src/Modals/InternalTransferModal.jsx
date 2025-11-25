import React, { useEffect, useRef, useState } from "react";

const InternalTransferModal = ({ visible, onClose, accounts = [] }) => {
  const modalRef = useRef(null);

  // form state
  const [fromAcc, setFromAcc] = useState("");
  const [toAcc, setToAcc] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");

  const [showComment, setShowComment] = useState(false);

  // toast state
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Close if clicked outside modal content
  useEffect(() => {
    const handler = (e) => {
      if (visible && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, onClose]);

  const handleSubmit = () => {
    const fromAccount = accounts.find(a => String(a.account_no) === String(fromAcc));
    if (!fromAccount) {
      return showToast("❌ Please select a valid 'From Account'.", "error");
    }

    const availableBalance = parseFloat(fromAccount.balance || 0);

    if (!fromAcc || !toAcc || Number(amount) <= 0 || fromAcc === toAcc) {
      return showToast("❌ Transfer failed! Please check inputs.", "error");
    }

    if (Number(amount) > availableBalance) {
      return showToast(`❌ Insufficient balance. Available: ${availableBalance}`, "error");
    }

    showToast("Processing transfer...", "success");

    fetch("/api/accounts/internal-transfer/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        from_account_no: fromAcc,
        to_account_no: toAcc,
        amount: Number(amount),
        note: comment,
      }),
    })
      .then((res) => res.json().then(body => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status === 200 && body.success) {
          showToast("✅ Transfer successful!", "success");

          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          showToast(body.error || "Transfer failed!", "error");
        }
      })
      .catch(() => showToast("Transfer failed! Please try again.", "error"));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 px-4 py-2 rounded-md text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4">Internal Transfer</h2>

        {/* From Account */}
        <div className="mb-3">
          <label className="block mb-1">From Account</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={fromAcc}
            onChange={(e) => setFromAcc(e.target.value)}
          >
            <option value="">-- Select --</option>
            {accounts.map((acc) => (
              <option key={acc.account_no} value={acc.account_no}>
                {acc.account_no} — ${acc.balance}
              </option>
            ))}
          </select>
        </div>

        {/* To Account */}
        <div className="mb-3">
          <label className="block mb-1">To Account</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={toAcc}
            onChange={(e) => setToAcc(e.target.value)}
          >
            <option value="">-- Select --</option>
            {accounts.map((acc) => (
              <option key={acc.account_no} value={acc.account_no}>
                {acc.account_no} — ${acc.balance}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setShowComment(Number(e.target.value) > 0);
            }}
          />
        </div>

        {/* Comment – only visible if amount > 0 */}
        {showComment && (
          <div className="mb-3">
            <label className="block mb-1">Comment</label>
            <textarea
              className="w-full border px-3 py-2 rounded"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-400 rounded text-black"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-yellow-500 rounded text-black font-semibold"
            onClick={handleSubmit}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternalTransferModal;
