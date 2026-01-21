import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { useTheme } from "../context/ThemeContext";

const ChangeStatusModal = ({
  visible,
  isOpen,
  onClose,
  userName = "",
  currentStatus = "",
  onUpdate,
  userRow,
}) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  // Accept both visible or isOpen
  const isVisible = visible ?? isOpen;

  const [userData, setUserData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  const displayName =
    userData?.username ||
    userData?.first_name ||
    userName ||
    userRow?.username ||
    userRow?.name ||
    "";

  const displayStatus =
    userData?.role ||
    currentStatus ||
    userRow?.manager_admin_status ||
    userRow?.status ||
    userRow?.role ||
    "client";

  const [status, setStatus] = useState(displayStatus);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH USER ================= */
  useEffect(() => {
    if (isVisible) {
      const fetchUserData = async () => {
        const userId = userRow?.id ?? userRow?.userId;
        if (!userId) return;

        setFetchLoading(true);
        try {
          // Tokens are now in HttpOnly cookies - no need to manually add Authorization header
          const res = await fetch(`/api/admin/user-info/${userId}/`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody?.message || `Failed with status ${res.status}`);
          }

          const data = await res.json();
          setUserData(data);
          setAvailableRoles(data.available_roles || []);
          setStatus(data.role || displayStatus);
        } catch (err) {
          // console.error("Fetch user data error:", err);
          alert(`Error fetching user data: ${err.message}`);
        } finally {
          setFetchLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isVisible, userRow?.id, userRow?.userId]);

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    if (!userRow?.id && !userRow?.userId) {
      alert("User ID missing");
      return;
    }

    setLoading(true);
    try {
      const userId = userRow?.id ?? userRow?.userId;

      // Tokens are now in HttpOnly cookies - no need to manually add Authorization header
      const res = await fetch(`/api/admin/update-user-status/${userId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: status }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `Failed with status ${res.status}`);
      }

      const response = await res.json();
      onUpdate && onUpdate(response);

      alert(`Role updated: ${response.old_role} → ${response.new_role}`);
      onClose && onClose();
    } catch (err) {
      // console.error("Status update error:", err);
      alert(`Error: ${err.message}`);
      fetchUserData();
    } finally {
      setLoading(false);
    }
  };

  /* ================= THEME CLASSES ================= */
  const textMain = isDarkMode ? "text-white" : "text-black";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-600";
  const cardBg = isDarkMode ? "bg-black" : "bg-white";
  const borderCls = isDarkMode ? "border-gray-700" : "border-gray-200";

  const radioCls = `
    accent-yellow-400
    scale-110
    cursor-pointer
  `;

  const footer = (
    <div className="flex justify-center">
      <button
        onClick={handleUpdate}
        disabled={loading || fetchLoading}
        className="
          px-6 py-2 rounded-lg
          bg-yellow-400 text-black font-medium
          hover:brightness-95 transition
          disabled:opacity-50
        "
      >
        {loading ? "Updating..." : fetchLoading ? "Loading..." : "Update Status"}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Change Status for ${displayName}`}
      visible={isVisible}
      onClose={onClose}
      footer={footer}
    >
      <div
        className={`
          space-y-4 p-1
          ${cardBg}
        `}
      >
        <p className={`text-sm ${textMuted}`}>
          Current Role:
          <span className={`ml-1 font-semibold ${textMain}`}>
            {displayStatus}
          </span>
        </p>

        <p className={`text-sm ${textMuted}`}>
          Select a new role for{" "}
          <span className={`font-medium ${textMain}`}>{displayName}</span>
        </p>

        <div
          className={`
            mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4
            border ${borderCls} rounded-xl p-4
          `}
        >
          {availableRoles.length > 0 ? (
            availableRoles.map((role) => (
              <label
                key={role.value}
                className={`
                  flex items-center gap-3
                  px-4 py-3 rounded-lg cursor-pointer
                  transition-all duration-200
                  ${status === role.value
                    ? "bg-yellow-400/15 border-2 border-yellow-400 scale-102"
                    : "border border-transparent hover:border-gray-500"}
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={status === role.value}
                  onChange={() => setStatus(role.value)}
                  className={radioCls}
                />
                <span className={`${status === role.value ? "font-semibold" : ""} ${textMain} transition-all`}>
                  {role.label}
                </span>
              </label>
            ))
          ) : (
            ["admin", "manager", "client"].map((role) => (
              <label
                key={role}
                className={`
                  flex items-center gap-3
                  px-4 py-3 rounded-lg cursor-pointer
                  transition-all duration-200
                  ${status === role
                    ? "bg-yellow-400/15 border-2 border-yellow-400 scale-102"
                    : "border border-transparent hover:border-gray-500"}
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={status === role}
                  onChange={() => setStatus(role)}
                  className={radioCls}
                />
                <span className={`${status === role ? "font-semibold" : ""} ${textMain} transition-all`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ChangeStatusModal;
