# Op.Log — Locais e Roteiros

Aplicação web para **cadastro, organização e utilização operacional de locais de entrega e roteiros**, desenvolvida com foco em rotinas de transporte e logística.

O **Op.Log — Locais e Roteiros** centraliza informações de clientes, fornecedores e pontos de parada em uma interface única, permitindo localizar rapidamente destinos, organizar conjuntos de locais e transformar seleções em roteiros prontos para uso operacional e compartilhamento.

> Projeto desenvolvido por Luís Martins como uma ferramenta voltada à organização de operações de transporte.

## Visão geral

Na operação de transporte, informações de endereço e particularidades de entrega costumam ficar espalhadas em planilhas, mensagens e anotações. O objetivo deste projeto é concentrar essas informações em um ambiente estruturado e facilitar o trabalho cotidiano de quem programa, acompanha ou executa rotas.

O fluxo principal da aplicação é:

**Cadastrar local → organizar informações → pesquisar/filtrar → selecionar destinos → montar roteiro → compartilhar as instruções.**

A aplicação também mantém recursos de autenticação, preferências de visualização, favoritos, contador de utilização em roteiros e importação/exportação dos dados.

## Funcionalidades

### 📍 Gestão de locais

- Cadastro de novos locais.
- Edição de registros existentes.
- Exclusão individual ou em lote.
- Seleção múltipla de locais.
- Visualização em **grade** ou **lista**.
- Pesquisa por informações do cadastro.
- Ordenação dos registros.
- Identificação de cidade e UF.
- Cadastro de endereço e informações complementares.
- Cadastro de razão social e nome fantasia.
- Tags para classificação e filtragem.
- Observações operacionais categorizadas.
- Marcação de locais como favoritos.
- Contador de quantas vezes um local foi utilizado em roteiros.
- Acesso rápido ao endereço no Google Maps quando houver link cadastrado.

### 🗺️ Montagem de roteiros

O construtor de roteiros permite selecionar diversos locais e organizá-los em uma sequência operacional.

Recursos relacionados:

- Seleção de múltiplos destinos.
- Organização da sequência dos locais.
- Construção de roteiro a partir dos locais selecionados.
- Registro de utilização dos locais em roteiros.
- Remoção de locais da seleção sem precisar sair do construtor.
- Geração de mensagem formatada para utilização operacional.
- Compartilhamento do roteiro por canais como WhatsApp.

### 🔎 Pesquisa e organização

A tela principal foi estruturada para facilitar o trabalho com grandes conjuntos de locais:

- Busca textual.
- Filtros e classificação por dados cadastrados.
- Visualização em cards ou tabela.
- Seleção em massa.
- Ações contextuais para os registros selecionados.
- Favoritos para destacar locais recorrentes.
- Ordenação conforme preferência de utilização.

### 📤 Importação e exportação

Os dados dos locais podem ser transportados entre ambientes por meio de arquivos JSON.

**Exportação**
- Geração de arquivo `locais_exportados.json`.
- Exportação dos dados dos locais sem os identificadores internos de usuário e metadados de criação/atualização.

**Importação**
- Leitura de arquivo JSON.
- Validação básica do formato.
- Importação em lote dos locais.
- Feedback visual sobre sucesso ou erro da operação.

### 🔐 Autenticação

A aplicação possui fluxo de autenticação integrado ao Firebase.

- Login de usuário.
- Controle de sessão.
- Proteção da área principal da aplicação.
- Associação dos registros ao usuário autenticado.
- Logout.
- Contexto React dedicado para gerenciamento de autenticação.

### 🎨 Interface e experiência

- Interface responsiva para desktop e dispositivos menores.
- Tema claro e escuro.
- Preferência de tema persistida no navegador.
- Componentes modais para operações importantes.
- Confirmação adicional para exclusões em massa.
- Notificações de sucesso, informação e erro.
- Ícones com Lucide React.
- Animações e transições com Motion.
- Componentes de interface reutilizáveis.
- Navegação adaptada para desktop e mobile.

## Arquitetura

O projeto utiliza uma arquitetura frontend baseada em React + TypeScript, organizada por responsabilidade.

