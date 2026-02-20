import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Info } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Helper to get a cookie value
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
  } catch (e) {}
  return null;
}

// Check if user is superuser (reads non-HttpOnly `user` cookie)
function isSuperuser() {
  try {
    const userCookie = getCookie('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      return user?.is_superuser === true || user?.is_superuser === 'true';
    }
  } catch (e) {}
  return false;
}

function Badge({ label, alias, isActive, isDemo, isDarkMode }) {
  const baseClass =
    "inline-block px-2.5 py-1 mr-1 mb-1 rounded text-xs font-medium select-text whitespace-nowrap";

  const activeClass = isActive
    ? isDemo
      ? "bg-sky-200 text-sky-800 font-semibold"
      : "bg-green-200 text-green-900 font-semibold"
    : isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-300 text-gray-700";

  return (
    <span className={`${baseClass} ${activeClass}`} title={label}>
      {alias || label}
    </span>
  );
}

function GroupItem({
  group,
  onChange,
  onRadioChange,
  onAliasChange,
  onAliasLock,
  selectedDefault,
  selectedDemoDefault,
  isDarkMode,
}) {
  return (
    <div className={`flex items-center mb-3 border-b pb-2 text-sm ${isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-300 text-black'}`}>
      <div className="flex-1 font-bold">
        {group.id}{" "}
        <span className="bg-sky-500 text-white rounded px-1 text-[10px] ml-2">MT5</span>
      </div>

      <div className="ml-3 flex-shrink-0">
        <input
          type="checkbox"
          checked={group.enabled}
          onChange={() => onChange(group.id)}
          id={`enable_${group.id}`}
          className="cursor-pointer w-4 h-4 rounded accent-yellow-300"
        />
        <label htmlFor={`enable_${group.id}`} className="ml-1 cursor-pointer">Enable</label>
      </div>

      <div className="ml-3">
        <input
          type="radio"
          checked={selectedDefault === group.id}
          onChange={() => onRadioChange(group.id, "default")}
          name="defaultGroupDemo"
          id={`default_demo_${group.id}`}
          className="peer cursor-pointer accent-yellow-400"
        />
        <label htmlFor={`default_demo_${group.id}`} className="ml-1 cursor-pointer peer-checked:text-yellow-300">Default (Demo)</label>
      </div>

      <div className="ml-3">
        <input
          type="text"
          value={group.alias}
          placeholder="Alias"
          disabled={group.aliasLocked}
          onChange={(e) => onAliasChange(group.id, e.target.value)}
          onBlur={() => onAliasLock(group.id)}
          className={`ml-1 ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'} border rounded px-2 py-0.5 w-36 outline-none`}
        />
      </div>
    </div>
  );
}

export default function GroupConfigurationDemo() {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;
  const [superuserCheckDone, setSuperuserCheckDone] = useState(false);
  const [isSuperuserUser, setIsSuperuserUser] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedDefault, setSelectedDefault] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAvailableGroups = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch groups from the dedicated demo MT5 server endpoint
      const res = await fetch("/api/demo-available-groups/", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`demo-available-groups returned ${res.status}`);
      const data = await res.json();

      const serverGroups = (data.groups || []).map((g) => ({
        id: g.id || g,
        label: g.label || g.name || g,
        type: "demo",
        enabled: g.enabled ?? false,
        alias: g.alias || "",
        aliasLocked: false,
      }));

      setGroups(serverGroups);
      // Pre-select the first demo-default or just the first group
      const demoDefault = serverGroups.find((g) => g.is_demo_default);
      setSelectedDefault(demoDefault?.id || serverGroups[0]?.id || null);
    } catch (err) {
      // Fallback: try existing group config from DB
      try {
        const res = await fetch("/api/current-group-config/", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && resJson.configuration) {
            const config = resJson.configuration;
            const demoGroups = (config.demo_groups || []).map((g) => ({
              id: g.id,
              label: g.name + (g.alias ? ` (${g.alias})` : ""),
              type: "demo",
              enabled: true,
              alias: g.alias || "",
              aliasLocked: false,
            }));
            setGroups(demoGroups);
            setSelectedDefault(config.demo_group?.id || null);
          }
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const superuser = isSuperuser();
    setIsSuperuserUser(superuser);
    setSuperuserCheckDone(true);
  }, []);

  useEffect(() => {
    fetchAvailableGroups();
  }, [fetchAvailableGroups]);

  const handleChange = (id) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  };

  const handleRadioChange = (id) => {
    setSelectedDefault(id);
  };

  const handleAliasChange = (id, val) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, alias: val } : g)));
  };

  const handleAliasLock = (id) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, aliasLocked: true } : g)));
  };

  const handleSaveGroupConfig = async () => {
    if (!selectedDefault) {
      alert('Please select a Demo Default group before saving.');
      return;
    }
    const endpoint = "/api/save-demo-group-configuration/";
    // demo_default=true only for the selected group; others keep their enabled/alias state
    const payloadGroups = groups.map((g) => ({
      id: g.id,
      enabled: g.enabled,
      alias: g.alias ?? '',
      demo_default: g.id === selectedDefault,
    }));
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: payloadGroups }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Demo group configuration saved. Default: ${data.demo_default_group}`);
      } else {
        alert(`Save failed: ${data.message}`);
      }
    } catch (e) {
      alert('Failed to save demo configuration.');
    }
  };

  return (
    <div className={`font-sans ${isDarkMode ? 'text-gray-200' : 'bg-white text-black'} p-6 max-w-5xl mx-auto rounded-lg`}> 
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">Demo Group Configuration</h1>
      <div className="flex justify-end mb-3">
        <button
          onClick={fetchAvailableGroups}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-md disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading…" : "Refresh from Demo Server"}
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div>
          {groups.map((g) => (
            <GroupItem key={g.id} group={g} onChange={handleChange} onRadioChange={(id)=>handleRadioChange(id,'demoDefault')} onAliasChange={handleAliasChange} onAliasLock={handleAliasLock} selectedDefault={selectedDefault} isDarkMode={isDarkMode} />
          ))}

          <div className="mt-4 flex justify-end">
            <button onClick={handleSaveGroupConfig} className="px-4 py-2 bg-yellow-500 text-black rounded-md">Save Demo Configuration</button>
          </div>
        </div>
      )}
    </div>
  );
}
