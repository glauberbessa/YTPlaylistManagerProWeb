# YT Playlist Manager Pro Web - Documentacao para Desenvolvedores

## Indice

1. [Visao Geral do Projeto](#1-visao-geral-do-projeto)
2. [Tecnologias Utilizadas](#2-tecnologias-utilizadas)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Arquitetura da Aplicacao](#4-arquitetura-da-aplicacao)
5. [Sistema de Autenticacao](#5-sistema-de-autenticacao)
6. [API do YouTube](#6-api-do-youtube)
7. [Gerenciamento de Estado](#7-gerenciamento-de-estado)
8. [Banco de Dados](#8-banco-de-dados)
9. [Componentes Principais](#9-componentes-principais)
10. [Rotas da API](#10-rotas-da-api)
11. [Fluxos de Dados](#11-fluxos-de-dados)
12. [Sistema de Cotas](#12-sistema-de-cotas)
13. [Padroes de Codigo](#13-padroes-de-codigo)
14. [Ambiente de Desenvolvimento](#14-ambiente-de-desenvolvimento)
15. [Deploy e Producao](#15-deploy-e-producao)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Visao Geral do Projeto

### O que e este projeto?

O **YT Playlist Manager Pro Web** e uma aplicacao web moderna que permite aos usuarios gerenciar suas playlists do YouTube de forma avancada. A aplicacao oferece funcionalidades que nao estao disponiveis na interface padrao do YouTube, como:

- **Transferencia em massa** de videos entre playlists
- **Remocao em lote** de videos
- **Filtros avancados** por duracao, visualizacoes, idioma e texto
- **Visualizacao de videos** de canais inscritos
- **Atribuicao de videos** de canais para playlists
- **Monitoramento de cota** da API do YouTube

### Publico-alvo

Criadores de conteudo e usuarios avancados do YouTube que precisam organizar grandes quantidades de videos em playlists.

### Stack Resumida

```
Frontend: Next.js 14 + React 18 + TypeScript + Tailwind CSS
Backend:  Next.js API Routes + Prisma ORM
Banco:    PostgreSQL (Neon)
Auth:     NextAuth.js v5 + Google OAuth
API:      YouTube Data API v3
```

---

## 2. Tecnologias Utilizadas

### 2.1 Frontend

| Tecnologia | Versao | Para que serve? |
|------------|--------|-----------------|
| **Next.js** | 14.2.35 | Framework React com renderizacao no servidor (SSR) e roteamento automatico |
| **React** | 18.2.0 | Biblioteca para construir interfaces de usuario |
| **TypeScript** | 5.3.3 | Adiciona tipagem estatica ao JavaScript, evitando erros |
| **Tailwind CSS** | 3.4.1 | Framework CSS utilitario para estilizacao rapida |
| **shadcn/ui** | - | Componentes de UI pre-construidos e acessiveis |
| **TanStack Table** | 8.12.0 | Biblioteca para criar tabelas com ordenacao e filtragem |
| **TanStack Query** | 5.24.0 | Gerenciamento de estado do servidor com cache |
| **Zustand** | 4.5.1 | Gerenciamento de estado global leve |
| **Lucide React** | 0.344.0 | Biblioteca de icones |
| **date-fns** | 3.3.1 | Utilitarios para manipulacao de datas |

### 2.2 Backend

| Tecnologia | Versao | Para que serve? |
|------------|--------|-----------------|
| **Next.js API Routes** | 14.2.35 | Endpoints de API serverless integrados ao Next.js |
| **NextAuth.js** | 5.0.0-beta | Autenticacao OAuth2 com provedores externos |
| **Prisma** | 6.19.2 | ORM type-safe para interagir com banco de dados |
| **googleapis** | 134.0.0 | Cliente oficial da Google para APIs |
| **PostgreSQL** | 15+ | Banco de dados relacional |

### 2.3 Por que essas tecnologias?

**Next.js**: Escolhido por unificar frontend e backend em um unico projeto, facilitar SSR/SSG, e ter excelente suporte a TypeScript.

**Prisma**: Escolhido por gerar tipos automaticamente a partir do schema do banco, evitando erros de tipagem.

**TanStack Query**: Escolhido por gerenciar cache de dados do servidor automaticamente, reduzindo chamadas desnecessarias a API.

**Zustand**: Escolhido por ser mais simples que Redux, com menos boilerplate.

---

## 3. Estrutura de Pastas

```
YTPlaylistManagerProWeb/
├── src/                          # Codigo fonte principal
│   ├── app/                      # App Router do Next.js 14
│   │   ├── (auth)/               # Rotas de autenticacao (publicas)
│   │   │   ├── login/
│   │   │   │   ├── page.tsx      # Pagina de login
│   │   │   │   └── actions.ts    # Server actions de login
│   │   │   └── layout.tsx        # Layout das paginas de auth
│   │   │
│   │   ├── (dashboard)/          # Rotas protegidas (usuario logado)
│   │   │   ├── playlists/        # Gerenciamento de playlists
│   │   │   │   └── page.tsx      # Pagina principal de playlists
│   │   │   ├── channels/         # Gerenciamento de canais
│   │   │   │   └── page.tsx      # Pagina de canais inscritos
│   │   │   ├── config/           # Configuracoes
│   │   │   │   ├── playlists/    # Config de visibilidade de playlists
│   │   │   │   └── channels/     # Config de visibilidade de canais
│   │   │   ├── quota/            # Monitoramento de cota
│   │   │   │   └── page.tsx      # Pagina de uso de cota
│   │   │   └── layout.tsx        # Layout do dashboard com sidebar
│   │   │
│   │   ├── api/                  # Rotas de API (backend)
│   │   │   ├── auth/             # Endpoints de autenticacao
│   │   │   │   └── [...nextauth]/route.ts  # Handler do NextAuth
│   │   │   ├── playlists/        # Endpoints de playlists
│   │   │   │   ├── route.ts      # GET /api/playlists
│   │   │   │   ├── [id]/items/   # GET /api/playlists/:id/items
│   │   │   │   ├── transfer/     # POST /api/playlists/transfer
│   │   │   │   └── remove/       # POST /api/playlists/remove
│   │   │   ├── channels/         # Endpoints de canais
│   │   │   ├── config/           # Endpoints de configuracao
│   │   │   └── quota/            # Endpoints de cota
│   │   │
│   │   ├── layout.tsx            # Layout raiz (HTML, providers)
│   │   ├── page.tsx              # Pagina inicial (redirect)
│   │   ├── providers.tsx         # Providers globais (Query, Session)
│   │   ├── error.tsx             # Pagina de erro
│   │   └── global-error.tsx      # Erro global
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes shadcn/ui (28+ arquivos)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/               # Componentes de layout
│   │   │   ├── DashboardShell.tsx   # Shell principal do dashboard
│   │   │   ├── Sidebar.tsx          # Barra lateral de navegacao
│   │   │   ├── Header.tsx           # Cabecalho com usuario
│   │   │   └── QuotaIndicator.tsx   # Indicador de cota
│   │   ├── playlists/            # Componentes de playlists
│   │   │   ├── PlaylistSelector.tsx # Seletor de playlist
│   │   │   ├── VideoTable.tsx       # Tabela de videos
│   │   │   ├── VideoGrid.tsx        # Grade de videos
│   │   │   ├── VideoFilters.tsx     # Filtros avancados
│   │   │   └── TransferDialog.tsx   # Dialog de transferencia
│   │   └── channels/             # Componentes de canais
│   │       ├── ChannelSelector.tsx
│   │       └── AssignDialog.tsx
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── usePlaylistItems.ts   # Hook para buscar videos de playlist
│   │   ├── useChannelVideos.ts   # Hook para buscar videos de canal
│   │   ├── useVideoFilters.ts    # Hook de filtragem
│   │   ├── useTransfer.ts        # Hook de transferencia
│   │   └── useQuota.ts           # Hook de cota
│   │
│   ├── stores/                   # Stores Zustand
│   │   └── filterStore.ts        # Estado global de filtros
│   │
│   ├── types/                    # Definicoes de tipos TypeScript
│   │   ├── video.ts              # Interface Video
│   │   ├── playlist.ts           # Interface Playlist
│   │   ├── channel.ts            # Interface Channel
│   │   ├── filter.ts             # Tipos de filtro
│   │   └── quota.ts              # Tipos de cota
│   │
│   ├── lib/                      # Bibliotecas e utilitarios
│   │   ├── auth.ts               # Configuracao do NextAuth (~550 linhas)
│   │   ├── youtube.ts            # Servico da API do YouTube (~700 linhas)
│   │   ├── quota.ts              # Rastreamento de cota
│   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   ├── logger.ts             # Sistema de logging
│   │   ├── i18n.ts               # Textos da UI em portugues
│   │   └── utils.ts              # Funcoes utilitarias
│   │
│   └── middleware.ts             # Middleware de autenticacao
│
├── prisma/                       # Configuracao do Prisma
│   ├── schema.prisma             # Schema do banco de dados
│   └── migrations/               # Migracoes do banco
│
├── scripts/                      # Scripts de build
│   ├── prisma-generate.mjs       # Gera cliente Prisma
│   ├── migrate.sh                # Executa migracoes
│   └── ensure-db.mjs             # Valida conexao com banco
│
├── package.json                  # Dependencias e scripts
├── tsconfig.json                 # Configuracao TypeScript
├── next.config.js                # Configuracao Next.js
├── tailwind.config.js            # Configuracao Tailwind
├── .env.example                  # Template de variaveis de ambiente
└── vercel.json                   # Configuracao de deploy Vercel
```

### Explicacao das Pastas Principais

#### `src/app/` - App Router

O Next.js 14 usa o App Router, onde cada pasta dentro de `app/` se torna uma rota automaticamente:

- `app/playlists/page.tsx` -> URL: `/playlists`
- `app/api/playlists/route.ts` -> API: `GET /api/playlists`

**Grupos de Rotas** (pastas com parenteses):
- `(auth)` - Agrupa rotas de autenticacao sem afetar a URL
- `(dashboard)` - Agrupa rotas protegidas

#### `src/components/` - Componentes

Organizado por dominio:
- `ui/` - Componentes genericos reutilizaveis (botoes, inputs, dialogs)
- `layout/` - Componentes estruturais (sidebar, header)
- `playlists/` - Componentes especificos de playlists
- `channels/` - Componentes especificos de canais

#### `src/hooks/` - Custom Hooks

Encapsulam logica reutilizavel:
- Chamadas de API com React Query
- Logica de filtragem
- Operacoes de transferencia

#### `src/lib/` - Bibliotecas

Codigo que nao e componente React:
- Configuracoes (auth, prisma)
- Servicos (youtube)
- Utilitarios (utils, logger)

---

## 4. Arquitetura da Aplicacao

### 4.1 Visao Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Paginas   │  │ Componentes │  │   Stores    │             │
│  │  (Next.js)  │  │   (React)   │  │  (Zustand)  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    ┌─────┴─────┐                                 │
│                    │   Hooks   │ (React Query)                   │
│                    │  useXXX() │                                 │
│                    └─────┬─────┘                                 │
│                          │ fetch()                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    SERVIDOR (Next.js API Routes)                 │
├──────────────────────────┼──────────────────────────────────────┤
│                    ┌─────┴─────┐                                 │
│                    │ API Routes│ (/api/playlists, /api/channels) │
│                    └─────┬─────┘                                 │
│                          │                                       │
│         ┌────────────────┼────────────────┐                      │
│         │                │                │                      │
│   ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐                │
│   │  NextAuth │   │  YouTube  │   │   Prisma  │                │
│   │  (Auth)   │   │  Service  │   │   (ORM)   │                │
│   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘                │
└─────────┼───────────────┼───────────────┼───────────────────────┘
          │               │               │
          │               │               │
┌─────────┴───┐   ┌───────┴───────┐   ┌───┴───────────┐
│   Google    │   │   YouTube     │   │   PostgreSQL  │
│   OAuth     │   │   Data API    │   │   (Neon)      │
└─────────────┘   └───────────────┘   └───────────────┘
```

### 4.2 Fluxo de Requisicao

1. **Usuario** interage com a interface
2. **Componente** chama um custom hook (ex: `usePlaylistItems`)
3. **Hook** faz uma requisicao `fetch` para a API
4. **API Route** valida a sessao com NextAuth
5. **YouTubeService** faz chamadas a API do YouTube
6. **Prisma** salva/busca dados no PostgreSQL
7. **Resposta** retorna pelo mesmo caminho

### 4.3 Camadas da Aplicacao

| Camada | Responsabilidade | Arquivos |
|--------|-----------------|----------|
| **Apresentacao** | UI, interacao do usuario | `components/`, `app/**/page.tsx` |
| **Estado** | Gerenciamento de dados | `stores/`, `hooks/` |
| **API** | Endpoints HTTP | `app/api/` |
| **Servicos** | Logica de negocio | `lib/youtube.ts`, `lib/auth.ts` |
| **Dados** | Persistencia | `lib/prisma.ts`, `prisma/schema.prisma` |

---

## 5. Sistema de Autenticacao

### 5.1 Visao Geral

A autenticacao usa **NextAuth.js v5** com **Google OAuth 2.0** para permitir que usuarios facam login com suas contas Google e autorizem acesso as suas playlists do YouTube.

### 5.2 Arquivo Principal: `src/lib/auth.ts`

```typescript
// Configuracao simplificada
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),      // Salva usuarios no banco
  session: { strategy: "jwt" },         // Usa tokens JWT
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        scope: "openid email profile https://www.googleapis.com/auth/youtube",
        access_type: "offline",         // Para refresh token
        prompt: "consent"
      }
    }
  })]
});
```

### 5.3 Fluxo de Login

```
1. Usuario clica "Entrar com Google"
        │
        ▼
2. Redirect para /api/auth/signin
        │
        ▼
3. Google OAuth - Tela de consentimento
   "Este app quer acessar suas playlists do YouTube"
        │
        ▼
4. Usuario autoriza
        │
        ▼
5. Google retorna codigo de autorizacao
        │
        ▼
6. NextAuth troca codigo por tokens:
   - access_token (expira em 1h)
   - refresh_token (nao expira)
        │
        ▼
7. Callback signIn:
   - Busca ID do canal YouTube do usuario
   - Salva no banco (user.youtubeChannelId)
        │
        ▼
8. JWT criado com tokens
        │
        ▼
9. Redirect para /playlists
```

### 5.4 Refresh de Token

O `access_token` do Google expira em 1 hora. O sistema faz refresh automatico:

```typescript
// Em src/lib/auth.ts - callback jwt
async jwt({ token, account }) {
  // Se token expirou
  if (Date.now() >= token.accessTokenExpires - 60000) {
    // Usa refresh_token para obter novo access_token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken
      })
    });
    const newTokens = await response.json();
    token.accessToken = newTokens.access_token;
    token.accessTokenExpires = Date.now() + newTokens.expires_in * 1000;
  }
  return token;
}
```

### 5.5 Verificacao de Sessao em API Routes

```typescript
// Em qualquer API route
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Usuario autenticado, continuar...
}
```

### 5.6 Verificacao de Sessao no Cliente

```typescript
// Em componentes React
import { useSession } from "next-auth/react";