### Estrutura principal

```text
.
├── public/                  # Arquivos públicos da aplicação
├── assets/                  # Recursos e materiais auxiliares
├── src/
│   ├── components/          # Componentes reutilizáveis e componentes de negócio
│   ├── contexts/            # Contextos React, incluindo autenticação
│   ├── hooks/               # Hooks personalizados
│   ├── lib/                 # Funções utilitárias e formatação
│   ├── pages/               # Páginas principais da aplicação
│   ├── services/            # Firebase, IBGE e demais integrações
│   ├── App.tsx              # Composição principal da aplicação
│   ├── main.tsx             # Ponto de entrada do React
│   └── index.css            # Estilos globais e variáveis visuais
├── .env.example             # Modelo das variáveis de ambiente
├── cadastro.json            # Dados de cadastro auxiliares
├── firebase-blueprint.json  # Blueprint/configuração relacionada ao Firebase
├── index.html               # HTML base
├── metadata.json             # Metadados do projeto
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configuração TypeScript
└── vite.config.ts           # Configuração do Vite
```

### Organização do código

| Diretório/arquivo | Responsabilidade |
|---|---|
| `src/components/` | Componentes visuais e funcionais reutilizáveis |
| `src/contexts/` | Estado global baseado em Context API |
| `src/hooks/` | Regras reutilizáveis da interface e acesso aos dados |
| `src/lib/` | Funções auxiliares, formatação e utilidades |
| `src/pages/` | Telas e fluxos principais |
| `src/services/` | Integrações com Firebase, IBGE e serviços externos |
| `src/App.tsx` | Layout, autenticação, tema e composição da aplicação |
| `src/index.css` | Estilos globais e tokens visuais |

## Stack tecnológica

### Frontend

- **React 19**
- **TypeScript**
- **Vite 6**
- **Tailwind CSS 4**
- **React DOM**

### Interface e interação

- **Lucide React** — biblioteca de ícones.
- **Motion** — animações e transições.
- **@hello-pangea/dnd** — drag and drop para organização de roteiros.
- **clsx** e **tailwind-merge** — composição e tratamento de classes CSS.

### Dados e backend

- **Firebase** — autenticação e persistência dos dados da aplicação.
- **Express** — suporte à camada de API/customizações de backend.
- **IBGE** — consulta de dados de municípios brasileiros.
- **dotenv** — gerenciamento de variáveis de ambiente.

### Recursos adicionais

- **@google/genai** — integração com recursos da API Gemini.
- **jsPDF** — geração de documentos PDF.
- **date-fns** — operações e formatação de datas.

## Requisitos

Para executar o projeto localmente, recomenda-se:

- **Node.js** em versão compatível com as dependências do projeto.
- **npm**.
- Um projeto configurado no **Firebase**.
- Credenciais do Firebase para o ambiente de desenvolvimento.
- Chave da API Gemini caso os recursos que utilizam Gemini estejam habilitados.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/luisfvmartins/Locais-e-Roteiros.git
cd Locais-e-Roteiros
```

Instale as dependências:

```bash
npm install
```

## Configuração do ambiente

Crie um arquivo `.env.local` na raiz do projeto com base no modelo fornecido:

```bash
cp .env.example .env.local
```

Preencha as variáveis conforme o ambiente utilizado:

```env
GEMINI_API_KEY="SUA_CHAVE_GEMINI"
APP_URL="http://localhost:3000"

VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_PROJETO.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"
```

> **Importante:** não versione chaves, tokens ou credenciais reais. Utilize o `.env.example` apenas como referência e mantenha os valores sensíveis no ambiente local ou no provedor de hospedagem.

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite disponibiliza a aplicação na porta **3000**.

Para disponibilizar o servidor na rede local, o script de desenvolvimento já utiliza:

```text
--host=0.0.0.0
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite na porta 3000 |
| `npm run build` | Gera a build de produção |
| `npm run preview` | Executa localmente a build de produção |
| `npm run lint` | Executa a verificação de tipos TypeScript |
| `npm run clean` | Remove artefatos locais de build definidos pelo projeto |

### Build de produção

