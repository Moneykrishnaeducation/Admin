import React, { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";

const ChangeStatusModal = ({
  visible,
  isOpen,
  onClose,
  userName = "",
  currentStatus = "",
  onUpdate,
  userRow,
}) => {
  // Accept both visible or isOpen
  const isVisible = visible ?? isOpen;

  const [userData, setUserData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  const displayName =
    userData?.username || userData?.first_name || userName || userRow?.username || userRow?.name || "";

  const displayStatus =
    userData?.role || currentStatus ||
    userRow?.manager_admin_status ||
    userRow?.status ||
    userRow?.role ||
    "client";

  const [status, setStatus] = useState(displayStatus);
  const [loading, setLoading] = useState(false);

  // Fetch user data when modal is opened
  useEffect(() => {
    if (isVisible) {
      const fetchUserData = async () => {
        const userId = userRow?.id ?? userRow?.userId;
        if (!userId) return;

        setFetchLoading(true);
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("jwt_token") ||
                localStorage.getItem("access_token")
              : null;

          const res = await fetch(
            `/api/admin/user-info/${userId}/`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(
              errBody?.message ||
                `Failed with status ${res.status}`
            );
          }

          const data = await res.json();
          setUserData(data);
          setAvailableRoles(data.available_roles || []);
          setStatus(data.role || displayStatus);
        } catch (err) {
          console.error("Fetch user data error:", err);
          alert(`Error fetching user data: ${err.message}`);
        } finally {
          setFetchLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isVisible, userRow?.id, userRow?.userId]);

  // ============================
  // POST Update User Role
  // ============================
  const handleUpdate = async () => {
    if (!userRow?.id && !userRow?.userId) {
      alert("User ID missing");
      return;
    }

    setLoading(true);
    try {
      const userId = userRow?.id ?? userRow?.userId;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwt_token") ||
            localStorage.getItem("access_token")
          : null;

      const res = await fetch(
        `/api/admin/update-user-status/${userId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role: status }), // <-- FIXED PAYLOAD
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message ||
            `Failed with status ${res.status}`
        );
      }

      // Backend sends:
      // { old_role: "...", new_role: "..." }
      const response = await res.json();

      if (onUpdate) {
        onUpdate(response);
      }

      alert(
        `Role updated: ${response.old_role} → ${response.new_role}`
      );

      if (onClose) onClose();
    } catch (err) {
      console.error("Status update error:", err);
      alert(`Error: ${err.message}`);
      fetchUserData();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-center">
      <button
        onClick={handleUpdate}
        disabled={loading || fetchLoading}
        className="bg-yellow-500 text-white px-6 py-2 rounded disabled:opacity-50"
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
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Current Role: <strong>{displayStatus}</strong>
        </p>

        <p className="text-sm">
          Select a new role for <strong>{displayName}</strong>
        </p>

        <div className="flex items-center gap-6 mt-4">
          {availableRoles.length > 0 ? (
            availableRoles.map((role) => (
              <label key={role.value} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={status === role.value}
                  onChange={() => setStatus(role.value)}
                />
                <span>{role.label}</span>
              </label>
            ))
          ) : (
            <>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={status === "admin"}
                  onChange={() => setStatus("admin")}
                />
                <span>Admin</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={status === "manager"}
                  onChange={() => setStatus("manager")}
                />
                <span>Manager</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={status === "client"}
                  onChange={() => setStatus("client")}
                />
                <span>Client</span>
              </label>
            </>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ChangeStatusModal;
