import React, { useState } from "react";

const ServerConfig = () => {
  const [serverData, setServerData] = useState({
    serverIP: "188.240.63.221",
    loginID: "1054",
    password: "••••••••",
    serverName: "VTindex-MT5",
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setServerData({
      ...serverData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Server Settings:", serverData);
    alert("Server settings updated!");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Server Configuration</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-black p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,255,0,0.15)] w-full max-w-md sm:max-w-lg hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300"
      >
        {/* Server IP */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Server IP Address*</label>
          <input
            type="text"
            name="serverIP"
            value={serverData.serverIP}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base ${
              isEditing ? "bg-black" : "bg-black/50 cursor-not-allowed"
            }`}
          />
        </div>

        {/* Account Login ID */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Account Login ID*</label>
          <input
            type="text"
            name="loginID"
            value={serverData.loginID}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base ${
              isEditing ? "bg-black" : "bg-black/50 cursor-not-allowed"
            }`}
          />
        </div>

        {/* Account Password */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Account Password*</label>
          <input
            type="password"
            name="password"
            value={serverData.password}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base ${
              isEditing ? "bg-black" : "bg-black/50 cursor-not-allowed"
            }`}
          />
        </div>

        {/* Server Name */}
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Server Name*</label>
          <input
            type="text"
            name="serverName"
            value={serverData.serverName}
            onChange={handleChange}
            disabled={!isEditing}
            className={`p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base ${
              isEditing ? "bg-black" : "bg-black/50 cursor-not-allowed"
            }`}
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          {isEditing && (
            <button
              type="submit"
              className="flex-1 sm:flex-none bg-yellow-500 text-black py-2 px-4 rounded-full hover:bg-yellow-600 transition-all"
            >
              Save Changes
            </button>
          )}
          <button
            type="button"
            onClick={handleEditToggle}
            className="flex-1 sm:flex-none bg-yellow-500 text-black py-2 px-4 rounded-full hover:bg-yellow-600 transition-all"
          >
            {isEditing ? "Cancel" : "✏️ Edit Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServerConfig;
