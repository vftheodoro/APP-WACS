import React, { createContext, useState, useContext } from 'react';

export const lightTheme = {
  colors: {
    primary: '#007BFF', // Azul primário
    background: '#FFFFFF', // Fundo claro
    text: '#000000', // Texto escuro
    card: '#F8F9FA', // Cartões claros
    border: '#CED4DA', // Bordas claras
    notification: '#FF3B30', // Cor de notificação
  },
};

export const darkTheme = {
  colors: {
    primary: '#007BFF', // Azul primário (pode ajustar se quiser um azul diferente no tema escuro)
    background: '#121212', // Fundo escuro
    text: '#FFFFFF', // Texto claro
    card: '#1E1E1E', // Cartões escuros
    border: '#3A3A3A', // Bordas escuras
    notification: '#FF4500', // Cor de notificação
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === lightTheme ? darkTheme : lightTheme
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 