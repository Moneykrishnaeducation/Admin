import React from "react";
import ReactDOM from "react-dom/client";
import ManagerApp from "./ManagerApp.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("manager-root")).render(
  <React.StrictMode>
    <ManagerApp />
  </React.StrictMode>
);
