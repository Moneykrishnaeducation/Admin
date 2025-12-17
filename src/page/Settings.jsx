import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const Settings = () => {
  const { isDarkMode } = useTheme();
  const [serverData, setServerData] = useState({
    serverIP: "",
    loginID: "",
    password: "",
    serverName: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/server-settings/", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load server settings: ${res.status}`);
        }

        const data = await res.json();
        if (!mounted.current) return;
        // Map backend keys to our local state if needed
        setServerData({
          serverIP: data.server_ip ?? data.serverIP ?? "",
          loginID: data.login_id ?? data.loginID ?? "",
          // backend returns `server_password`
          password: data.server_password ?? data.password ?? "",
          serverName: data.server_name ?? data.serverName ?? "",
        });
        setOriginalData({
          serverIP: data.server_ip ?? data.serverIP ?? "",
          loginID: data.login_id ?? data.loginID ?? "",
          password: data.server_password ?? data.password ?? "",
          serverName: data.server_name ?? data.serverName ?? "",
        });
      } catch (err) {
        if (!mounted.current) return;
        setError(err.message || "Error loading server settings");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      mounted.current = false;
    };
  }, []);

  // Helper to get CSRF token from cookies (Django default)
  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    if (match) return decodeURIComponent(match[2]);
    return null;
  };

  const handleChange = (e) => {
    setServerData({
      ...serverData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditToggle = () => {
    if (isEditing && originalData) {
      // If cancelling edit, revert to original fetched data
      setServerData(originalData);
      setError(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        server_ip: serverData.serverIP,
        login_id: serverData.loginID,
        // backend expects `server_password`
        server_password: serverData.password,
        server_name: serverData.serverName,
      };

      // Try updating via PUT first
      let res = await fetch("/api/server-settings/", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Fallback to POST (create) if PUT not allowed (status 405)
      if (res.status === 405) {
        res = await fetch("/api/create-server-settings/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken") || "",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed (${res.status}): ${text}`);
      }

      const saved = await res.json();
      setOriginalData({
        serverIP: saved.server_ip ?? saved.serverIP ?? serverData.serverIP,
        loginID: saved.login_id ?? saved.loginID ?? serverData.loginID,
        // server_password may not be returned by update responses, fall back to current
        password: saved.server_password ?? saved.password ?? serverData.password,
        serverName: saved.server_name ?? saved.serverName ?? serverData.serverName,
      });
      setServerData((prev) => ({ ...prev }));
      setIsEditing(false);
      // Optionally show a brief confirmation
      // alert("Server settings updated!");
    } catch (err) {
      setError(err.message || "Error saving server settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-transparent ${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} flex flex-col items-center p-4 sm:p-6 md:p-8`}>
      <h2 className={`text-2xl sm:text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-yellow-400' : 'text-gray-900'}`}>Server Configuration</h2>

      <form
        onSubmit={handleSubmit}
        className={`${isDarkMode ? 'bg-black' : 'bg-white'} p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,0,0,0.15)] w-full max-w-8xl sm:max-w-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300`}
      >
        {loading ? (
          <div className={isDarkMode ? "text-yellow-300" : "text-gray-600"}>Loading server settings...</div>
        ) : (
          <>
            {error && <div className="text-red-400 mb-3">{error}</div>}

            <div className="flex flex-col gap-1">
              <label className={`${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} font-medium text-sm sm:text-base`}>Server IP Address*</label>
              <input
                type="text"
                name="serverIP"
                value={serverData.serverIP}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'border-yellow-400/30 bg-black text-yellow-400 focus:border-yellow-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'} text-sm sm:text-base ${
                  isEditing ? (isDarkMode ? "bg-black" : "bg-white") : (isDarkMode ? "bg-black/50 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed")
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} font-medium text-sm sm:text-base`}>Account Login ID*</label>
              <input
                type="text"
                name="loginID"
                value={serverData.loginID}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'border-yellow-400/30 bg-black text-yellow-400 focus:border-yellow-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'} text-sm sm:text-base ${
                  isEditing ? (isDarkMode ? "bg-black" : "bg-white") : (isDarkMode ? "bg-black/50 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed")
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} font-medium text-sm sm:text-base`}>Account Password*</label>
              <input
                type="password"
                name="password"
                value={serverData.password}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'border-yellow-400/30 bg-black text-yellow-400 focus:border-yellow-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'} text-sm sm:text-base ${
                  isEditing ? (isDarkMode ? "bg-black" : "bg-white") : (isDarkMode ? "bg-black/50 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed")
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} font-medium text-sm sm:text-base`}>Server Name*</label>
              <input
                type="text"
                name="serverName"
                value={serverData.serverName}
                onChange={handleChange}
                disabled={!isEditing || saving}
                className={`p-3 sm:p-4 rounded-lg border ${isDarkMode ? 'border-yellow-400/30 bg-black text-yellow-400 focus:border-yellow-500' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'} text-sm sm:text-base ${
                  isEditing ? (isDarkMode ? "bg-black" : "bg-white") : (isDarkMode ? "bg-black/50 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed")
                }`}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              {isEditing && (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-yellow-500 text-black py-2 px-4 rounded-full hover:bg-yellow-600 transition-all disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button
                type="button"
                onClick={handleEditToggle}
                className="flex-1 sm:flex-none bg-yellow-500 text-black py-2 px-4 rounded-md hover:bg-yellow-600 transition-all"
              >
                {isEditing ? "Cancel" : "✏️ Edit Settings"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Settings;
