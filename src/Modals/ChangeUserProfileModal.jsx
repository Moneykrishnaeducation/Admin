import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";
const apiClient = new AdminAuthenticatedFetch("");

const ChangeUserProfileModal = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH GROUPS ================= */
  useEffect(() => {
    if (visible) fetchGroups();
  }, [visible]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/api/available-groups/");
      setGroups(data?.available_groups || data?.groups || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  const handleSubmit = () => {
    if (!selectedGroup) {
      alert("Please select a group");
      return;
    }
    onSubmit(selectedGroup);
    setSelectedGroup("");
  };

  const handleClose = () => {
    setSelectedGroup("");
    onClose();
  };

  if (!visible) return null;

  /* ================= THEME CLASSES ================= */
  const modalBg = isDarkMode
    ? "bg-[#0b0b0b] text-yellow-300 border border-yellow-700"
    : "bg-white text-black border border-gray-200";

  const headerBorder = isDarkMode ? "border-yellow-700" : "border-gray-200";

  const inputBg = isDarkMode
    ? "bg-[#111] text-yellow-200 border border-yellow-600"
    : "bg-gray-50 text-black border border-gray-300";

  const footerBorder = isDarkMode ? "border-yellow-700" : "border-gray-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3">
      {/* Modal Container */}
      <div
        className={`
          relative w-full max-w-md rounded-2xl shadow-2xl
          ${modalBg}
          max-h-[90vh] overflow-hidden
        `}
      >
        {/* ================= HEADER ================= */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${headerBorder}`}
        >
          <h3 className="text-lg font-semibold tracking-wide text-yellow-500">
            Select Trading Group
          </h3>

          <button
            onClick={handleClose}
            className="
              p-1 rounded-md
              hover:bg-yellow-400/10 transition
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm opacity-80">
            Assign the user to one of the approved trading groups. This will
            control the permissions and access level.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Approved Groups
            </label>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`
                w-full p-2.5 rounded-lg
                ${inputBg}
                focus:outline-none
                focus:ring-2 focus:ring-yellow-500
                transition
              `}
            >
              <option value="">-- Select a group --</option>

              {loading && (
                <option disabled>Loading groups...</option>
              )}

              {!loading &&
                groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.alias || group.label || group.name}
                  </option>
                ))}
            </select>

            {!loading && groups.length === 0 && (
              <p className="text-xs text-red-400 mt-1">
                No groups available
              </p>
            )}
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div
          className={`flex justify-end gap-3 px-5 py-4 border-t ${footerBorder}`}
        >
          <button
            onClick={handleClose}
            className="
              px-4 py-2 rounded-lg
              bg-gray-400 hover:bg-gray-500
              text-black transition
            "
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              px-5 py-2 rounded-lg
              bg-yellow-500 hover:bg-yellow-400
              text-black font-medium
              transition disabled:opacity-60
            "
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeUserProfileModal;