function MeuComponente() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") return <Redirect to="/login" />;

  // Usuario logado
  return <div>Ola, {session.user.name}</div>;
}
```

---

## 6. API do YouTube

### 6.1 Servico Principal: `src/lib/youtube.ts`

Esta classe encapsula todas as interacoes com a API do YouTube:

```typescript
class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    this.youtube = google.youtube({ version: "v3", auth: oauth2Client });
    this.userId = userId;
  }
}
```

### 6.2 Metodos Principais

| Metodo | Descricao | Custo de Cota |
|--------|-----------|---------------|
| `getPlaylists()` | Lista todas as playlists do usuario | 1 unidade/pagina |
| `getPlaylistItems(playlistId)` | Lista videos de uma playlist | 1 unidade/pagina |
| `getChannelVideos(channelId)` | Lista videos de um canal | 100 unidades (search) |
| `addVideoToPlaylist(playlistId, videoId)` | Adiciona video a playlist | 50 unidades |
| `removeVideoFromPlaylist(playlistItemId)` | Remove video de playlist | 50 unidades |
| `transferVideos(source, dest, videos)` | Transfere videos | 100 unidades/video |
| `getSubscribedChannels()` | Lista canais inscritos | 1 unidade/pagina |

### 6.3 Paginacao

A API do YouTube retorna no maximo 50 items por requisicao. O servico faz paginacao automatica:

```typescript
async getPlaylistItems(playlistId: string): Promise<Video[]> {
  let allItems: Video[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await this.youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken: nextPageToken
    });

    allItems.push(...response.data.items);
    nextPageToken = response.data.nextPageToken;

    // Rastreia uso de cota
    await trackQuotaUsage(this.userId, "playlistItems.list");

  } while (nextPageToken);

  return allItems;
}
```

### 6.4 Processamento em Lote (Batch)

Para obter detalhes de videos (duracao, visualizacoes), a API permite ate 50 IDs por requisicao:

```typescript
async enrichVideosWithDetails(videos: Video[]): Promise<Video[]> {
  const chunks = chunkArray(videos, 50); // Divide em grupos de 50

  for (const chunk of chunks) {
    const videoIds = chunk.map(v => v.videoId).join(",");

    const response = await this.youtube.videos.list({
      part: ["contentDetails", "statistics"],
      id: videoIds
    });

    // Mescla dados de duracao e views nos videos
    response.data.items.forEach(detail => {
      const video = chunk.find(v => v.videoId === detail.id);
      if (video) {
        video.duration = parseDuration(detail.contentDetails.duration);
        video.viewCount = parseInt(detail.statistics.viewCount);
      }
    });
  }

  return videos;
}
```

### 6.5 Tratamento de Erros

```typescript
async addVideoToPlaylist(playlistId: string, videoId: string) {
  try {
    await this.youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId }
        }
      }
    });
  } catch (error) {
    // Video duplicado nao e erro critico
    if (error.message.includes("duplicate")) {
      logger.warn("Video ja existe na playlist");
      return { skipped: true };
    }
    throw error;
  }
}
```

---

## 7. Gerenciamento de Estado

### 7.1 Tipos de Estado na Aplicacao

| Tipo | Ferramenta | Exemplo |
|------|------------|---------|
| **Estado do Servidor** | React Query | Dados de playlists, videos |
| **Estado Global UI** | Zustand | Filtros, preferencias |
| **Estado Local** | useState | Selecao de videos, dialogs abertos |
| **Estado de Contexto** | Context API | Sidebar aberta/fechada |

### 7.2 React Query (Estado do Servidor)

**Arquivo**: `src/hooks/usePlaylistItems.ts`

```typescript
import { useQuery } from "@tanstack/react-query";

