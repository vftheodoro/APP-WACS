# APP-WACS: Controle e Navegação de Cadeira de Rodas

## 🧐 Como o APP-WACS Funciona?

O APP-WACS é um aplicativo completo para pessoas com mobilidade reduzida, cuidadores e familiares. Ele permite:

- **Controlar cadeiras de rodas motorizadas** via Bluetooth, com interface intuitiva e comandos em tempo real.
- **Explorar e avaliar locais acessíveis** próximos, visualizando no mapa ou em lista, com filtros inteligentes por tipo e acessibilidade.
- **Ver a distância real** até cada local, calculada automaticamente a partir da sua localização atual.
- **Adicionar novos locais acessíveis** com sugestão automática de endereço e tipo, ajudando a comunidade.
- **Consultar detalhes completos** de cada local: avaliações, recursos de acessibilidade, fotos, autor, data de cadastro e rota até o destino.
- **Gerenciar seu perfil**, editar dados e foto, e acompanhar seu histórico de interações.
- **Navegar com rotas acessíveis** e receber instruções para chegar ao destino.
- **Utilizar assistente virtual** para dúvidas e suporte.

### **Fluxo típico de uso:**
1. O usuário abre o app e se conecta à sua cadeira de rodas (opcional).
2. Visualiza locais acessíveis próximos, filtrando por tipo (restaurante, hotel, escola, etc.) e recursos de acessibilidade (rampa, banheiro adaptado, etc.).
3. Consulta detalhes, avaliações e distância de cada local.
4. Traça rota até o local desejado ou adiciona um novo local acessível.
5. Pode controlar a cadeira de rodas pelo app, acessar o perfil e interagir com o assistente virtual.

### **Diferenciais:**
- Interface moderna, responsiva e acessível.
- Cálculo de distância local, sem custos de API.
- Comunidade colaborativa: qualquer usuário pode sugerir e avaliar locais.
- Foco total em acessibilidade e experiência do usuário.

---

## ✨ Features Principais

- **Gerenciamento de Perfil do Usuário:** Visualize e edite suas informações pessoais e foto de perfil.
- **Conexão Bluetooth:** Busque e conecte-se à sua cadeira de rodas via Bluetooth.
- **Controle da Cadeira:** Interface para controlar os movimentos da cadeira de rodas.
- **Navegação e Rastreamento:** Mapa interativo, cálculo de rotas, busca de locais e histórico.
- **Locais Acessíveis:** Lista, filtro, avaliação e cadastro de locais acessíveis, com cálculo de distância local.
- **Assistente Virtual:** Interface para interação com um assistente (Chat).
- **Tema Dinâmico:** Alternância entre temas claro e escuro.

---

## 🌐 Sistema de Feed Social e Comunidade

O APP-WACS conta com um sistema de feed social moderno, projetado para promover a interação, colaboração e engajamento entre os membros da comunidade. O feed está disponível tanto no aplicativo quanto na versão web, sempre integrado ao Firebase para garantir segurança, escalabilidade e sincronização em tempo real.

### **Principais Funcionalidades:**

- **Publicação de Posts:** Usuários autenticados podem criar posts com texto e/ou imagem, compartilhando experiências, dicas e novidades com a comunidade.
- **Upload de Imagens:** As imagens dos posts são enviadas para o Firebase Storage e exibidas automaticamente no feed, com visualização em tela cheia ao tocar/clicar.
- **Curtidas e Comentários:** É possível curtir/descurtir posts e comentar, promovendo discussões e reconhecimento entre os usuários.
- **Deleção e Edição:** O autor do post pode editar ou deletar seus próprios posts, incluindo a remoção da imagem associada no Storage.
- **Feedback Visual:** Todas as ações (postar, curtir, comentar, deletar) exibem notificações visuais (Toast) para garantir clareza e boa experiência.
- **Feed em Tempo Real:** O feed é atualizado automaticamente sempre que um novo post, curtida ou comentário é adicionado, sem necessidade de recarregar a tela.
- **Datas Relativas:** As datas dos posts são exibidas de forma amigável (“Hoje, HH:mm”, “Ontem”, “X dias atrás”).
- **Acessibilidade e Visual Moderno:** Cards com sombras, bordas arredondadas, animações suaves e botões intuitivos garantem uma experiência acessível e agradável.

### **Experiência Unificada App + Web**

- O sistema de feed foi cuidadosamente adaptado para funcionar de forma equivalente no app e no site, mantendo a mesma lógica, permissões e experiência visual.
- O upload e exibição de imagens, bem como as notificações de sucesso/erro, funcionam de maneira consistente em todas as plataformas.

### **Tecnologias Utilizadas**

- **Firebase Firestore:** Armazenamento dos posts, curtidas e comentários.
- **Firebase Storage:** Upload e hospedagem das imagens dos posts.
- **Firebase Auth:** Controle de autenticação e permissões.
- **React Native (App) e HTML/JS (Web):** Interfaces modernas, responsivas e acessíveis.

---

## 🚀 Tecnologias Utilizadas

