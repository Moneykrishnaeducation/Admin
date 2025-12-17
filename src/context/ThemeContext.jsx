import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // 🔥 Sync body class + scrollbar styles
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);

    document.documentElement.style.setProperty(
      "--scrollbar-track",
      isDarkMode ? "#111" : "#f0f0f0"
    );
    document.documentElement.style.setProperty(
      "--scrollbar-border",
      isDarkMode ? "#111" : "#f0f0f0"
    );
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