export function usePlaylistItems(playlistId: string | null) {
  return useQuery({
    // Chave unica para cache
    queryKey: ["playlistItems", playlistId],

    // Funcao que busca os dados
    queryFn: async () => {
      const response = await fetch(`/api/playlists/${playlistId}/items`);
      if (!response.ok) throw new Error("Falha ao carregar");
      return response.json();
    },

    // So executa se playlistId existir
    enabled: !!playlistId,

    // Cache valido por 5 minutos
    staleTime: 5 * 60 * 1000,

    // Nao refaz requisicao ao focar na janela
    refetchOnWindowFocus: false
  });
}
```

**Uso em componente:**

```typescript
function PlaylistVideos({ playlistId }) {
  const { data: videos, isLoading, error } = usePlaylistItems(playlistId);

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return <VideoTable videos={videos} />;
}
```

### 7.3 Zustand (Estado Global)

**Arquivo**: `src/stores/filterStore.ts`

```typescript
import { create } from "zustand";

interface FilterState {
  filter: VideoFilter;
  setSearchText: (text: string) => void;
  setDurationPreset: (preset: DurationPreset) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  // Estado inicial
  filter: {
    searchText: "",
    searchInTitle: true,
    searchInDescription: false,
    searchInChannel: true,
    minDuration: 0,
    maxDuration: Infinity,
    minViewCount: 0,
    maxViewCount: Infinity,
    selectedLanguage: "all"
  },

