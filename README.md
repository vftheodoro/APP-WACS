# WACS - Wheelchair Automation Control System

**WACS** (Wheelchair Automation Control System) é um projeto inovador para o controle de uma **cadeira de rodas automatizada**. O aplicativo foi desenvolvido para proporcionar **mobilidade e acessibilidade** a pessoas com deficiência, permitindo o controle da cadeira de rodas via **Bluetooth** e fornecendo funcionalidades de **mapeamento urbano acessível**. Ele é colaborativo, permitindo que os usuários compartilhem informações sobre **locais acessíveis**, **rotas**, e **estabelecimentos**.

## Funcionalidades

- **Controle da Cadeira de Rodas**: Controle via Bluetooth para movimentação da cadeira de rodas automatizada.
- **Mapeamento Acessível**: Visualização de locais acessíveis e rotas adequadas para pessoas com deficiência.
- **Cadastro Colaborativo de Locais**: Usuários podem adicionar, editar e votar em locais acessíveis.
- **Filtros de Acessibilidade**: Filtros para visualizar diferentes tipos de acessibilidade (rampas, elevadores, etc.).
- **Geolocalização e Navegação**: Localização em tempo real e sugestões de rotas acessíveis usando **Google Maps**.
- **Notificações e Alertas**: Receba notificações sobre novos locais acessíveis ou atualizações de rotas.
- **Perfis de Usuário**: Criação de perfis personalizados com preferências e sistema de pontos.
- **Tema Claro/Escuro**: Suporte para alternar entre temas claros e escuros para melhorar a experiência de uso.

## Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento de aplicativos móveis.
- **Expo**: Plataforma para facilitar o desenvolvimento com React Native.
- **TypeScript**: Superset do JavaScript para maior segurança de tipos.
- **Google Maps API**: Para exibição de mapas e geolocalização.
- **Firebase**: Para autenticação de usuários e armazenamento de dados.
- **WebSocket**: Para comunicação em tempo real com a cadeira de rodas.
- **AsyncStorage**: Para armazenamento local de dados no dispositivo.
- **React Navigation**: Para navegação entre as telas do aplicativo.
- **React Context API**: Para gerenciamento de estado global (tema, autenticação, preferências).
- **Socket.io-client**: Para comunicação com o backend em tempo real.
- **React Native Vector Icons**: Para exibição de ícones no app.

## Instruções de Uso

### 1. Clonando o Repositório

Primeiro, clone o repositório para o seu computador:

```bash
git clone https://github.com/seu-usuario/wacs-app.git
cd wacs-app