Para gerar a versão de produção:

```bash
npm run build
```

Depois, para visualizar a build localmente:

```bash
npm run preview
```

## Modelo de dados

Os locais são tratados como registros pertencentes ao usuário autenticado.

Entre as informações utilizadas pela aplicação estão:

- Identificação do local.
- Nome fantasia.
- Razão social.
- Cidade/UF.
- Endereço.
- Link para localização no Google Maps.
- Tags.
- Observações.
- Indicador de favorito.
- Contador de utilização em roteiros.
- Identificador do usuário.
- Metadados de criação e atualização.

A camada de serviços concentra o acesso aos dados e evita que as páginas precisem lidar diretamente com os detalhes de persistência.

## Integração com municípios brasileiros

A aplicação possui integração com dados de cidades brasileiras por meio do serviço relacionado ao **IBGE**.

Essa integração é utilizada para normalizar e apresentar cidades no formato:

```text
Cidade-UF
```

O objetivo é reduzir inconsistências na identificação dos municípios e manter uma apresentação uniforme na interface.

## Fluxo operacional

### 1. Cadastro

O usuário cria um local e informa os dados necessários para sua identificação e utilização na operação.

### 2. Organização

Tags, observações, favoritos e informações de localização ajudam a manter os destinos organizados.

### 3. Pesquisa

A busca permite localizar rapidamente um destino cadastrado.

### 4. Seleção

Um ou vários locais podem ser selecionados simultaneamente.

### 5. Roteirização

Os locais selecionados são enviados ao construtor de roteiros, onde podem ser organizados na sequência desejada.

### 6. Compartilhamento

O roteiro pode ser convertido em uma mensagem padronizada e compartilhado com o motorista ou equipe operacional.

## Segurança e boas práticas

O projeto utiliza autenticação para separar os dados por usuário e mantém as configurações sensíveis fora do código-fonte por meio de variáveis de ambiente.

Ao executar ou publicar a aplicação:

- Nunca publique o conteúdo real do `.env.local`.
- Restrinja as permissões do projeto Firebase ao necessário.
- Configure corretamente as regras de segurança do Firebase.
- Não coloque chaves privadas diretamente no código.
- Utilize HTTPS no ambiente de produção.
- Revise as configurações de autenticação antes de disponibilizar a aplicação publicamente.

## Estado atual

O projeto está em desenvolvimento contínuo. A aplicação já possui o fluxo central de gestão de locais e montagem de roteiros, além de autenticação, importação/exportação, favoritos, visualizações em grade/lista, integração com cidades brasileiras e recursos de compartilhamento.

A arquitetura foi organizada para permitir a evolução do módulo para outros fluxos de apoio à operação logística.

## Possíveis evoluções

Entre as possibilidades de evolução do projeto estão:

- Integração mais profunda com sistemas TMS.
- Geocodificação automática de endereços.
- Cálculo de distância e tempo estimado entre pontos.
- Otimização automática da sequência de paradas.
- Integração com APIs de mapas.
- Histórico detalhado de roteiros.
- Indicadores de utilização dos locais.
- Expansão dos recursos de IA.
- Integração com outros módulos operacionais.
- Exportação para formatos adicionais.
- Melhorias de permissões e administração de usuários.

## Contribuição

Para propor melhorias:

1. Faça um fork do projeto.
2. Crie uma branch para sua alteração.
3. Implemente e teste a mudança.
4. Execute a verificação de tipos:
   ```bash
   npm run lint
   ```
5. Gere a build:
   ```bash
   npm run build
   ```
6. Abra um Pull Request descrevendo claramente a alteração.

## Licença

O código-fonte principal do projeto contém arquivos sob **Apache License 2.0**, conforme o cabeçalho de licença presente no código da aplicação. Consulte os arquivos do repositório para verificar a licença aplicável a cada componente e dependência.

## Autor

**Luís Martins**

Projeto desenvolvido para aplicação prática de tecnologia em processos de **logística, transporte, gestão de locais e roteirização operacional**.

---

**Op.Log — Locais e Roteiros**

Organização de destinos para uma operação de transporte mais simples, estruturada e eficiente.
