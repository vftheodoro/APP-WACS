# APP-WACS

Aplicativo de navegação desenvolvido em React Native com foco em experiência do usuário e eficiência.

## 🚀 Funcionalidades

- Navegação em tempo real
- Rastreamento de localização
- Cálculo de rotas
- Instruções de navegação
- Modos de transporte
- Histórico de rotas
- Favoritos
- Configurações personalizadas

## 📋 Pré-requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior
- Expo CLI
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/app-wacs.git
cd app-wacs
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo .env na raiz do projeto
- Adicione as seguintes variáveis:
```
MAPBOX_ACCESS_TOKEN=seu_token
FIREBASE_API_KEY=sua_chave
FIREBASE_AUTH_DOMAIN=seu_dominio
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_STORAGE_BUCKET=seu_bucket
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=seu_app_id
```

4. Inicie o aplicativo:
```bash
npm start
```

## 🛠️ Desenvolvimento

### Estrutura do Projeto
```
src/
├── app/                    # Configurações do app e ponto de entrada
├── assets/                 # Recursos estáticos
├── components/             # Componentes reutilizáveis
├── config/                 # Configurações globais
├── constants/              # Constantes e enums
├── hooks/                  # Custom hooks
├── navigation/             # Configuração de navegação
├── screens/                # Telas da aplicação
├── services/               # Serviços e APIs
├── store/                  # Gerenciamento de estado
├── theme/                  # Temas e estilos globais
└── utils/                  # Funções utilitárias
```

### Padrões de Código
- Componentes funcionais com hooks
- Separação de lógica em custom hooks
- Componentes pequenos e focados
- PropTypes para tipagem
- StyleSheet.create para estilos
- Temas centralizados

### Testes
- Jest para testes unitários
- React Native Testing Library
- Cobertura mínima de 80%

## 📚 Documentação

A documentação completa está disponível na pasta `Documentos/`:
- `1-Configuracao/` - Documentação principal
- `2-Desenvolvimento/` - Guia de desenvolvimento
- `3-Testes/` - Guia de testes

## 📦 Deploy

1. Build:
```bash
npm run build:android
npm run build:ios
```

2. Publicação:
- Expo publish
- Google Play Store
- Apple App Store

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 📞 Contato

Seu Nome - seu.email@exemplo.com
Link do Projeto: https://github.com/seu-usuario/app-wacs 