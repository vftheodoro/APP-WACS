import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ArrowButtonProps {
  direction: Direction;
  onCommand: (command: { move: Direction }) => void;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({ direction, onCommand }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    // Envia o comando imediatamente ao pressionar
    onCommand({ move: direction });

    // Configura o intervalo para enviar o comando a cada 100ms
    intervalRef.current = setInterval(() => {
      onCommand({ move: direction });
    }, 100);
  };

  const handlePressOut = () => {
    // Limpa o intervalo ao soltar
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Limpa o intervalo se o componente for desmontado enquanto pressionado
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{direction.toUpperCase()}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    margin: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ArrowButton; 