  // Acoes
  setSearchText: (text) =>
    set((state) => ({
      filter: { ...state.filter, searchText: text }
    })),

  setDurationPreset: (preset) =>
    set((state) => ({
      filter: {
        ...state.filter,
        minDuration: preset.min,
        maxDuration: preset.max
      }
    })),

  resetFilters: () =>
    set({ filter: DEFAULT_FILTER })
}));
```

**Uso em componente:**

```typescript
function VideoFilters() {
  const { filter, setSearchText, resetFilters } = useFilterStore();

  return (
    <div>
      <Input
        value={filter.searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <Button onClick={resetFilters}>Limpar Filtros</Button>
    </div>
  );
}
```

### 7.4 Context API (Sidebar)

**Arquivo**: `src/components/layout/SidebarContext.tsx`

```typescript
const SidebarContext = createContext<{
  isOpen: boolean;
  toggle: () => void;
} | null>(null);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggle: () => setIsOpen(prev => !prev)
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar deve estar dentro de SidebarProvider");
  return context;
}
```

---

## 8. Banco de Dados

### 8.1 Schema Prisma

**Arquivo**: `prisma/schema.prisma`

```prisma
// Configuracao do Prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tabela de usuarios
model User {
  id               String    @id @default(cuid())
  name             String?
  email            String?   @unique
  emailVerified    DateTime?
  image            String?
  youtubeChannelId String?   @unique

  // Relacionamentos
  accounts         Account[]
  sessions         Session[]
  playlistConfigs  PlaylistConfig[]
  channelConfigs   ChannelConfig[]
  quotaHistories   QuotaHistory[]
}

// Tokens OAuth (managed by NextAuth)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

// Configuracao de playlists por usuario
model PlaylistConfig {
  id                   String  @id @default(cuid())
  userId               String
  playlistId           String
  title                String?
  isEnabled            Boolean @default(true)  // Visivel no app?
  videoCount           Int?                    // Cache de quantidade
  totalDurationSeconds Int?                    // Cache de duracao total

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, playlistId])
}

