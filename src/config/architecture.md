# Arquitetura do Projeto

## Estrutura de Diretórios

```
src/
├── app/                    # Configurações do app e ponto de entrada
├── assets/                 # Recursos estáticos (imagens, fontes, etc)
├── components/             # Componentes reutilizáveis
│   ├── common/            # Componentes genéricos
│   ├── maps/              # Componentes específicos de mapas
│   └── navigation/        # Componentes de navegação
├── config/                # Configurações globais
├── constants/             # Constantes e enums
├── hooks/                 # Custom hooks
├── navigation/            # Configuração de navegação
├── screens/               # Telas da aplicação
├── services/              # Serviços e APIs
│   ├── api/              # Integrações com APIs externas
│   ├── firebase/         # Serviços do Firebase
│   └── location/         # Serviços de localização
├── store/                 # Gerenciamento de estado
│   ├── slices/           # Redux slices
│   └── selectors/        # Redux selectors
├── theme/                 # Temas e estilos globais
└── utils/                 # Funções utilitárias
```

## Padrões e Boas Práticas

### 1. Componentes
- Usar componentes funcionais com hooks
- Separar lógica em custom hooks
- Manter componentes pequenos e focados
- Usar PropTypes ou TypeScript para tipagem

### 2. Estado
- Usar Redux Toolkit para estado global
- Context API para estado de UI
- useState para estado local
- useReducer para estado complexo

### 3. Estilização
- Usar StyleSheet.create
- Temas centralizados
- Componentes de UI reutilizáveis
- Animações otimizadas

### 4. Navegação
- Navegação baseada em tipos
- Deep linking configurado
- Transições otimizadas
- Estado de navegação gerenciado

### 5. Performance
- Lazy loading de telas
- Memoização de componentes
- Otimização de renderização
- Gerenciamento de memória

### 6. Testes
- Testes unitários para componentes
- Testes de integração para fluxos
- Testes E2E para cenários críticos
- Cobertura mínima de 80%

### 7. Segurança
- Validação de inputs
- Sanitização de dados
- Gerenciamento de tokens
- Proteção de rotas

### 8. CI/CD
- Pipeline automatizado
- Testes automatizados
- Deploy contínuo
- Monitoramento

## Fluxo de Desenvolvimento

1. **Setup**
   - Clonar repositório
   - Instalar dependências
   - Configurar ambiente

2. **Desenvolvimento**
   - Criar branch feature
   - Implementar feature
   - Escrever testes
   - Fazer code review

3. **Testes**
   - Rodar testes unitários
   - Rodar testes de integração
   - Verificar cobertura
   - Testar em diferentes dispositivos

4. **Deploy**
   - Merge para main
   - Build automático
   - Deploy para ambiente
   - Monitoramento

## Dependências Principais

- React Native
- React Navigation
- Redux Toolkit
- Firebase
- React Native Maps
- Jest
- React Native Testing Library
- React Native Reanimated
- React Native Gesture Handler 