- React Native
- Expo
- Firebase (Firestore, Auth, Storage)
- Bluetooth Low Energy (BLE)
- LinearGradient
- @react-navigation
- Outras dependências listadas no `package.json`

---

## 📋 Pré-requisitos

- Node.js 16.x ou superior
- npm 7.x ou superior ou Yarn
- Expo CLI
- Um dispositivo Android ou iOS para testar a conexão Bluetooth

---

## 🔧 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/VTheodoro/APP-WACS.git
cd APP-WACS
```
2. **Instale as dependências:**
```bash
yarn install # ou npm install
```
3. **Configure as variáveis de ambiente:**
- Crie um arquivo `.env` na raiz do projeto (consulte o `.env.example` se disponível).
- Adicione as variáveis necessárias (Firebase, Mapbox, etc.).
4. **Inicie o aplicativo:**
```bash
yarn start # ou npm start
```
5. **Abra no dispositivo:**
- Use o aplicativo Expo Go para escanear o QR code e abrir o projeto.

---

## 📚 Estrutura Detalhada do Projeto

O projeto está organizado para máxima escalabilidade, manutenibilidade e clareza, seguindo padrões profissionais de arquitetura React Native.

```
src/
├── app/                    # Configurações do app e ponto de entrada
├── assets/                 # Recursos estáticos (imagens, sons, logos)
├── components/             # Componentes reutilizáveis e especializados
│   ├── common/             # Elementos genéricos (AppHeader, botões, inputs)
│   ├── mapas/              # Componentes para telas de mapa (CustomMarker, MapControls, etc.)
│   ├── ReviewModal.js      # Modal para avaliações
│   ├── SearchBar.js        # Barra de pesquisa com autocomplete
│   └── ProfilePicture*.js  # Upload e gerenciamento de foto de perfil
├── config/                 # Configurações globais (Firebase, constantes)
├── constants/              # Constantes e enums
├── context/                # Contextos globais (Auth)
├── contexts/               # Contextos globais (Bluetooth, Theme, Chat, SearchHistory)
├── hooks/                  # Custom hooks
├── navigation/             # Navegação do app (AppNavigator, AuthNavigator)
├── routes/                 # Definição de rotas
├── screens/                # Telas principais do app
│   ├── LocationsListScreen.js      # Lista de locais acessíveis
│   ├── MapScreen.js                # Mapa interativo
│   ├── LocationDetailScreen.js     # Detalhes de local
│   ├── AddLocationScreen.js        # Adição de local
│   ├── SelectLocationMapScreen.js  # Seleção de local no mapa
│   ├── MainSelectionScreen.js      # Tela de seleção principal
│   ├── UserProfileScreen.js        # Perfil do usuário
│   ├── ControlScreen.js            # Controle da cadeira via Bluetooth
│   ├── ConnectionScreen.js         # Tela de conexão Bluetooth
│   ├── SplashScreen.js             # Tela de carregamento
│   ├── auth/                       # Telas de autenticação
│   └── social/                     # Telas sociais
├── services/               # Serviços e integrações externas
│   ├── firebase/           # Integração com Firebase
│   ├── location/           # Serviços de localização
│   ├── profilePictureService.js
│   └── storage.js
├── store/                  # Gerenciamento de estado (Redux ou Context API)
│   ├── slices/             # Slices de estado
│   └── index.js
├── theme/                  # Temas e estilos globais (Colors, Typography, etc.)
├── utils/                  # Funções utilitárias (mapUtils, storage, theme)
└── ...
```

### **Exemplo de fluxo de tela:**
1. **SplashScreen** → **MainSelectionScreen** → **LocationsListScreen** → **LocationDetailScreen**
2. **UserProfileScreen** para edição de perfil e foto
3. **ControlScreen** para controle da cadeira via Bluetooth

### **Destaques Arquiteturais**
- **Componentização extrema:** Tudo que é reutilizável está em `components/`.
- **Separação de responsabilidades:** Serviços, utilitários, temas, contextos e navegação bem separados.
- **Pronto para escalar:** Fácil adicionar novas telas, temas, integrações e lógica de negócio.

---

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

---

## 🆕 Changelog Visual e Funcional - Lista de Locais

### 🔥 Melhorias Visuais e UX

- **Cards Modernos e Profissionais:**
  - Sombra suave e realista, cantos mais arredondados e padding interno maior.
  - Borda colorida sutil (ou glow) para destacar status, sem poluir.
  - Imagem com overlay escuro e recorte arredondado.
  - Badge de distância padronizada: chip moderno, azul, com sombra, fonte bold e ícone alinhado, sempre no canto inferior direito da imagem.
  - Badge de status (avaliação) agora exibe **apenas o emoji de rosto** (😃, 🙂, 😐, 😞, 🆕), sem texto, para leitura visual rápida e intuitiva.
  - Classificação por estrelas (nota) movida para **abaixo do endereço**, dentro do conteúdo do card, para não sobrepor a foto.
  - Ícones de acessibilidade menores, mais espaçados e com fundo suave.
  - Fonte bold para nome, leve para endereço.
  - Responsividade aprimorada para diferentes tamanhos de tela.

### ⚡ Melhorias Funcionais

- **Cálculo de Distância Local:**
  - Distância entre usuário e local calculada localmente (Haversine), sem uso de APIs externas.
  - Suporte a diferentes formatos de campo de localização no Firestore (`latitude/longitude` separados, array, string, objeto).
  - Exibição da distância apenas quando os dados são válidos.

- **Filtros Inteligentes:**
  - Filtros de tipo e acessibilidade com chips dinâmicos, seleção múltipla e badges de contagem.
  - Modal de filtro visual moderno.

- **Barra de Pesquisa Profissional:**
  - Flat, com autocomplete, sugestão de adicionar novo local e integração visual com o header.

- **Remoção de Debugs e Alertas:**
  - Todos os logs e alertas de debug removidos para produção.

- **Código Modular e Escalável:**
  - Componentização e organização para fácil manutenção e evolução.

---

Essas melhorias tornam a experiência do usuário mais fluida, moderna e acessível, elevando o padrão visual e funcional do app para o nível dos melhores aplicativos do mercado.

---

## 🆕 Novas Funcionalidades de Navegação no Mapa

- **Rota temporária ao segurar no mapa:**
  - Ao pressionar e segurar em qualquer ponto do mapa, uma linha tracejada é desenhada entre sua localização atual e o ponto selecionado.
  - Um painel de confirmação aparece na parte inferior perguntando se deseja ver os detalhes da rota.
  - Se confirmar, o modal de detalhes da rota é aberto; se cancelar, a linha desaparece.

- **Confirmação antes de abrir detalhes da rota:**
  - Evita abrir o modal de rota acidentalmente, tornando a experiência mais fluida e controlada.

- **Modal de detalhes de rota com IA de acessibilidade:**
  - Mostra endereço de origem e destino, miniatura do trajeto, distância, tempo, elevação e análise inteligente de acessibilidade (escadas, rampas, plano).
  - Instruções detalhadas podem ser expandidas sob demanda.

- **Modo de navegação profissional:**
  - Ao iniciar navegação, um painel fixo na parte inferior exibe o passo atual, instrução, ícone de manobra, distância, tempo e avisos visuais (ex: escada/rampa).
  - O segmento atual da rota é destacado com cor conforme a elevação (verde, amarelo, vermelho), enquanto o restante aparece em cinza claro.
  - Controles grandes e acessíveis para pausar, cancelar e centralizar no usuário.
  - Layout limpo, responsivo e acessível, com foco em experiência para cadeirantes.

---

## 🏆 Sistema de Gamificação, Perfil e Contribuições

O APP-WACS conta com um sistema de gamificação moderno e motivador, que valoriza cada contribuição do usuário para a comunidade. Veja como funciona:

### 🎯 Como ganhar pontos (XP)
- **Avaliar um local:** +10 XP por avaliação
- **Adicionar um local acessível:** +30 XP
- **Outras ações (fotos, reports, etc):** XP variável (ver código)

### ⭐ Níveis e Progresso
- O usuário sobe de nível a cada 50 XP (Nível 1: 0 XP, Nível 2: 50 XP, Nível 3: 100 XP, ...)
- O nível é exibido de forma destacada no perfil e no header, com um badge colorido na foto de perfil (bronze, prata, ouro, azul, roxo)
- O progresso para o próximo nível é mostrado por uma barra e um arco circular ao redor da foto

### 🥇 Badges e Conquistas
- Badges especiais são concedidos por marcos (ex: 10 fotos, 100 avaliações, etc)
- Os badges aparecem no perfil, exceto o de "Primeiros Passos" (substituído por um card de contribuições)

### 📊 Card de Contribuições
- Mostra o total de contribuições (avaliações + locais adicionados)
- Exibe separadamente o número de avaliações e de locais
- Mensagem motivacional personalizada conforme o engajamento
- Visual premium, com ícones, sombra e destaque

### 🔔 Notificações e Visual
- Ícone de notificação no header da tela principal
- Badge de nível na foto de perfil do header
- Layouts modernos, responsivos e acessíveis

### 👤 Edição de Perfil
- O usuário pode editar todos os dados pessoais em um formulário compacto e moderno
- A opção de trocar foto de perfil aparece apenas fora do modo de edição, evitando duplicidade
- O aceite dos termos aparece logo acima dos botões de salvar/cancelar
- O espaçamento entre campos foi reduzido para facilitar o preenchimento

### 🧠 Como funciona por trás
- O XP, nível, badges e contribuições são calculados automaticamente ao logar ou realizar ações
- O sistema é centralizado, fácil de manter e expandir
- Não há mais streaks diários, tornando o progresso mais simples e motivador

### 📱 Exemplo de fluxo:
1. O usuário avalia um local → ganha XP → barra e badge de nível atualizam instantaneamente
2. Adiciona um local → XP e contribuições aumentam, card de contribuições é atualizado
3. Ao editar o perfil, só vê a opção de trocar foto fora do modo de edição

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Para contribuir:
1. Faça um Fork do repositório
2. Crie uma branch para sua feature ou correção
3. Envie um Pull Request detalhando suas alterações

---

Desenvolvido por [VTheodoro](https://github.com/VTheodoro)