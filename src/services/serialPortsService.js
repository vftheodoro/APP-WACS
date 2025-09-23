// Serviço de portas seriais simplificado
export const listComPorts = async () => {
  return new Promise((resolve) => {
    // Simula um atraso de rede
    setTimeout(() => {
      // Retorna um único dispositivo simulado
      resolve({
        ok: true,
        ports: [{
          path: 'COM3',
          manufacturer: 'Arduino',
          vendorId: '2341',
          productId: '0043'
        }]
      });
    }, 1000); // 1 segundo de simulação
  });
};
