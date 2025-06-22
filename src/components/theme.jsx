import React, { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="bg-gray-200 dark:bg-gray-700 p-2 rounded-md focus:outline-none"
    >
      {isDarkMode ? (
        <span className="text-gray-700 dark:text-gray-200">Light Mode</span>
      ) : (
        <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
      )}
    </button>
  );
}

export default DarkModeToggle;