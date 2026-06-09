# Locais e Roteiros

Módulo operacional para gestão de locais de entrega e criação de roteiros para motoristas.

## Funcionalidades Principais

- **Gestão de Locais:** Cadastro, edição, listagem e remoção de locais (pontos de parada, entregas, clientes).
- **Construtor de Roteiros:** Seleção de locais para compor uma rota específica para os motoristas.
- **Identificação com Cidades e Endereços:** Integração com dados de cidades e suporte completo para inserção de endereço físico.
- **Tags e Filtragem:** Atribuição de tags aos locais para busca e filtragem eficientes.
- **Formatação de Rota:** Geração formatada de mensagens de instrução de rota pronta para compartilhamento via WhatsApp e outros canais.

## Tecnologias Utilizadas

- **Frontend:** React, React DOM, Tailwind CSS (v4), Vite.
- **Animações & Layout:** Framer Motion (via `motion`), Lucide React para ícones.
- **Drag and Drop:** `@hello-pangea/dnd` para organização dinâmica dos roteiros.
- **Armazenamento e Backend:** Firebase para banco de dados e autenticação de usuários, Express para custom API.
- **Tipagem:** TypeScript.

## Acesso Rápido

Durante o desenvolvimento do código:

```bash
# Instalação de dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev

# Fazer a compilação de produção
npm run build
```

## Estrutura do App

- **`src/components/`**: Componentes reutilizáveis (UI, modais, formulários, rotas).
- **`src/contexts/`**: Contextos React (por ex. `AuthContext` para gerenciamento de sessão).
- **`src/hooks/`**: Custom hooks (ex. `usePlaces`, `useToast`).
- **`src/lib/`**: Utilitários (ex. funções de formatação `formatter.ts`).
- **`src/pages/`**: Páginas da aplicação como o `Dashboard.tsx`.
- **`src/services/`**: Camada de serviço conectada ao Firebase, APIs e ferramentas externas como o IBGE.

## Atualizações Recentes

- Adicionado suporte estrutural ao campo `Endereço` detalhado para cadastros de destinos.
- Ajuste das exibições de cidade (UF) nos cards de locais, listas e conector de rotas.
- Formatação de mensagem de Rota atualizada para incluir endereço dinâmico caso presente.
