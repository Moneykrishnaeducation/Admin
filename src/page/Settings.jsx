import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// Helper to get cookie value
function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
  } catch {}
  return null;
}

// Check if user is superuser
function isSuperuser() {
  try {
    const userCookie = getCookie('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      return user?.is_superuser === true || user?.is_superuser === 'true';
    }
  } catch {}
  return false;
}

const Settings = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [superuserCheckDone, setSuperuserCheckDone] = useState(false);
  const [isSuperuserUser, setIsSuperuserUser] = useState(false);
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

  // Check superuser status on component mount
  useEffect(() => {
    const superuser = isSuperuser();
    setIsSuperuserUser(superuser);
    setSuperuserCheckDone(true);
  }, []);

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

  // If superuser check is done but user is not a superuser, show access denied
  if (superuserCheckDone && !isSuperuserUser) {
    return (
      <div className={`font-sans ${isDarkMode ? 'text-gray-200' : 'bg-white text-black'} p-6 max-w-[1200px] mx-auto rounded-lg min-h-screen flex items-center justify-center`}>
        <div className={`text-center p-8 rounded-lg border-2 ${isDarkMode ? 'border-red-500 bg-red-900/20' : 'border-red-400 bg-red-100'}`}>
          <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Access Denied
          </h1>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Only superusers can access the Settings page.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-transparent ${isDarkMode ? 'text-yellow-400' : 'text-gray-900'} flex flex-col items-center justify-center p-4 sm:p-6 md:p-8`}>

      <form
        onSubmit={handleSubmit}
        className={`${isDarkMode ? 'bg-black' : 'bg-white'} p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,0,0,0.15)] w-full max-w-lg mx-auto hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300`}
      >
        {loading ? (
          <div className={`w-full flex items-center justify-center ${isDarkMode ? 'text-yellow-300' : 'text-gray-600'}`}>
            <div className="w-full max-w-lg animate-pulse space-y-6 min-h-[220px]">
              <div className="flex flex-col gap-2">
                <div className={`${isDarkMode ? 'bg-yellow-400/30' : 'bg-gray-300'} skeleton-gold h-4 rounded w-1/3`} />
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-12 rounded w-full`} />
              </div>

              <div className="flex flex-col gap-2">
                <div className={`${isDarkMode ? 'bg-yellow-400/30' : 'bg-gray-300'} skeleton-gold h-4 rounded w-1/3`} />
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-12 rounded w-full`} />
              </div>

              <div className="flex flex-col gap-2">
                <div className={`${isDarkMode ? 'bg-yellow-400/30' : 'bg-gray-300'} skeleton-gold h-4 rounded w-1/3`} />
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-12 rounded w-full`} />
              </div>

              <div className="flex flex-col gap-2">
                <div className={`${isDarkMode ? 'bg-yellow-400/30' : 'bg-gray-300'} skeleton-gold h-4 rounded w-1/3`} />
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-12 rounded w-full`} />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-10 w-36 rounded-full`} />
                <div className={`${isDarkMode ? 'bg-yellow-400/20' : 'bg-gray-200'} skeleton-gold h-10 w-36 rounded-md`} />
              </div>
            </div>
          </div>
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