// Configuracao de canais por usuario
model ChannelConfig {
  id                   String    @id @default(cuid())
  userId               String
  channelId            String
  title                String?
  isEnabled            Boolean   @default(true)
  subscriptionDate     DateTime?
  totalDurationSeconds Int?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channelId])
}

// Historico de uso de cota
model QuotaHistory {
  id            String   @id @default(cuid())
  userId        String
  date          DateTime @db.Date
  consumedUnits Int      @default(0)
  dailyLimit    Int      @default(10000)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
}
```

### 8.2 Usando o Prisma Client

**Arquivo**: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

// Singleton para evitar multiplas conexoes em desenvolvimento
const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Exemplos de uso:**

```typescript
// Buscar usuario
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Buscar configs de playlists
const configs = await prisma.playlistConfig.findMany({
  where: { userId, isEnabled: true }
});

// Criar ou atualizar config
await prisma.playlistConfig.upsert({
  where: { userId_playlistId: { userId, playlistId } },
  update: { videoCount: 150 },
  create: { userId, playlistId, videoCount: 150 }
});

// Incrementar cota do dia
await prisma.quotaHistory.upsert({
  where: { userId_date: { userId, date: today } },
  update: { consumedUnits: { increment: 50 } },
  create: { userId, date: today, consumedUnits: 50 }
});
```

### 8.3 Migracoes

```bash
# Criar migracao apos alterar schema.prisma
npx prisma migrate dev --name nome_da_migracao

# Aplicar migracoes em producao
npx prisma migrate deploy

