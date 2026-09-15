import React, { createContext, useState, useEffect } from 'react';

export const UserProfileContext = createContext(null);

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('ailifeos_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user profile from localStorage", e);
      }
    }
    return {
      userName: "Dhruv",
      agentName: "Nova",
      firstLoginDone: false,
      preferences: {}
    };
  });

  useEffect(() => {
    localStorage.setItem('ailifeos_user', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};
