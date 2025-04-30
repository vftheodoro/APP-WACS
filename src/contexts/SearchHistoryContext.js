import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchHistoryContext = createContext();

export const SearchHistoryProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const addToHistory = async (place) => {
    try {
      const newHistory = [
        { ...place, timestamp: new Date().toISOString() },
        ...searchHistory.filter(item => item.place_id !== place.place_id)
      ].slice(0, 10); // Mantém apenas os 10 mais recentes

      setSearchHistory(newHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  return (
    <SearchHistoryContext.Provider
      value={{
        searchHistory,
        loadSearchHistory,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </SearchHistoryContext.Provider>
  );
};

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory deve ser usado dentro de um SearchHistoryProvider');
  }
  return context;
}; 