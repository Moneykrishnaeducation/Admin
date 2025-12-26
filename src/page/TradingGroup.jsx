import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Info } from "lucide-react";
import { useTheme } from "../context/ThemeContext";


/* ---------------- BADGE ---------------- */


function Badge({ label, alias, isActive, isDemo, isDarkMode }) {
  const baseClass =
    "inline-block px-2.5 py-1 mr-1 mb-1 rounded text-xs font-medium select-text whitespace-nowrap";

  const activeClass = isActive
    ? isDemo
      ? "bg-sky-200 text-sky-800 font-semibold" // Demo default
      : "bg-green-200 text-green-900 font-semibold" // Real default
    : isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-300 text-gray-700";

  return (
    <span className={`${baseClass} ${activeClass}`} title={label}>
      {alias || label}
    </span>
  );
}

/* ---------------- GROUP ITEM ---------------- */
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
        <span className="bg-sky-500 text-white rounded px-1 text-[10px] ml-2">
          MT5
        </span>
      </div>
{/* Enable */}

<div className="ml-3 flex-shrink-0">
  <input
    type="checkbox"
    checked={group.enabled}
    onChange={() => onChange(group.id)}
    id={`enable_${group.id}`}
    className="
      cursor-pointer 
      w-4 h-4
      rounded 
      accent-yellow-300 
      focus:ring-2 
      focus:ring-yellow-400 
      transition-all 
      duration-200
    "
  />
  <label htmlFor={`enable_${group.id}`} className="ml-1 cursor-pointer">
    Enable
  </label>
</div>


     
{/* Default */}
<div className="ml-3">
  <input
    type="radio"
    checked={selectedDefault === group.id}
    onChange={() => onRadioChange(group.id, "default")}
    name="defaultGroup"
    id={`default_${group.id}`}
    className="peer cursor-pointer accent-yellow-400 checked:shadow-[0_0_6px_rgba(250,204,21,1)]"
  />
  <label
    htmlFor={`default_${group.id}`}
    className="ml-1 cursor-pointer peer-checked:text-yellow-300"
  >
    Default
  </label>
</div>

{/* Demo Default */}
<div className="ml-3">
  <input
    type="radio"
    checked={selectedDemoDefault === group.id}
    onChange={() => onRadioChange(group.id, "demoDefault")}
    name="demoDefaultGroup"
    id={`demoDefault_${group.id}`}
    className="peer cursor-pointer accent-yellow-400 checked:shadow-[0_0_6px_rgba(250,204,21,1)]"
  />
  <label
    htmlFor={`demoDefault_${group.id}`}
    className="ml-1 cursor-pointer peer-checked:text-yellow-300"
  >
    Demo Default
  </label>
</div>















{/* Alias */}
<div className="ml-3">
  <input
    type="text"
    value={group.alias}
    placeholder="Alias"
    disabled={group.aliasLocked}
    onChange={(e) => onAliasChange(group.id, e.target.value)}
    onBlur={() => onAliasLock(group.id)}   // 🔒 LOCK WHEN LEAVING INPUT
    className={`
      ml-1
      ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}
      border
      rounded
      px-2
      py-0.5
      w-36
      outline-none
      transition-all
      duration-200
      ${
        group.aliasLocked
          ? "opacity-50 cursor-not-allowed"
          : "focus:border-yellow-400 focus:shadow-[0_0_8px_rgba(250,204,21,0.6)]"
      }
    `}
  />
</div>

    </div>
  );
}

