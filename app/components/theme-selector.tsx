import React from "react";
import { useTheme, type Theme } from "~/lib/theme-context";

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <div>
      <span className="font-mono font-medium mb-4 block">Theme Preference</span>
      <div className="space-y-3">
        <label className="field-inline">
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === "light"}
            onChange={() => handleThemeChange("light")}
            className="w-4 h-4"
          />
          <span className="font-mono">Light Mode</span>
        </label>

        <label className="field-inline">
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === "dark"}
            onChange={() => handleThemeChange("dark")}
            className="w-4 h-4"
          />
          <span className="font-mono">Dark Mode</span>
        </label>

        <label className="field-inline">
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === "system"}
            onChange={() => handleThemeChange("system")}
            className="w-4 h-4"
          />
          <span className="font-mono">Match System Settings</span>
        </label>
      </div>
    </div>
  );
};

export default ThemeSelector;
