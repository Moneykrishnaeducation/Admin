import React from "react";
import { X } from "lucide-react";

const Verify = ({
  isDarkMode,
  modalBg,
  btnGhost,
  verifyRow,
  idFile,
  addressFile,
  idMismatch,
  addressMismatch,
  uploadingId,
  uploadingAddress,
  setVerifyModalOpen,
  handleIdSelect,
  handleAddressSelect,
  handleUploadId,
  handleUploadAddress,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setVerifyModalOpen(false)}
      />
      <div
        className={`relative max-w-md w-full mx-4 rounded-lg shadow-xl ${modalBg} border ${
          isDarkMode ? "border-yellow-700" : "border-gray-200"
        }`}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: isDarkMode ? "#b8860b33" : "#eee" }}
        >
          <div>
            <div
              className={`text-center font-bold ${
                isDarkMode ? "text-yellow-300" : "text-black"
              } text-lg`}
            >
              Document Verification for{verifyRow.name} id :{" "}
              <span
                className={`text-center font-extrabold ${
                  isDarkMode ? "text-yellow-400" : "text-yellow-600"
                } mt-1`}
              >
                {verifyRow.id}
              </span>
            </div>
          </div>
          <button
            className="p-1"
            onClick={() => setVerifyModalOpen(false)}
            aria-label="Close verify"
          >
            <X />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* ID Proof */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">ID Proof</div>
              {idMismatch && (
                <div className="text-sm text-red-500">• Document Mismatch</div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {/* Preview selected ID File */}
              {idFile && idFile.type.startsWith("image/") && (
                <div className="flex space-x-4 mt-2 overflow-x-auto">
                  <img
                    src={URL.createObjectURL(idFile)}
                    alt="ID Preview"
                    className="h-20 w-auto rounded border border-gray-300"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
              )}
              <label
                className={`flex-1 flex items-center justify-center rounded border border-dashed py-6 cursor-pointer ${
                  isDarkMode
                    ? "border-yellow-600 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleIdSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="mb-2 text-sm">
                    {idFile ? idFile.name : "Select ID Proof"}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-yellow-300" : "text-gray-600"
                    }`}
                  >
                    Click to choose file
                  </div>
                </div>
              </label>

              <button
                onClick={handleUploadId}
                className={`flex-1 ${
                  uploadingId ? "opacity-70 pointer-events-none" : ""
                } px-4 py-3 rounded ${
                  isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                }`}
              >
                {uploadingId ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {/* Address Proof */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Address Proof</div>
              {addressMismatch && (
                <div className="text-sm text-red-500">• Document Mismatch</div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {/* Preview selected Address File */}
              {addressFile && addressFile.type.startsWith("image/") && (
                <div className="flex space-x-4 mt-2 overflow-x-auto">
                  <img
                    src={URL.createObjectURL(addressFile)}
                    alt="Address Preview"
                    className="h-20 w-auto rounded border border-gray-300"
                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                  />
                </div>
              )}

              <label
                className={`flex-1 flex items-center justify-center rounded border border-dashed py-6 cursor-pointer ${
                  isDarkMode
                    ? "border-yellow-600 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAddressSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="mb-2 text-sm">
                    {addressFile ? addressFile.name : "Select Address Proof"}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-yellow-300" : "text-gray-600"
                    }`}
                  >
                    Click to choose file
                  </div>
                </div>
              </label>
              <button
                onClick={handleUploadAddress}
                className={`flex-1 ${
                  uploadingAddress ? "opacity-70 pointer-events-none" : ""
                } px-4 py-3 rounded ${
                  isDarkMode ? "bg-yellow-500 text-black" : "bg-blue-600 text-white"
                }`}
              >
                {uploadingAddress ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setVerifyModalOpen(false)}
              className={`px-4 py-2 rounded ${btnGhost}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