# Sincronizar schema sem migracao (desenvolvimento)
npx prisma db push
```

---

## 9. Componentes Principais

### 9.1 DashboardShell

**Arquivo**: `src/components/layout/DashboardShell.tsx`

Wrapper principal que contem sidebar e header:

```typescript
export function DashboardShell({ children }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
```

### 9.2 VideoTable

**Arquivo**: `src/components/playlists/VideoTable.tsx`

Tabela avancada usando TanStack Table:

```typescript
export function VideoTable({
  videos,
  selectedIds,
  onSelectionChange
}: VideoTableProps) {

  // Definicao das colunas
  const columns = useMemo<ColumnDef<Video>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={table.toggleAllRowsSelected}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={row.toggleSelected}
        />
      )
    },
    {
      accessorKey: "thumbnail",
      header: "",
      cell: ({ row }) => (
        <img src={row.original.thumbnail} className="w-24 rounded" />
      )
    },
    {
      accessorKey: "title",
      header: "Titulo",
      cell: ({ row }) => (
        <a href={`https://youtube.com/watch?v=${row.original.videoId}`}>
          {row.original.title}
        </a>
      )
    },
    {
      accessorKey: "channelTitle",
      header: "Canal"
    },
    {
      accessorKey: "duration",
      header: "Duracao",
      cell: ({ row }) => formatDuration(row.original.duration)
    },
    {
      accessorKey: "viewCount",
      header: "Visualizacoes",
      cell: ({ row }) => formatNumber(row.original.viewCount)
    }
  ], []);

  // Instancia da tabela
  const table = useReactTable({
    data: videos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 9.3 PlaylistSelector

**Arquivo**: `src/components/playlists/PlaylistSelector.tsx`

Dropdown para selecionar playlist:

```typescript
export function PlaylistSelector({
  playlists,
  selectedId,
  onSelect
}: PlaylistSelectorProps) {
  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma playlist" />
      </SelectTrigger>
      <SelectContent>
        {playlists.map(playlist => (
          <SelectItem key={playlist.id} value={playlist.id}>
            <div className="flex items-center gap-2">
              <img src={playlist.thumbnail} className="w-8 h-8 rounded" />
              <span>{playlist.title}</span>
              <span className="text-muted-foreground">
                ({playlist.videoCount} videos)
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 9.4 VideoFilters

**Arquivo**: `src/components/playlists/VideoFilters.tsx`

Painel de filtros avancados:

```typescript
export function VideoFilters() {
  const {
    filter,
    setSearchText,
    setDurationPreset,
    setViewCountPreset,
    resetFilters
  } = useFilterStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca por texto */}
        <div>
          <Label>Buscar</Label>
          <Input
            value={filter.searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Digite para buscar..."
          />
        </div>

        {/* Preset de duracao */}
        <div>
          <Label>Duracao</Label>
          <ToggleGroup
            type="single"
            value={filter.durationPreset}
            onValueChange={setDurationPreset}
          >
            <ToggleGroupItem value="shorts">Shorts (&lt;60s)</ToggleGroupItem>
            <ToggleGroupItem value="short">Curtos (1-4min)</ToggleGroupItem>
            <ToggleGroupItem value="medium">Medios (4-20min)</ToggleGroupItem>
            <ToggleGroupItem value="long">Longos (&gt;20min)</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Preset de visualizacoes */}
        <div>
          <Label>Visualizacoes</Label>
          <ToggleGroup
            type="single"
            value={filter.viewCountPreset}
            onValueChange={setViewCountPreset}
          >
            <ToggleGroupItem value="low">&lt;1K</ToggleGroupItem>
            <ToggleGroupItem value="medium">1K-100K</ToggleGroupItem>
            <ToggleGroupItem value="high">100K-1M</ToggleGroupItem>
            <ToggleGroupItem value="viral">&gt;1M</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button variant="outline" onClick={resetFilters}>
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 10. Rotas da API

### 10.1 Estrutura de uma API Route

**Padrao basico** (`src/app/api/exemplo/route.ts`):

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger, generateTraceId, setTraceId, clearTraceId } from "@/lib/logger";

export async function GET() {
  const traceId = generateTraceId();
  setTraceId(traceId);

  try {
    // 1. Verificar autenticacao
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", traceId },
        { status: 401 }
      );
    }

    // 2. Executar logica de negocio
    const data = await prisma.exemplo.findMany({
      where: { userId: session.user.id }
    });

    // 3. Retornar sucesso
    return NextResponse.json(data);

  } catch (error) {
    logger.error("API", "Falha ao processar requisicao", error);
    return NextResponse.json(
      { error: "Erro interno", traceId },
      { status: 500 }
    );
  } finally {
    clearTraceId();
  }
}
```

### 10.2 Endpoints Disponiveis

#### Autenticacao
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| ALL | `/api/auth/*` | Handlers NextAuth (login, logout, callback) |
| GET | `/api/auth/debug` | Debug de sessao |
| GET | `/api/auth/diagnostic` | Informacoes de diagnostico |

#### Playlists
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/playlists` | Lista playlists do usuario |
| GET | `/api/playlists/[id]/items` | Lista videos de uma playlist |
| POST | `/api/playlists/transfer` | Transfere videos entre playlists |
| POST | `/api/playlists/remove` | Remove videos de uma playlist |

#### Canais
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/channels` | Lista canais inscritos |
| GET | `/api/channels/[id]/videos` | Lista videos de um canal |
| POST | `/api/channels/assign` | Atribui videos a uma playlist |

#### Configuracao
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/config/playlists` | Obtem configs de playlists |
| PUT | `/api/config/playlists` | Atualiza configs de playlists |
| GET | `/api/config/channels` | Obtem configs de canais |
| PUT | `/api/config/channels` | Atualiza configs de canais |

#### Cota
| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/quota` | Cota atual do dia |
| GET | `/api/quota/history` | Historico de uso (7 dias) |

### 10.3 Exemplo: POST /api/playlists/transfer

```typescript
// Requisicao
POST /api/playlists/transfer
Content-Type: application/json

{
  "sourcePlaylistId": "PLxxxxx",
  "destinationPlaylistId": "PLyyyyy",
  "videoIds": ["abc123", "def456", "ghi789"]
}

// Resposta de sucesso
{
  "success": true,
  "transferred": 3,
  "failed": 0,
  "skipped": 0
}

// Resposta de erro
{
  "error": "Quota exceeded",
  "traceId": "tr_abc123"
}
```

---

## 11. Fluxos de Dados

### 11.1 Carregamento de Playlist

```
Usuario seleciona playlist no dropdown
            │
            ▼
PlaylistSelector.onSelect(playlistId)
            │
            ▼
Pagina atualiza estado: setSelectedPlaylist(id)
            │
            ▼
usePlaylistItems(playlistId) e chamado
            │
            ▼
React Query verifica cache
            │
            ├─ Cache valido ─────────────────┐
            │                                 │
            ▼                                 │
fetch("/api/playlists/{id}/items")            │
            │                                 │
            ▼                                 │
API Route executa                             │
            │                                 │
            ▼                                 │
YouTubeService.getPlaylistItems()             │
            │                                 │
            ▼                                 │
YouTube API (com paginacao)                   │
            │                                 │
            ▼                                 │
Videos enriquecidos com detalhes              │
            │                                 │
            ▼                                 │
Resposta JSON                                 │
            │                                 │
            ▼                                 │
React Query salva no cache ◄─────────────────┘
            │
            ▼
useVideoFilters aplica filtros do Zustand
            │
            ▼
VideoTable/Grid/List renderiza videos
```

### 11.2 Transferencia de Videos

```
Usuario seleciona videos e clica "Transferir"
            │
            ▼
TransferDialog abre
            │
            ▼
Usuario seleciona playlist destino
            │
            ▼
Usuario confirma
            │
            ▼
useTransfer.mutate({ source, dest, videos })
            │
            ▼
POST /api/playlists/transfer
            │
            ▼
YouTubeService.transferVideos()
            │
            ▼
Para cada video:
  ├─ addVideoToPlaylist(dest, videoId)  [50 units]
  └─ removeVideoFromPlaylist(itemId)     [50 units]
            │
            ▼
Resposta com resultados
            │
            ▼
React Query invalida cache de ambas playlists
            │
            ▼
Toast de sucesso/erro
            │
            ▼
Playlists sao recarregadas automaticamente
```

### 11.3 Filtragem de Videos

```
Usuario digita no campo de busca
            │
            ▼
Input.onChange -> setSearchText("termo")
            │
            ▼
Zustand atualiza filterStore.filter.searchText
            │
            ▼
useVideoFilters detecta mudanca (reatividade)
            │
            ▼
useMemo recalcula videos filtrados:
  - Busca por texto (titulo, descricao, canal)
  - Filtro de duracao
  - Filtro de visualizacoes
  - Filtro de idioma
            │
            ▼
Componente de visualizacao recebe novos dados
            │
            ▼
Re-render mostra apenas videos filtrados
```

---

## 12. Sistema de Cotas

### 12.1 O que e a Cota?

A API do YouTube tem um limite de **10.000 unidades por dia** por projeto. Cada operacao consome unidades:

| Operacao | Custo | Exemplo de uso |
|----------|-------|----------------|
| `playlists.list` | 1 | Listar playlists |
| `playlistItems.list` | 1 | Listar videos de playlist |
| `videos.list` | 1 | Obter detalhes de videos |
| `channels.list` | 1 | Listar canais |
| `subscriptions.list` | 1 | Listar inscricoes |
| `search.list` | 100 | Buscar videos (caro!) |
| `playlistItems.insert` | 50 | Adicionar video a playlist |
| `playlistItems.delete` | 50 | Remover video de playlist |

### 12.2 Rastreamento de Cota

**Arquivo**: `src/lib/quota.ts`

```typescript
export async function trackQuotaUsage(
  userId: string,
  operation: keyof typeof QUOTA_COSTS
) {
  const cost = QUOTA_COSTS[operation];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.quotaHistory.upsert({
    where: { userId_date: { userId, date: today } },
    update: { consumedUnits: { increment: cost } },
    create: { userId, date: today, consumedUnits: cost }
  });
}
```

### 12.3 Verificacao de Cota

```typescript
export async function checkQuotaAvailable(
  userId: string,
  requiredUnits: number
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const history = await prisma.quotaHistory.findUnique({
    where: { userId_date: { userId, date: today } }
  });

  const consumed = history?.consumedUnits ?? 0;
  const remaining = 10000 - consumed;

  return remaining >= requiredUnits;
}
```

### 12.4 Indicador Visual

**Arquivo**: `src/components/layout/QuotaIndicator.tsx`

```typescript
export function QuotaIndicator() {
  const { data: quota } = useQuota();

  if (!quota) return null;

  const percentage = (quota.consumed / quota.limit) * 100;
  const color = percentage > 90 ? "red" : percentage > 70 ? "yellow" : "green";

  return (
    <div className="flex items-center gap-2">
      <Progress value={percentage} className={`bg-${color}-500`} />
      <span>{quota.consumed.toLocaleString()} / {quota.limit.toLocaleString()}</span>
    </div>
  );
}
```

---

## 13. Padroes de Codigo

### 13.1 Nomenclatura

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `VideoTable.tsx` |
| Hooks | camelCase com "use" | `usePlaylistItems.ts` |
| Utilitarios | camelCase | `formatDuration.ts` |
| Tipos/Interfaces | PascalCase | `interface Video {}` |
| Constantes | UPPER_SNAKE_CASE | `const QUOTA_COSTS = {}` |
| Arquivos | kebab-case ou camelCase | `prisma-generate.mjs` |

### 13.2 Estrutura de Componente

```typescript
// 1. Imports
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { Video } from "@/types";

// 2. Tipos/Interfaces
interface VideoCardProps {
  video: Video;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

// 3. Componente
export function VideoCard({
  video,
  onSelect,
  isSelected = false
}: VideoCardProps) {
  // 3.1 Hooks de estado
  const [isHovered, setIsHovered] = useState(false);

  // 3.2 Hooks personalizados
  const { mutate: addToPlaylist } = useAddToPlaylist();

  // 3.3 Valores computados
  const formattedDuration = useMemo(
    () => formatDuration(video.duration),
    [video.duration]
  );

  // 3.4 Handlers
  const handleClick = () => {
    onSelect(video.id);
  };

  // 3.5 Render
  return (
    <div
      className={cn("p-4 rounded", isSelected && "bg-blue-100")}
      onClick={handleClick}
    >
      <img src={video.thumbnail} alt={video.title} />
      <h3>{video.title}</h3>
      <span>{formattedDuration}</span>
    </div>
  );
}
```

### 13.3 Estrutura de Hook

```typescript
// 1. Imports
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Video } from "@/types";

// 2. Funcao de fetch (separada para reutilizacao)
async function fetchPlaylistItems(playlistId: string): Promise<Video[]> {
  const response = await fetch(`/api/playlists/${playlistId}/items`);
  if (!response.ok) {
    throw new Error("Falha ao carregar videos");
  }
  return response.json();
}

// 3. Hook exportado
export function usePlaylistItems(playlistId: string | null) {
  return useQuery({
    queryKey: ["playlistItems", playlistId],
    queryFn: () => fetchPlaylistItems(playlistId!),
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000
  });
}
```

### 13.4 Estrutura de API Route

```typescript
// 1. Imports
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { YouTubeService } from "@/lib/youtube";
import { logger, generateTraceId, setTraceId, clearTraceId } from "@/lib/logger";

// 2. Handler
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const traceId = generateTraceId();
  setTraceId(traceId);

  try {
    // 2.1 Autenticacao
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2.2 Validacao de parametros
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "ID obrigatorio" }, { status: 400 });
    }

    // 2.3 Logica de negocio
    const youtube = new YouTubeService(
      session.accessToken,
      session.user.id
    );
    const items = await youtube.getPlaylistItems(id);

    // 2.4 Sucesso
    return NextResponse.json(items);

  } catch (error) {
    // 2.5 Tratamento de erro
    logger.error("API", "Erro ao buscar items", error);
    return NextResponse.json(
      { error: "Erro interno", traceId },
      { status: 500 }
    );
  } finally {
    clearTraceId();
  }
}
```

---

## 14. Ambiente de Desenvolvimento

### 14.1 Pre-requisitos

- **Node.js** 18.x ou superior
- **npm** 9.x ou superior
- **PostgreSQL** 15.x (ou conta Neon gratuita)
- **Conta Google Cloud** com projeto configurado

### 14.2 Configuracao Inicial

```bash
# 1. Clonar repositorio
git clone https://github.com/seu-usuario/YTPlaylistManagerProWeb.git
cd YTPlaylistManagerProWeb

# 2. Instalar dependencias
npm install

# 3. Copiar arquivo de ambiente
cp .env.example .env

# 4. Editar .env com suas credenciais
# (ver secao 14.3)

# 5. Gerar cliente Prisma
npx prisma generate

# 6. Criar tabelas no banco
npx prisma db push

# 7. Iniciar servidor de desenvolvimento
npm run dev
```

### 14.3 Variaveis de Ambiente

**Arquivo**: `.env`

```env
# URL da aplicacao (localhost em dev)
NEXTAUTH_URL=http://localhost:3000

# Segredo para assinar tokens (gere com: openssl rand -base64 32)
AUTH_SECRET=sua_chave_secreta_aqui

# Credenciais Google OAuth
# Obtenha em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# URL do banco PostgreSQL
# Formato: postgresql://usuario:senha@host:porta/banco
DATABASE_URL=postgresql://postgres:senha@localhost:5432/ytpm

# Opcional: URL para conexao direta (Neon)
DIRECT_URL=postgresql://postgres:senha@localhost:5432/ytpm
```

### 14.4 Configurando Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Ative a **YouTube Data API v3**
4. Crie credenciais OAuth 2.0:
   - Tipo: Aplicacao Web
   - URIs de redirecionamento autorizados:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://seu-dominio.com/api/auth/callback/google` (prod)
5. Copie Client ID e Client Secret para o `.env`

### 14.5 Scripts Disponiveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em localhost:3000

# Build
npm run build        # Compila para producao
npm run start        # Inicia servidor de producao

# Banco de dados
npx prisma studio    # Interface grafica para banco
npx prisma db push   # Sincroniza schema com banco
npx prisma migrate dev  # Cria migracao

# Qualidade
npm run lint         # Verifica erros de lint
npm run lint:fix     # Corrige erros automaticamente
```

### 14.6 Estrutura de Branches

```
main                 # Producao - sempre estavel
  └── develop        # Desenvolvimento - integracao
       └── feature/* # Features em desenvolvimento
       └── bugfix/*  # Correcoes de bugs
       └── hotfix/*  # Correcoes urgentes
```

---

## 15. Deploy e Producao

### 15.1 Deploy na Vercel (Recomendado)

1. Conecte seu repositorio GitHub a Vercel
2. Configure variaveis de ambiente:
   - `NEXTAUTH_URL` = URL do seu app Vercel
   - `AUTH_SECRET` = Segredo gerado
   - `GOOGLE_CLIENT_ID` = ID do cliente Google
   - `GOOGLE_CLIENT_SECRET` = Segredo do cliente Google
   - `DATABASE_URL` = URL do banco Neon
3. Deploy automatico a cada push

### 15.2 Configuracao Vercel

**Arquivo**: `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

### 15.3 Banco de Dados Neon

1. Crie conta em [neon.tech](https://neon.tech)
2. Crie novo projeto
3. Copie a connection string para `DATABASE_URL`
4. Execute migracoes: `npx prisma db push`

### 15.4 Checklist Pre-Deploy

- [ ] Variaveis de ambiente configuradas
- [ ] URIs de redirecionamento OAuth atualizadas
- [ ] Banco de dados migrado
- [ ] Build local funcionando (`npm run build`)
- [ ] Testes passando (se houver)

---

## 16. Troubleshooting

### 16.1 Erros Comuns

#### "Invalid credentials" no login

**Causa**: Client ID/Secret incorretos ou URIs de redirecionamento erradas.

**Solucao**:
1. Verifique `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
2. Confirme URIs de redirecionamento no Google Cloud Console
3. Limpe cookies do navegador

#### "Quota exceeded"

**Causa**: Limite diario de 10.000 unidades atingido.

**Solucao**:
1. Aguarde ate meia-noite Pacific Time
2. Solicite aumento de cota no Google Cloud Console
3. Otimize operacoes para usar menos cota

#### "pkceCodeVerifier could not be parsed"

**Causa**: Cookies PKCE corrompidos.

**Solucao**:
1. Limpe cookies do site
2. O middleware ja trata isso automaticamente

#### "Prisma Client not generated"

**Causa**: Cliente Prisma nao foi gerado apos instalar.

**Solucao**:
```bash
npx prisma generate
```

#### "Cannot find module '@prisma/client'"

**Causa**: Dependencias nao instaladas corretamente.

**Solucao**:
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
```

### 16.2 Logs e Debug

#### Verificar logs da aplicacao

Os logs sao exibidos no terminal durante desenvolvimento.

#### Usar endpoint de diagnostico

```
GET /api/auth/diagnostic
```

Retorna informacoes sobre:
- Sessao atual
- Tokens
- Usuario
- Logs recentes

#### Verificar banco de dados

```bash
npx prisma studio
```

Abre interface grafica para inspecionar tabelas.

### 16.3 Onde Buscar Ajuda

1. **Documentacao oficial**:
   - [Next.js](https://nextjs.org/docs)
   - [Prisma](https://www.prisma.io/docs)
   - [NextAuth.js](https://authjs.dev)
   - [YouTube API](https://developers.google.com/youtube/v3)

2. **Issues do projeto**: Abra uma issue no GitHub

3. **Stack Overflow**: Use tags `next.js`, `prisma`, `youtube-api`

---

## Glossario

| Termo | Definicao |
|-------|-----------|
| **API Route** | Endpoint de backend em Next.js |
| **App Router** | Sistema de roteamento do Next.js 14 |
| **Hook** | Funcao React que encapsula logica reutilizavel |
| **JWT** | JSON Web Token - formato de token de autenticacao |
| **Mutation** | Operacao que modifica dados (React Query) |
| **OAuth** | Protocolo de autorizacao para login com terceiros |
| **ORM** | Object-Relational Mapping - abstrai acesso ao banco |
| **Query** | Operacao que le dados (React Query) |
| **SSR** | Server-Side Rendering - renderizacao no servidor |
| **Store** | Repositorio de estado global (Zustand) |
| **Stale Time** | Tempo que dados em cache sao considerados frescos |

---

## Contato e Contribuicao

Para duvidas, sugestoes ou contribuicoes:

1. Abra uma issue no repositorio
2. Envie um pull request com melhorias
3. Siga as convencoes de codigo descritas neste documento

---

*Documento atualizado em: Janeiro 2026*
*Versao: 1.0*
