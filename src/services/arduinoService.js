// Substitua pelo IP da sua máquina na rede local
// Exemplo: 'http://192.168.1.100:3001'
// Para descobrir seu IP no Windows: abra o prompt de comando e digite 'ipconfig'
const ARDUINO_SERVER_URL = 'http://192.168.1.100:3001';

// Função para simular conexão em desenvolvimento
const simulateConnection = () => {
  console.log('Simulando conexão com o Arduino...');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Conexão simulada com sucesso!');
      resolve({ success: true, port: 'COM3' });
    }, 1000);
  });
};

export const connectToArduino = async (port) => {
  try {
    console.log(`Tentando conectar ao Arduino na porta ${port}...`);
    
    // Em desenvolvimento, usa a simulação
    if (__DEV__) {
      console.log('Modo de desenvolvimento: usando simulação de conexão');
      return await simulateConnection();
    }
    
    // Em produção, tenta conectar ao servidor
    console.log(`Conectando a ${ARDUINO_SERVER_URL}...`);
    const response = await fetch(`${ARDUINO_SERVER_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: port })
    });
    
    const result = await response.json();
    console.log('Resposta do servidor:', result);
    
    if (result && result.ok) {
      console.log('Enviando comando de conexão...');
      await sendCommand('conectar');
      return { success: true, port: result.path };
    }
    
    return { 
      success: false, 
      error: result?.error || 'Falha ao conectar ao Arduino' 
    };
  } catch (error) {
    console.error('Erro ao conectar ao Arduino:', error);
    return { 
      success: false, 
      error: `Erro de rede: ${error.message}. Verifique se o servidor está rodando em ${ARDUINO_SERVER_URL}` 
    };
  }
};

export const sendCommand = async (command) => {
  try {
    console.log(`Enviando comando: ${command}`);
    
    // Em desenvolvimento, retorna sucesso imediatamente
    if (__DEV__) {
      console.log(`[SIMULAÇÃO] Comando "${command}" enviado com sucesso`);
      return true;
    }
    
    const response = await fetch(`${ARDUINO_SERVER_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg: command })
    });
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Erro ao enviar comando:', error);
    return false;
  }
};

export const checkConnection = async () => {
  try {
    // Em desenvolvimento, sempre retorna true
    if (__DEV__) {
      console.log('[SIMULAÇÃO] Verificação de conexão: verdadeiro');
      return true;
    }
    
    const response = await fetch(`${ARDUINO_SERVER_URL}/status`);
    const status = await response.json();
    return status.serialOpen;
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    return false;
  }
};