/* ---------------- GUIDE TOGGLE ---------------- */
function GroupConfigurationGuideToggle({ isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-5">
      <h1
        className="flex items-center gap-2 font-bold cursor-pointer text-2xl
             text-[#f7d774] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Info size={18} />
                Group Configuration Guide
          <span>{isOpen ? "▲" : "▼"}</span>
      </h1>


      {isOpen && (
        <div className="mt-3">
          <ol className={`ml-5 list-decimal font-normal ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            <li className={isDarkMode ? 'text-white' : 'text-black'}>
              <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-400'}>Alias Field:</strong>{" "}
              Optional display name for group selection.
            </li>
            <li className={isDarkMode ? 'text-white' : 'text-black'}>
              <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-400'}>Default Group:</strong> Select
              one group as default for real/live accounts.
            </li>
            <li className={isDarkMode ? 'text-white' : 'text-black'}>
              <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-400'}>Demo Default Group:</strong>{" "}
              Select one group as default for demo accounts.
            </li>
            <li className={isDarkMode ? 'text-white' : 'text-black'}>
              <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-400'}>Save Configuration:</strong>{" "}
              Click "Save Configuration" to apply all changes.
            </li>
          </ol>
          <p className={`mt-4 italic ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Note: The <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-400'}>"Default"</strong>{" "}
            group will be used for real accounts, while{" "}
            <strong className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>"Demo Default"</strong> will be
            used for demo accounts.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function GroupConfiguration() {
  const { isDarkMode } = useTheme();
  const [groups, setGroups] = useState([]);
  const [selectedDefault, setSelectedDefault] = useState(null);
  const [selectedDemoDefault, setSelectedDemoDefault] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showActiveConfig, setShowActiveConfig] = useState(true);
  const [loading, setLoading] = useState(true);
  

  /* ---------------- FETCH CURRENT ACTIVE CONFIG ---------------- */
  const fetchCurrentGroups = useCallback(async () => {
    const endpoint = "/api/current-group-config/";
    try {
      let resJson;
      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(endpoint, { credentials: "include", headers });
      if (!res.ok)
        throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
      resJson = await res.json();

      if (resJson.success && resJson.configuration) {
        const config = resJson.configuration;

        const realGroups = config.real_groups.map((g) => ({
          id: g.id,
          label: g.name + (g.alias ? ` (${g.alias})` : ""),
          type: "real",
          enabled: true,
          alias: g.alias || "",
          aliasLocked: false,
        }));

        const demoGroups = config.demo_groups.map((g) => ({
          id: g.id,
          label: g.name + (g.alias ? ` (${g.alias})` : ""),
          type: "demo",
          enabled: true,
          alias: g.alias || "",
          aliasLocked: false,
        }));

        setGroups([...realGroups, ...demoGroups]);
        setSelectedDefault(config.default_group?.id || null);
        setSelectedDemoDefault(config.demo_group?.id || null);
        setLastUpdated(config.last_updated);
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);



  
  /* Load current configuration on mount */
  useEffect(() => {
    fetchCurrentGroups();
  }, [fetchCurrentGroups]);

 /* ---------------- FETCH AVAILABLE GROUPS FOR EDITING ---------------- */
  const fetchAvailableGroups = useCallback(async () => {
    const endpoint = "/api/available-groups/";
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const res = await fetch(endpoint, { credentials: "include", headers });
      if (!res.ok)
        throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);

      const data = await res.json();

      if (data.success && data.groups) {
        
     setGroups(
          data.groups.map((g) => ({
            id: g.id,
            label: g.label,
            type: g.is_demo ? "demo" : "real",
            enabled: g.enabled,
            alias: g.alias || "",
            is_default: g.is_default,
            is_demo_default: g.is_demo_default,
          }))
        );


        setSelectedDefault(
          data.groups.find((g) => g.is_default)?.id || null
        );
        setSelectedDemoDefault(
          data.groups.find((g) => g.is_demo_default)?.id || null
        );
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);







const handleSaveGroupConfig = async (groups = []) => {
  const endpoint = "/api/save-group-configuration/";

  // 1️⃣ Validation: ensure one real and one demo default
  if (!selectedDefault) {
    alert("Please select a Default group for real accounts.");
    return;
  }
  if (!selectedDemoDefault) {
    alert("Please select a Demo Default group for demo accounts.");
    return;
  }

  try {
    // 2️⃣ Map groups into backend payload
const payloadGroups = groups.map((g) => ({
  id: g.id,
  enabled: g.enabled || g.id === selectedDefault || g.id === selectedDemoDefault,
  alias: g.alias ?? "",
  default: g.id === selectedDefault,        // ✔ FIXED
  demo: g.id === selectedDemoDefault,       // ✔ FIXED
}));



    // 3️⃣ Debug logs
    console.log("📤 Sending payload:", payloadGroups);
    console.log(
      "Real defaults:", payloadGroups.filter((g) => g.is_default),
      "Demo defaults:", payloadGroups.filter((g) => g.is_demo_default)
    );

    // 4️⃣ Authorization headers
    const headers = {
      "Content-Type": "application/json",
    };

    // 5️⃣ Send POST request
    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ groups: payloadGroups }),
    });

    const data = await res.json();
    console.log("📥 Response:", data);

    // 6️⃣ Handle failure
    if (!res.ok || !data.success) {
      alert(data.message || "Failed to save group configuration");
      return { success: false, message: data.message || "Save failed" };
    }

    // 7️⃣ Success
    alert("✅ Group configuration saved successfully!");
    return { success: true, configuration: data.configuration };
  } catch (err) {
    console.error("❌ Save error:", err);
    alert("Error saving configuration: " + err.message);
    return { success: false, message: err.message };
  }
};


  /* Load editable groups after current active configuration */
  useEffect(() => {
    fetchAvailableGroups();
  }, [fetchAvailableGroups]);









  /* ---------------- HANDLERS ---------------- */
  const toggleEnable = (id) =>
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );

const changeDefault = (id, type) => {
  if (type === "default") {
    setSelectedDefault(id);
  } else if (type === "demoDefault") {
    setSelectedDemoDefault(id);
  }
};


 const updateAlias = (id, alias) =>
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, alias } : g))
    );

 const onAliasLock = (groupId) => {
  setGroups((prev) =>
    prev.map((g) =>
      g.id === groupId
        ? { ...g, aliasLocked: true }
        : g
    )
  );
};




  const selectAll = groups.every((g) => g.enabled);
  const toggleSelectAll = () =>
    setGroups((prev) => prev.map((g) => ({ ...g, enabled: !selectAll })));

  if (loading)
    return <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Loading group configuration...</div>;

  return (
    <div className={`font-sans ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-black'} p-5 max-w-[1050px] mx-auto rounded-lg`}>
      
      
      
{/* ACTIVE CONFIG */}

 <section className="mb-8">
  <h1
    className="flex items-center gap-2 text-[#f7d774] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)] text-2xl mb-3 cursor-pointer"
    onClick={() => setShowActiveConfig(!showActiveConfig)}
  >
    <Info size={18} />
    <strong>Current Active Configuration</strong>
  </h1>

  {showActiveConfig && (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between mb-2 gap-2 sm:gap-6">
        <strong>
          Default Group:{" "}
          <span className="text-green-400 font-bold">{selectedDefault}</span>
        </strong>
        <strong>
          Demo Group:{" "}
          <span className="text-sky-300 font-bold">{selectedDemoDefault}</span>
        </strong>
      </div>

      <div className={`${isDarkMode ? "bg-gray-800" : "bg-gray-200"} p-2 rounded flex flex-wrap max-h-[500px] overflow-y-auto`}>
        {groups.map((g) => (
          <Badge
            key={g.id}
            label={g.id}
            isActive={g.id === selectedDefault || g.id === selectedDemoDefault}
            isDemo={g.type === "demo"}
            isVIP={g.label.includes("(VIP)")}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Last Updated: {lastUpdated}
      </div>
    </>
  )}
</section>



      {/* GUIDE */}
      <GroupConfigurationGuideToggle isDarkMode={isDarkMode} />


      {/* GROUP OPTIONS */}
<section
  className={`
    ${isDarkMode ? "bg-gray-900" : "bg-white"}
    rounded-xl
    p-6
    mt-6
    shadow-lg
    border-2 border-yellow-400/50
    focus-within:border-yellow-400
    focus-within:shadow-[0_0_12px_rgba(250,204,21,0.6)]
    transition-all
    duration-300
  `}
  tabIndex={0}
>
  <h1 className="flex items-center gap-2 text-[#f7d774] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)] text-2xl mb-3 font-extrabold cursor-pointer">
    <Info size={18} />
    <strong>Group Options</strong>
  </h1>

  <label className={`flex items-center mb-4 font-medium hover:text-yellow-300 transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
    <input
      type="checkbox"
      checked={selectAll}
      onChange={toggleSelectAll}
      className="mr-3 w-5 h-5 rounded-lg accent-yellow-400 cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200"
    />
    Select All Groups
  </label>

  <div className="max-h-[420px] overflow-y-auto pr-3 flex flex-wrap gap-3">
  {groups.map((group) => (
    <div
      key={group.id}
      className={`
        ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}
        rounded-lg
        overflow-auto
        p-3
        border-2 border-transparent
        hover:border-yellow-400
        hover:shadow-[0_0_8px_rgba(250,204,21,0.5)]
        transform
        hover:scale-[1.01]
        hover:translate-x-1
        transition-all
        duration-500
        cursor-pointer
        w-full
      `}
    >
      <GroupItem
        group={group}
        onChange={toggleEnable}
        onRadioChange={changeDefault}
        onAliasChange={updateAlias}
        onAliasLock={onAliasLock}
        selectedDefault={selectedDefault}
        selectedDemoDefault={selectedDemoDefault}
        isDarkMode={isDarkMode}
      />
    </div>
  ))}
</div>
</section>

      
<div className="flex justify-center mt-5">
  <button
    className="
      bg-yellow-400 
      text-gray-900 
      px-4 
      py-2 
      rounded 
      font-bold 
      flex 
      items-center 
      gap-2
      relative
      overflow-hidden
      animate-pulse-gold
      shadow-lg
      transition-all
      duration-200
    "
    onClick={() => handleSaveGroupConfig(groups)}
  >
    ⚙️ Save Configuration
  </button>
</div>

<style jsx>{`
  @keyframes pulseGold {
    0% { box-shadow: 0 0 4px #facc15; }
    50% { box-shadow: 0 0 16px #fcd34d; }
    100% { box-shadow: 0 0 4px #facc15; }
  }

  .animate-pulse-gold {
    animation: pulseGold 2s infinite;
  }
`}</style>

    </div>
  );
}
