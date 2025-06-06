# APP-WACS: Controle e Navegação de Cadeira de Rodas

Aplicativo móvel desenvolvido em React Native e Expo para controle e navegação de cadeiras de rodas, com foco em acessibilidade, experiência do usuário e eficiência.

## ✨ Features Principais

- **Gerenciamento de Perfil do Usuário:** Visualize e edite suas informações pessoais e foto de perfil.
- **Conexão Bluetooth:** Busque e conecte-se à sua cadeira de rodas via Bluetooth.
- **Controle da Cadeira:** Interface para controlar os movimentos da cadeira de rodas.
- **Navegação e Rastreamento:** Funcionalidades de mapa, cálculo de rotas e histórico (baseado no README anterior).
- **Assistente Virtual:** Interface para interação com um assistente (Chat).
- **Locais Salvos:** Gerencie locais favoritos (baseado no README anterior).
- **Tema Dinâmico:** Alternância entre temas claro e escuro (Temporariamente desativado no perfil, mas funcional na app).

## 🚀 Tecnologias Utilizadas

- React Native
- Expo
- Bluetooth Low Energy (BLE)
- LinearGradient
- @react-navigation
- Outras dependências listadas no `package.json`.

## 📋 Pré-requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior ou Yarn
- Expo CLI
- Um dispositivo Android ou iOS para testar a conexão Bluetooth.

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/VTheodoro/APP-WACS.git
cd APP-WACS
```

2. Instale as dependências:
```bash
yarn install # ou npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto (consulte o `.env.example` se disponível).
- Adicione as variáveis necessárias (e.g., para Firebase, Mapbox - consulte o código-fonte para saber quais são usadas).

4. Inicie o aplicativo:
```bash
yarn start # ou npm start
```

5. Use o aplicativo Expo Go no seu dispositivo móvel para escanear o QR code e abrir o projeto.

## 📸 Screenshots

Aqui estão algumas telas do aplicativo:

### Tela Inicial
![Tela Inicial](Imagens/Tela%20Inicial.png)

### Tela de Conexão
![Tela de Conexão](Imagens/Tela%20de%20Conexao.png)

### Tela de Controle
![Tela de Controle](Imagens/Tela%20de%20Controle.png)

### Tela de Perfil
![Tela de Perfil](Imagens/Tela%20de%20Perfil.png)

## 🛠️ Estrutura do Projeto

```
src/
├── app/                    # Configurações do app e ponto de entrada
├── assets/                 # Recursos estáticos
├── components/             # Componentes reutilizáveis
├── config/                 # Configurações globais
├── constants/              # Constantes e enums
├── contexts/               # Contextos globais (Auth, Theme, Bluetooth)
├── hooks/                  # Custom hooks
├── navigation/             # Configuração de navegação
├── screens/                # Telas da aplicação
├── services/               # Serviços e APIs
├── store/                  # Gerenciamento de estado (se usado)
├── theme/                  # Temas e estilos globais
└── utils/                  # Funções utilitárias
```

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Contribuição

Se você gostaria de contribuir, por favor, crie um Fork do repositório e envie um Pull Request com suas alterações.