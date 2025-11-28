import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('/api');
const client = new AdminAuthenticatedFetch('');

export default function IbStatusModal({ visible, onClose, userRow, isDarkMode }) {
  if (!visible || !userRow) return null;

  const userId = userRow.userId || userRow.id;

  // STATES
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [status, setStatus] = useState({
    enabled: false,
    profile_id: null,
    profile_name: "",
    commission: 0,
  });

 // ========= API HELPERS ==========
  const fetchGET = async (url) => {
    return await client.get(url);
  };

  const fetchPATCH = async (payload) => {
    return await client.patch(`/ib-user/${userId}/ib-status/`, payload);
  };
  // ========= FETCH DATA ON OPEN ==========
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoading(true);

        const [profilesRes, statusRes] = await Promise.all([
          fetchGET(`/ib-user/${userId}/ib-profiles/`),
          fetchGET(`/ib-user/${userId}/ib-status/`),
        ]);

        setProfiles(profilesRes || []);

        setStatus({
          enabled: statusRes?.is_ib || false,
          profile_id: statusRes?.ib_profile?.id || null,
          profile_name: statusRes?.ib_profile?.name || "None",
          commission: statusRes?.ib_profile?.commission || 0,
        });

      } catch (e) {
        console.error(e);
        alert("Error loading IB status");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, userId]);

  // ========= ACTIONS ==========
  const toggleStatus = async () => {
    try {
      const newStatus = !status.enabled;
      await fetchPATCH({ enabled: newStatus, profile_id: status.profile_id });

      setStatus((p) => ({ ...p, enabled: newStatus }));
      alert(`IB ${newStatus ? "Enabled" : "Disabled"}`);
    } catch (e) {
      alert(e.message);
    }
  };

  const selectProfile = async (profile) => {
    try {
      const userData = await fetchGET(`/users/${userId}/`);

      setStatus((prev) => ({
        ...prev,
        enabled: userData.IB_status,
        profile_id: profile.id,
        profile_name: profile.name,
        commission: profile.commission,
      }));

    } catch (e) {
      alert("Update failed");
    }
  };

  const modalBg = isDarkMode
    ? "bg-gray-900 text-yellow-300"
    : "bg-white text-black";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* modal */}
      <div className={`relative w-full max-w-xl rounded-lg shadow-xl p-6 ${modalBg}`}>
        
        {/* close */}
        <button className="absolute top-3 right-3" onClick={onClose}>
          <X />
        </button>

        <h2 className="text-xl font-bold mb-4">
          IB Status – User {userId}
        </h2>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            {/* STATUS */}
            <div className="mb-3 flex justify-between">
              <span className="font-semibold">Current Status:</span>
              <span className={`${status.enabled ? "text-green-400" : "text-red-400"} font-semibold`}>
                {status.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {/* CURRENT PROFILE */}
            <div className="mb-3 flex justify-between">
              <span className="font-semibold">Commission Profile:</span>
              <span className="font-semibold">{status.profile_name}</span>
            </div>

            <div className="mt-4 mb-2 font-semibold">Select Profile:</div>

            {/* PROFILES TABLE */}
            <div className="overflow-auto max-h-60">
              <table className="w-full border">
                <thead>
                  <tr className={`${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <th className="p-2 text-left">Profile</th>
                    <th className="p-2 text-left">Commission</th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center p-3">
                        No Profiles Found
                      </td>
                    </tr>
                  ) : (
                    profiles.map((p) => (
                      <tr
                        key={p.id}
                        className={`cursor-pointer hover:bg-yellow-600 hover:text-black ${
                          status.profile_id === p.id ? "bg-yellow-500 text-black" : ""
                        }`}
                        onClick={() => selectProfile(p)}
                      >
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.commission}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TOGGLE */}
            <button
              onClick={toggleStatus}
              className={`w-full mt-5 py-2 rounded font-semibold ${
                status.enabled ? "bg-red-500" : "bg-green-500"
              }`}
            >
              {status.enabled ? "Disable IB" : "Enable IB"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
