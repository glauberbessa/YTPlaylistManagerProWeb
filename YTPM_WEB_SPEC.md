# YT Playlist Manager Pro - Web Version
## Especificação Técnica para Desenvolvimento

**Documento de Requisitos para Claude Code**  
**Versão:** 1.0  
**Data:** Janeiro/2026  
**Idioma da Aplicação:** Português Brasileiro (pt-BR)

---

## 1. VISÃO GERAL DO PROJETO

### 1.1 Objetivo

Desenvolver uma **aplicação web moderna** que replique todas as funcionalidades do software desktop "YT Playlist Manager Pro" (desenvolvido em C#/WinUI 3), oferecendo uma experiência otimizada para navegadores desktop e mobile.

### 1.2 O que é a Aplicação

Um gerenciador profissional de playlists do YouTube que permite:
- Organizar vídeos entre playlists com filtros avançados
- Transferir vídeos em lote entre playlists
- Gerenciar canais inscritos e atribuir seus vídeos a playlists
- Monitorar consumo de quota da API do YouTube
- Configurar visibilidade de playlists e canais

### 1.3 Público-Alvo

- Criadores de conteúdo que gerenciam múltiplas playlists
- Usuários que organizam grandes coleções de vídeos
- Profissionais que precisam curar conteúdo do YouTube

---

## 2. STACK TECNOLÓGICO

### 2.1 Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14+ (App Router) | Framework React com SSR/SSG |
| **React** | 18+ | Biblioteca UI |
| **TypeScript** | 5+ | Tipagem estática |
| **Tailwind CSS** | 3+ | Estilização utility-first |
| **shadcn/ui** | latest | Componentes UI acessíveis |
| **TanStack Table** | 8+ | Tabela com filtros/ordenação/seleção |
| **TanStack Query** | 5+ | Cache e gerenciamento de estado server |
| **Zustand** | 4+ | Estado global leve |
| **Lucide React** | latest | Ícones |
| **date-fns** | latest | Formatação de datas |

### 2.2 Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js API Routes** | 14+ | Backend integrado |
| **Prisma** | 5+ | ORM type-safe |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **NextAuth.js** | 5+ | Autenticação OAuth2 |
| **googleapis** | latest | SDK oficial do Google |

### 2.3 Infraestrutura

| Componente | Serviço Sugerido |
|------------|------------------|
| **Hosting** | Vercel |
| **Database** | Vercel Postgres ou Supabase |
| **Ambiente** | Node.js 20+ |

---

## 3. ARQUITETURA DO PROJETO

### 3.1 Estrutura de Pastas

```
ytpm-web/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── migrations/                # Migrações do Prisma
│
├── src/
│   ├── app/                       # App Router (Next.js 14)
│   │   ├── (auth)/               # Grupo de rotas de autenticação
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Grupo de rotas autenticadas
│   │   │   ├── playlists/
│   │   │   │   └── page.tsx      # Gerenciamento de playlists
│   │   │   ├── channels/
│   │   │   │   └── page.tsx      # Gerenciamento de canais
│   │   │   ├── config/
│   │   │   │   ├── playlists/
│   │   │   │   │   └── page.tsx  # Configuração de playlists
│   │   │   │   └── channels/
│   │   │   │       └── page.tsx  # Configuração de canais
│   │   │   ├── quota/
│   │   │   │   └── page.tsx      # Status de quota
│   │   │   └── layout.tsx        # Layout com sidebar
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts  # NextAuth handlers
│   │   │   ├── playlists/
│   │   │   │   ├── route.ts      # GET: listar playlists
│   │   │   │   ├── [id]/
│   │   │   │   │   └── items/
│   │   │   │   │       └── route.ts  # GET: vídeos da playlist
│   │   │   │   └── transfer/
│   │   │   │       └── route.ts  # POST: transferir vídeos
│   │   │   ├── channels/
│   │   │   │   ├── route.ts      # GET: listar canais
│   │   │   │   ├── [id]/
│   │   │   │   │   └── videos/
│   │   │   │   │       └── route.ts  # GET: vídeos do canal
│   │   │   │   └── assign/
│   │   │   │       └── route.ts  # POST: atribuir a playlist
│   │   │   ├── config/
│   │   │   │   ├── playlists/
│   │   │   │   │   └── route.ts  # GET/PUT: config playlists
│   │   │   │   └── channels/
│   │   │   │       └── route.ts  # GET/PUT: config canais
│   │   │   └── quota/
│   │   │       └── route.ts      # GET: status de quota
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page (redirect)
│   │   └── globals.css           # Estilos globais
│   │
│   ├── components/
│   │   ├── ui/                   # Componentes shadcn/ui
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Navegação lateral
│   │   │   ├── Header.tsx        # Cabeçalho com usuário
│   │   │   └── QuotaIndicator.tsx # Indicador de quota
│   │   ├── playlists/
│   │   │   ├── PlaylistSelector.tsx
│   │   │   ├── VideoTable.tsx
│   │   │   ├── VideoFilters.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   ├── TransferDialog.tsx
│   │   │   └── StatsBar.tsx
│   │   ├── channels/
│   │   │   ├── ChannelSelector.tsx
│   │   │   ├── ChannelCard.tsx
│   │   │   └── AssignDialog.tsx
│   │   └── shared/
│   │       ├── DurationPresets.tsx
│   │       ├── ViewCountPresets.tsx
│   │       ├── LanguageFilter.tsx
│   │       ├── SearchFilter.tsx
│   │       └── ViewModeToggle.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts               # Configuração NextAuth
│   │   ├── prisma.ts             # Cliente Prisma singleton
│   │   ├── youtube.ts            # Serviço YouTube API
│   │   ├── quota.ts              # Gerenciamento de quota
│   │   └── utils.ts              # Utilitários gerais
│   │
│   ├── hooks/
│   │   ├── usePlaylistItems.ts
│   │   ├── useChannelVideos.ts
│   │   ├── useVideoFilters.ts
│   │   ├── useQuota.ts
│   │   └── useTransfer.ts
│   │
│   ├── stores/
│   │   └── filterStore.ts        # Estado global de filtros
│   │
│   └── types/
│       ├── playlist.ts
│       ├── channel.ts
│       ├── video.ts
│       ├── filter.ts
│       └── quota.ts
│
├── public/
│   └── logo.svg
│
├── .env.local                    # Variáveis de ambiente
├── .env.example                  # Template de variáveis
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. SCHEMA DO BANCO DE DADOS

### 4.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model User {
  id              String    @id @default(cuid())
  name            String?
  email           String?   @unique
  emailVerified   DateTime?
  image           String?
  youtubeChannelId String?  @unique  // Channel ID do YouTube do usuário
  
  accounts        Account[]
  sessions        Session[]
  playlistConfigs PlaylistConfig[]
  channelConfigs  ChannelConfig[]
  quotaHistories  QuotaHistory[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model PlaylistConfig {
  id                   String   @id @default(cuid())
  userId               String
  playlistId           String   // ID da playlist no YouTube
  title                String?
  isEnabled            Boolean  @default(true)
  videoCount           Int?
  totalDurationSeconds Int?
  
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([userId, playlistId])
  @@index([userId])
}

model ChannelConfig {
  id                   String    @id @default(cuid())
  userId               String
  channelId            String    // ID do canal no YouTube
  title                String?
  isEnabled            Boolean   @default(true)
  subscriptionDate     DateTime?
  totalDurationSeconds Int?
  
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@unique([userId, channelId])
  @@index([userId])
}

model QuotaHistory {
  id            String   @id @default(cuid())
  userId        String
  date          DateTime @db.Date
  consumedUnits Int      @default(0)
  dailyLimit    Int      @default(10000)
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, date])
  @@index([userId])
}
```

---

## 5. TIPOS TYPESCRIPT

### 5.1 Types de Domínio

```typescript
// src/types/playlist.ts

export interface Playlist {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  createdDate: string;
  thumbnailUrl?: string;
}

export interface PlaylistConfig {
  id: string;
  playlistId: string;
  title: string;
  isEnabled: boolean;
  videoCount: number;
  totalDurationSeconds: number;
}
```

```typescript
// src/types/channel.ts

export interface Channel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
  subscribedAt?: string;
}

export interface ChannelConfig {
  id: string;
  channelId: string;
  title: string;
  isEnabled: boolean;
  subscriptionDate?: string;
  totalDurationSeconds: number;
}
```

```typescript
// src/types/video.ts

export interface Video {
  id: string;              // playlistItemId (para remoção)
  videoId: string;         // ID do vídeo no YouTube
  title: string;
  channelTitle: string;
  duration: string;        // ISO 8601: "PT1H2M3S"
  durationInSeconds: number;
  viewCount: number;
  language: string;
  publishedAt: string;
  addedToPlaylistAt?: string;
  thumbnailUrl: string;
  isSelected: boolean;
}
```

```typescript
// src/types/filter.ts

export interface VideoFilter {
  // Filtro de texto
  searchText: string;
  searchInTitle: boolean;
  searchInDescription: boolean;
  searchInChannel: boolean;
  
  // Filtro de idioma
  selectedLanguage: string;
  
  // Filtro de duração (em segundos)
  minDuration: number;
  maxDuration: number;
  
  // Filtro de visualizações
  minViewCount: number;
  maxViewCount: number;
}

export type DurationPreset = 'all' | 'shorts' | 'short' | 'medium' | 'long';
export type ViewCountPreset = 'all' | 'low' | 'medium' | 'high' | 'viral';
```

```typescript
// src/types/quota.ts

export interface QuotaStatus {
  date: string;
  consumedUnits: number;
  dailyLimit: number;
  remainingUnits: number;
  percentUsed: number;
}

export interface QuotaCost {
  endpoint: string;
  cost: number;
}

// Custos por endpoint da API do YouTube
export const QUOTA_COSTS: Record<string, number> = {
  'playlists.list': 1,
  'playlistItems.list': 1,
  'playlistItems.insert': 50,
  'playlistItems.delete': 50,
  'videos.list': 1,
  'channels.list': 1,
  'subscriptions.list': 1,
  'search.list': 100,
};

export const DAILY_QUOTA_LIMIT = 10000;
```

---

## 6. FUNCIONALIDADES DETALHADAS

### 6.1 Autenticação (OAuth2 com Google)

**Fluxo:**
1. Usuário clica em "Entrar com Google"
2. Redirecionado para tela de autorização do Google
3. Após autorização, callback processa tokens
4. Busca Channel ID do usuário via API
5. Sessão criada, usuário redirecionado ao dashboard

**Scopes necessários:**
- `https://www.googleapis.com/auth/youtube` (acesso completo)
- `email` e `profile` (dados do usuário)

**Implementação NextAuth:**

```typescript
// src/lib/auth.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { google } from "googleapis";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/youtube",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && account.access_token) {
        // Buscar Channel ID do YouTube
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: account.access_token });
        
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const response = await youtube.channels.list({
          part: ["id"],
          mine: true,
        });
        
        const channelId = response.data.items?.[0]?.id;
        if (channelId) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { youtubeChannelId: channelId },
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { accounts: true },
      });
      
      session.user.id = user.id;
      session.user.youtubeChannelId = dbUser?.youtubeChannelId;
      session.accessToken = dbUser?.accounts[0]?.access_token;
      
      return session;
    },
  },
});
```

---

### 6.2 Gerenciamento de Playlists

#### 6.2.1 Tela Principal de Playlists

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  PLAYLISTS                                     │
│             │                                                │
│  Playlists  │  ┌─────────────────┐  ┌─────────────────┐     │
│  Canais     │  │ Playlist Origem │  │ Playlist Destino│     │
│  Config     │  │ [Dropdown ▼   ] │  │ [Dropdown ▼   ] │     │
│  Quota      │  └─────────────────┘  └─────────────────┘     │
│             │                                                │
│             │  ┌────────────────────────────────────────┐   │
│             │  │ FILTROS                                │   │
│             │  │ [Busca...] ☑Título ☑Descrição ☑Canal  │   │
│             │  │ Idioma: [Todos ▼]                      │   │
│             │  │ Duração: [Shorts][Curtos][Médios][Longos]│ │
│             │  │          Min: [____] Max: [____]       │   │
│             │  │ Views: [Baixas][Médias][Altas][Virais] │   │
│             │  │        Min: [____] Max: [____]         │   │
│             │  │ [Resetar] [Selecionar Todos]          │   │
│             │  └────────────────────────────────────────┘   │
│             │                                                │
│             │  ┌────────────────────────────────────────┐   │
│             │  │ VISUALIZAÇÃO: [Grade][Lista][Tabela]  │   │
│             │  └────────────────────────────────────────┘   │
│             │                                                │
│             │  ┌────────────────────────────────────────┐   │
│             │  │ VÍDEOS                                 │   │
│             │  │ ☐ │ Thumb │ Título │ Canal │ Dur │ Views│  │
│             │  │ ☑ │ [img] │ Video1 │ Ch1   │ 5:30│ 1.2K │  │
│             │  │ ☐ │ [img] │ Video2 │ Ch2   │ 12:00│ 45K │  │
│             │  │ ...                                    │   │
│             │  └────────────────────────────────────────┘   │
│             │                                                │
│             │  ┌────────────────────────────────────────┐   │
│             │  │ Total: 150 │ Filtrados: 45 │ Selecionados: 3│
│             │  │ Duração selecionada: 01:23:45          │   │
│             │  │                   [TRANSFERIR VÍDEOS]  │   │
│             │  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Componente VideoFilters

**Props e Estado:**

```typescript
// src/components/playlists/VideoFilters.tsx

interface VideoFiltersProps {
  filters: VideoFilter;
  onFiltersChange: (filters: VideoFilter) => void;
  availableLanguages: string[];
  onReset: () => void;
  onToggleSelectAll: () => void;
  selectedCount: number;
  filteredCount: number;
}

// Presets de duração
const DURATION_PRESETS = {
  all: { min: 0, max: Infinity, label: 'Todos' },
  shorts: { min: 0, max: 60, label: 'Shorts (<1min)' },
  short: { min: 60, max: 300, label: 'Curtos (1-5min)' },
  medium: { min: 300, max: 1200, label: 'Médios (5-20min)' },
  long: { min: 1200, max: Infinity, label: 'Longos (>20min)' },
};

// Presets de visualizações
const VIEW_COUNT_PRESETS = {
  all: { min: 0, max: Infinity, label: 'Todas' },
  low: { min: 0, max: 1000, label: 'Baixas (<1K)' },
  medium: { min: 1000, max: 10000, label: 'Médias (1K-10K)' },
  high: { min: 10000, max: 100000, label: 'Altas (10K-100K)' },
  viral: { min: 100000, max: Infinity, label: 'Virais (>100K)' },
};
```

#### 6.2.3 Componente VideoTable (TanStack Table)

**Colunas:**

| Coluna | Tipo | Ordenável | Descrição |
|--------|------|-----------|-----------|
| Seleção | Checkbox | Não | Marcar para operações |
| Thumbnail | Imagem | Não | Miniatura 120x68px |
| Título | Texto | Sim | Nome do vídeo (link para YouTube) |
| Canal | Texto | Sim | Nome do canal |
| Duração | Texto | Sim | Formato HH:MM:SS |
| Visualizações | Número | Sim | Formatado (K/M) |
| Publicado | Data | Sim | Formato dd/MM/yyyy |
| Adicionado | Data | Sim | Formato dd/MM/yyyy |
| Idioma | Texto | Sim | Código do idioma |

**Funcionalidades da tabela:**
- Ordenação por qualquer coluna (asc/desc)
- Seleção múltipla com checkbox
- "Selecionar todos filtrados"
- Virtualização para listas grandes
- Responsivo (scroll horizontal no mobile)

#### 6.2.4 Transferência de Vídeos

**Fluxo:**

```typescript
// POST /api/playlists/transfer

interface TransferRequest {
  sourcePlaylistId: string;
  destinationPlaylistId: string;
  videos: Array<{
    playlistItemId: string;  // Para remoção
    videoId: string;         // Para inserção
  }>;
}

interface TransferResponse {
  success: boolean;
  transferred: number;
  errors: number;
  details: Array<{
    videoId: string;
    status: 'success' | 'error';
    error?: string;
  }>;
}

// Lógica no backend:
// Para cada vídeo:
// 1. playlistItems.insert no destino (50 unidades)
// 2. Se sucesso: playlistItems.delete da origem (50 unidades)
// 3. Registrar quota consumida
// 4. Retornar resultado parcial em caso de erro
```

**Cálculo de Quota:**
- Transferir 1 vídeo = 50 (insert) + 50 (delete) = 100 unidades
- Transferir 10 vídeos = 1000 unidades
- Quota diária = 10.000 → Máximo ~100 vídeos/dia

---

### 6.3 Gerenciamento de Canais

#### 6.3.1 Tela de Canais

**Layout similar à tela de playlists, mas:**
- Dropdown único para selecionar canal
- Dropdown de "Playlist Destino" para atribuição
- Botão "Atribuir a Playlist" (apenas adiciona, não remove)

#### 6.3.2 Busca de Vídeos do Canal

**ATENÇÃO:** A busca de vídeos de um canal usa `search.list`, que custa **100 unidades** por chamada!

```typescript
// GET /api/channels/[id]/videos

// Busca vídeos do canal (search.list - 100 unidades)
// Limitar a 50 vídeos mais recentes
// Depois busca metadados completos (videos.list - 1 unidade por 50)
```

---

### 6.4 Sistema de Filtros

#### 6.4.1 Filtro de Texto

**Comportamento:**
- Busca case-insensitive
- Busca parcial (substring)
- Campos configuráveis: Título, Descrição, Canal
- Por padrão, todos os campos marcados

```typescript
const filterByText = (video: Video, filter: VideoFilter): boolean => {
  if (!filter.searchText) return true;
  
  const search = filter.searchText.toLowerCase();
  
  if (filter.searchInTitle && video.title.toLowerCase().includes(search)) {
    return true;
  }
  if (filter.searchInDescription && video.description?.toLowerCase().includes(search)) {
    return true;
  }
  if (filter.searchInChannel && video.channelTitle.toLowerCase().includes(search)) {
    return true;
  }
  
  return false;
};
```

#### 6.4.2 Filtro de Idioma

**Comportamento:**
- Lista idiomas presentes nos vídeos carregados
- Opção "Todos" como padrão
- Idiomas em português: "Português", "Inglês", "Espanhol", etc.

#### 6.4.3 Filtro de Duração

**Presets:**
```typescript
const DURATION_PRESETS = {
  shorts: { min: 0, max: 60, label: 'Shorts' },       // < 1 min
  short: { min: 60, max: 300, label: 'Curtos' },     // 1-5 min
  medium: { min: 300, max: 1200, label: 'Médios' },  // 5-20 min
  long: { min: 1200, max: Infinity, label: 'Longos' }, // > 20 min
};
```

**Controles manuais:**
- Slider ou input para duração mínima (segundos)
- Slider ou input para duração máxima (segundos)

#### 6.4.4 Filtro de Visualizações

**Presets:**
```typescript
const VIEW_PRESETS = {
  low: { min: 0, max: 1000, label: 'Baixas' },           // < 1K
  medium: { min: 1000, max: 10000, label: 'Médias' },    // 1K-10K
  high: { min: 10000, max: 100000, label: 'Altas' },     // 10K-100K
  viral: { min: 100000, max: Infinity, label: 'Virais' }, // > 100K
};
```

#### 6.4.5 Aplicação de Filtros

```typescript
const applyFilters = (videos: Video[], filters: VideoFilter): Video[] => {
  return videos.filter(video => {
    // Filtro de texto
    if (!filterByText(video, filters)) return false;
    
    // Filtro de idioma
    if (filters.selectedLanguage && 
        filters.selectedLanguage !== 'all' &&
        video.language !== filters.selectedLanguage) {
      return false;
    }
    
    // Filtro de duração
    if (video.durationInSeconds < filters.minDuration) return false;
    if (filters.maxDuration !== Infinity && 
        video.durationInSeconds > filters.maxDuration) return false;
    
    // Filtro de visualizações
    if (video.viewCount < filters.minViewCount) return false;
    if (filters.maxViewCount !== Infinity && 
        video.viewCount > filters.maxViewCount) return false;
    
    return true;
  });
};
```

---

### 6.5 Configuração de Playlists/Canais

#### 6.5.1 Tela de Configuração

**Funcionalidade:**
- Lista todas as playlists/canais do usuário
- Toggle para ativar/desativar cada item
- Itens desativados não aparecem nos dropdowns principais
- Botões "Selecionar Todos" e "Desmarcar Todos"
- Salvar automaticamente ao alterar

**Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ CONFIGURAÇÃO DE PLAYLISTS                                  │
├────────────────────────────────────────────────────────────┤
│ [Selecionar Todos] [Desmarcar Todos]                       │
├─────────────────────────────────────────────────────────────┤
│ ☑ Minha Playlist Principal       │ 150 vídeos │ 45:30:00   │
│ ☑ Música para Trabalhar          │  82 vídeos │ 12:15:30   │
│ ☐ Watch Later (oculta)           │ 523 vídeos │ 89:45:12   │
│ ☑ Tutoriais de Programação       │  45 vídeos │ 18:20:00   │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.6 Gerenciamento de Quota

#### 6.6.1 Indicador de Quota (Header)

**Sempre visível no header:**
```
┌─────────────────────────────────────────┐
│ Quota: ████████░░ 7.523/10.000 (75.2%)  │
└─────────────────────────────────────────┘
```

**Cores:**
- Verde: < 50% usado
- Amarelo: 50-80% usado
- Vermelho: > 80% usado

#### 6.6.2 Tela de Status de Quota

**Informações:**
- Consumo atual do dia
- Limite diário (10.000)
- Unidades restantes
- Percentual usado
- Histórico dos últimos 7 dias (gráfico)
- Tabela de custos por operação

#### 6.6.3 Tracking de Quota

```typescript
// src/lib/quota.ts

import { prisma } from './prisma';
import { QUOTA_COSTS, DAILY_QUOTA_LIMIT } from '@/types/quota';

export async function trackQuotaUsage(
  userId: string,
  endpoint: string,
  multiplier: number = 1
): Promise<void> {
  const cost = (QUOTA_COSTS[endpoint] || 0) * multiplier;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.quotaHistory.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      consumedUnits: { increment: cost },
    },
    create: {
      userId,
      date: today,
      consumedUnits: cost,
      dailyLimit: DAILY_QUOTA_LIMIT,
    },
  });
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const quota = await prisma.quotaHistory.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });
  
  const consumedUnits = quota?.consumedUnits || 0;
  const dailyLimit = DAILY_QUOTA_LIMIT;
  
  return {
    date: today.toISOString(),
    consumedUnits,
    dailyLimit,
    remainingUnits: dailyLimit - consumedUnits,
    percentUsed: (consumedUnits / dailyLimit) * 100,
  };
}

export async function checkQuotaAvailable(
  userId: string,
  requiredUnits: number
): Promise<boolean> {
  const status = await getQuotaStatus(userId);
  return status.remainingUnits >= requiredUnits;
}
```

#### 6.6.4 Alerta de Quota Excedida

**Comportamento:**
- Modal de aviso quando quota > 90%
- Bloquear operações quando quota = 100%
- Mensagem: "Limite diário de quota atingido. Tente novamente amanhã."

---

## 7. ENDPOINTS DA API

### 7.1 Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/auth/signin` | Página de login |
| GET | `/api/auth/callback/google` | Callback OAuth |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/session` | Dados da sessão |

### 7.2 Playlists

| Método | Rota | Descrição | Quota |
|--------|------|-----------|-------|
| GET | `/api/playlists` | Lista playlists do usuário | 1/página |
| GET | `/api/playlists/[id]/items` | Lista vídeos da playlist | 1/página + 1/50 vídeos |
| POST | `/api/playlists/transfer` | Transfere vídeos | 100/vídeo |

### 7.3 Canais

| Método | Rota | Descrição | Quota |
|--------|------|-----------|-------|
| GET | `/api/channels` | Lista canais inscritos | 1/página |
| GET | `/api/channels/[id]/videos` | Lista vídeos do canal | **100** + 1/50 vídeos |
| POST | `/api/channels/assign` | Atribui vídeos a playlist | 50/vídeo |

### 7.4 Configurações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/config/playlists` | Busca config de playlists |
| PUT | `/api/config/playlists` | Atualiza config de playlists |
| GET | `/api/config/channels` | Busca config de canais |
| PUT | `/api/config/channels` | Atualiza config de canais |

### 7.5 Quota

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/quota` | Status atual de quota |
| GET | `/api/quota/history` | Histórico de quota |

---

## 8. SERVIÇO YOUTUBE API

### 8.1 Implementação

```typescript
// src/lib/youtube.ts

import { google, youtube_v3 } from 'googleapis';
import { trackQuotaUsage } from './quota';

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    this.youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    this.userId = userId;
  }

  // Listar playlists do usuário
  async getPlaylists(): Promise<Playlist[]> {
    const playlists: Playlist[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, 'playlists.list');

      for (const item of response.data.items || []) {
        playlists.push({
          id: item.id!,
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          itemCount: item.contentDetails?.itemCount || 0,
          createdDate: item.snippet?.publishedAt || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return playlists;
  }

  // Listar vídeos de uma playlist
  async getPlaylistItems(playlistId: string): Promise<Video[]> {
    const items: Video[] = [];
    const videoIds: string[] = [];
    let pageToken: string | undefined;

    // 1. Buscar IDs dos vídeos
    do {
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, 'playlistItems.list');

      for (const item of response.data.items || []) {
        items.push({
          id: item.id!,
          videoId: item.contentDetails?.videoId || '',
          title: item.snippet?.title || '',
          channelTitle: item.snippet?.videoOwnerChannelTitle || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
          addedToPlaylistAt: item.snippet?.publishedAt,
          duration: '',
          durationInSeconds: 0,
          viewCount: 0,
          language: '',
          publishedAt: '',
          isSelected: false,
        });
        videoIds.push(item.contentDetails?.videoId || '');
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // 2. Buscar metadados completos em batches de 50
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50);
      const response = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: batch,
      });

      await trackQuotaUsage(this.userId, 'videos.list');

      for (const video of response.data.items || []) {
        const item = items.find(i => i.videoId === video.id);
        if (item) {
          item.duration = video.contentDetails?.duration || '';
          item.durationInSeconds = this.parseDuration(video.contentDetails?.duration || '');
          item.viewCount = parseInt(video.statistics?.viewCount || '0');
          item.language = video.snippet?.defaultAudioLanguage || '';
          item.publishedAt = video.snippet?.publishedAt || '';
        }
      }
    }

    return items;
  }

  // Adicionar vídeo a uma playlist
  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<boolean> {
    try {
      await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
      });

      await trackQuotaUsage(this.userId, 'playlistItems.insert');
      return true;
    } catch (error) {
      console.error('Erro ao adicionar vídeo:', error);
      return false;
    }
  }

  // Remover vídeo de uma playlist
  async removeVideoFromPlaylist(playlistItemId: string): Promise<boolean> {
    try {
      await this.youtube.playlistItems.delete({
        id: playlistItemId,
      });

      await trackQuotaUsage(this.userId, 'playlistItems.delete');
      return true;
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      return false;
    }
  }

  // Listar canais inscritos
  async getSubscribedChannels(): Promise<Channel[]> {
    const channels: Channel[] = [];
    const channelIds: string[] = [];
    let pageToken: string | undefined;

    // 1. Buscar inscrições
    do {
      const response = await this.youtube.subscriptions.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50,
        pageToken,
      });

      await trackQuotaUsage(this.userId, 'subscriptions.list');

      for (const item of response.data.items || []) {
        channelIds.push(item.snippet?.resourceId?.channelId || '');
        channels.push({
          id: item.snippet?.resourceId?.channelId || '',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
          subscriberCount: 0,
          videoCount: 0,
          subscribedAt: item.snippet?.publishedAt,
        });
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // 2. Buscar detalhes dos canais em batches de 50
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      const response = await this.youtube.channels.list({
        part: ['statistics'],
        id: batch,
      });

      await trackQuotaUsage(this.userId, 'channels.list');

      for (const channel of response.data.items || []) {
        const item = channels.find(c => c.id === channel.id);
        if (item) {
          item.subscriberCount = parseInt(channel.statistics?.subscriberCount || '0');
          item.videoCount = parseInt(channel.statistics?.videoCount || '0');
        }
      }
    }

    return channels;
  }

  // Buscar vídeos de um canal (CARO: 100 unidades!)
  async getChannelVideos(channelId: string): Promise<Video[]> {
    const response = await this.youtube.search.list({
      part: ['snippet'],
      channelId,
      type: ['video'],
      maxResults: 50,
      order: 'date',
    });

    await trackQuotaUsage(this.userId, 'search.list');

    const videoIds = response.data.items?.map(i => i.id?.videoId || '') || [];
    const videos: Video[] = [];

    // Buscar metadados completos
    if (videoIds.length > 0) {
      const detailsResponse = await this.youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: videoIds,
      });

      await trackQuotaUsage(this.userId, 'videos.list');

      for (const video of detailsResponse.data.items || []) {
        videos.push({
          id: '',  // Não há playlistItemId aqui
          videoId: video.id!,
          title: video.snippet?.title || '',
          channelTitle: video.snippet?.channelTitle || '',
          duration: video.contentDetails?.duration || '',
          durationInSeconds: this.parseDuration(video.contentDetails?.duration || ''),
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          language: video.snippet?.defaultAudioLanguage || '',
          publishedAt: video.snippet?.publishedAt || '',
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
          isSelected: false,
        });
      }
    }

    return videos;
  }

  // Parser de duração ISO 8601 → segundos
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}
```

---

## 9. COMPONENTES UI

### 9.1 Formatadores

```typescript
// src/lib/utils.ts

// Formatar duração: 3661 → "01:01:01"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Formatar visualizações: 1234567 → "1.2M"
export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// Formatar data: ISO → "dd/MM/yyyy"
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR');
}

// Mapear código de idioma
export function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'pt': 'Português',
    'pt-BR': 'Português (Brasil)',
    'en': 'Inglês',
    'en-US': 'Inglês (EUA)',
    'es': 'Espanhol',
    'fr': 'Francês',
    'de': 'Alemão',
    'it': 'Italiano',
    'ja': 'Japonês',
    'ko': 'Coreano',
    'zh': 'Chinês',
    // ... adicionar mais conforme necessário
  };
  return languages[code] || code || 'Desconhecido';
}
```

### 9.2 Componentes shadcn/ui Necessários

Execute durante o setup:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add toggle
npx shadcn-ui@latest add toggle-group
npx shadcn-ui@latest add tooltip
```

---

## 10. MODOS DE VISUALIZAÇÃO

### 10.1 Modo Grade (Grid)

Cards com:
- Thumbnail (16:9)
- Título (2 linhas, truncar)
- Canal
- Duração (badge no canto)
- Views (badge)
- Checkbox de seleção

### 10.2 Modo Lista (List)

Lista vertical compacta:
- Thumbnail pequena (120x68)
- Título + Canal na mesma linha
- Duração + Views + Data compactos
- Checkbox

### 10.3 Modo Tabela (Table)

DataGrid completo (TanStack Table):
- Todas as colunas visíveis
- Ordenação clicando no header
- Seleção múltipla
- Scroll horizontal no mobile

---

## 11. RESPONSIVIDADE

### 11.1 Breakpoints

```typescript
// Tailwind defaults
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### 11.2 Adaptações Mobile

- Sidebar vira menu hamburguer (Sheet)
- Filtros colapsáveis em accordion
- Modo Grid/Lista padrão (tabela escondida)
- Touch-friendly: botões maiores, swipe

### 11.3 Adaptações Desktop

- Sidebar fixa
- Filtros sempre visíveis
- Modo Tabela disponível
- Shortcuts de teclado

---

## 12. VARIÁVEIS DE AMBIENTE

```bash
# .env.local

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/ytpm?schema=public
```

---

## 13. SETUP INICIAL

### 13.1 Criar Projeto

```bash
# Criar projeto Next.js
npx create-next-app@latest ytpm-web --typescript --tailwind --eslint --app --src-dir

cd ytpm-web

# Instalar dependências
npm install @prisma/client @auth/prisma-adapter next-auth@beta googleapis
npm install @tanstack/react-table @tanstack/react-query zustand
npm install date-fns lucide-react class-variance-authority clsx tailwind-merge

# Dependências de desenvolvimento
npm install -D prisma @types/node

# Inicializar Prisma
npx prisma init

# Instalar shadcn/ui
npx shadcn-ui@latest init
```

### 13.2 Google Cloud Console

1. Criar projeto no Google Cloud Console
2. Ativar YouTube Data API v3
3. Criar credenciais OAuth 2.0:
   - Tipo: Aplicação Web
   - URIs de redirecionamento autorizados:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://seu-dominio.com/api/auth/callback/google` (prod)
4. Copiar Client ID e Client Secret para `.env.local`

### 13.3 Configurar Banco de Dados

```bash
# Criar banco PostgreSQL (local ou Supabase/Vercel)

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# (Opcional) Visualizar banco
npx prisma studio
```

---

## 14. FLUXOS DE TESTE

### 14.1 Fluxo de Autenticação

1. Acessar `/login`
2. Clicar "Entrar com Google"
3. Autorizar no Google
4. Verificar redirecionamento para `/playlists`
5. Verificar dados do usuário no header

### 14.2 Fluxo de Transferência

1. Selecionar playlist de origem
2. Aguardar carregamento de vídeos
3. Aplicar filtro (ex: idioma = Português)
4. Selecionar 3 vídeos
5. Selecionar playlist de destino
6. Clicar "Transferir"
7. Verificar mensagem de sucesso
8. Verificar quota consumida

### 14.3 Fluxo de Quota

1. Realizar várias operações
2. Verificar indicador de quota no header
3. Acessar `/quota`
4. Verificar histórico

---

## 15. CONSIDERAÇÕES FINAIS

### 15.1 Prioridade de Implementação

1. **Fase 1 - MVP:**
   - Autenticação OAuth2
   - Listagem de playlists
   - Listagem de vídeos
   - Filtros básicos (texto, duração)
   - Transferência simples

2. **Fase 2 - Completo:**
   - Todos os filtros
   - Gerenciamento de canais
   - Configuração de visibilidade
   - Sistema de quota completo

3. **Fase 3 - Polimento:**
   - 3 modos de visualização
   - Responsividade completa
   - Animações e transições
   - PWA (Progressive Web App)

### 15.2 Boas Práticas

- Sempre verificar quota antes de operações custosas
- Usar cache (TanStack Query) para reduzir chamadas à API
- Mostrar loading states claros
- Tratar erros com mensagens amigáveis
- Logs detalhados no backend para debug

### 15.3 Limitações Conhecidas

- Quota diária de 10.000 unidades
- Máximo ~100 transferências por dia
- `search.list` muito caro (100 unidades)
- Refresh tokens expiram após longo período de inatividade

---

## ANEXO A: TEXTOS DA INTERFACE (pt-BR)

```typescript
// src/lib/i18n.ts

export const UI_TEXT = {
  // Navegação
  nav: {
    playlists: 'Playlists',
    channels: 'Canais',
    config: 'Configurações',
    quota: 'Quota',
    logout: 'Sair',
  },
  
  // Playlists
  playlists: {
    title: 'Gerenciar Playlists',
    sourcePlaylist: 'Playlist de Origem',
    destinationPlaylist: 'Playlist de Destino',
    selectPlaylist: 'Selecione uma playlist',
    loadVideos: 'Carregar Vídeos',
    transferVideos: 'Transferir Vídeos',
    noVideos: 'Nenhum vídeo encontrado',
    loadingVideos: 'Carregando vídeos...',
  },
  
  // Filtros
  filters: {
    title: 'Filtros',
    search: 'Buscar...',
    searchInTitle: 'Título',
    searchInDescription: 'Descrição',
    searchInChannel: 'Canal',
    language: 'Idioma',
    allLanguages: 'Todos os idiomas',
    duration: 'Duração',
    durationMin: 'Mínima (segundos)',
    durationMax: 'Máxima (segundos)',
    views: 'Visualizações',
    viewsMin: 'Mínimas',
    viewsMax: 'Máximas',
    reset: 'Resetar Filtros',
    selectAll: 'Selecionar Todos',
    deselectAll: 'Desmarcar Todos',
  },
  
  // Presets
  presets: {
    duration: {
      shorts: 'Shorts',
      short: 'Curtos',
      medium: 'Médios',
      long: 'Longos',
    },
    views: {
      low: 'Baixas',
      medium: 'Médias',
      high: 'Altas',
      viral: 'Virais',
    },
  },
  
  // Estatísticas
  stats: {
    total: 'Total',
    filtered: 'Filtrados',
    selected: 'Selecionados',
    duration: 'Duração',
  },
  
  // Visualização
  viewMode: {
    grid: 'Grade',
    list: 'Lista',
    table: 'Tabela',
  },
  
  // Colunas da tabela
  columns: {
    select: 'Selecionar',
    thumbnail: 'Miniatura',
    title: 'Título',
    channel: 'Canal',
    duration: 'Duração',
    views: 'Visualizações',
    published: 'Publicado',
    added: 'Adicionado',
    language: 'Idioma',
  },
  
  // Quota
  quota: {
    title: 'Status de Quota',
    used: 'Utilizada',
    remaining: 'Restante',
    limit: 'Limite diário',
    history: 'Histórico',
    warning: 'Atenção: Quota em {percent}%',
    exceeded: 'Limite diário de quota atingido. Tente novamente amanhã.',
  },
  
  // Configurações
  config: {
    playlistsTitle: 'Configuração de Playlists',
    channelsTitle: 'Configuração de Canais',
    enableAll: 'Ativar Todos',
    disableAll: 'Desativar Todos',
    videos: 'vídeos',
  },
  
  // Mensagens
  messages: {
    transferSuccess: 'Transferidos {count} vídeos com sucesso!',
    transferPartial: 'Transferidos {success} vídeos. {errors} erros.',
    transferError: 'Erro ao transferir vídeos.',
    loadError: 'Erro ao carregar dados.',
    quotaExceeded: 'Quota diária excedida.',
  },
  
  // Autenticação
  auth: {
    login: 'Entrar',
    loginWithGoogle: 'Entrar com Google',
    logout: 'Sair',
    welcome: 'Bem-vindo, {name}!',
  },
};
```

---

**FIM DA ESPECIFICAÇÃO**

Este documento contém todas as informações necessárias para o Claude Code desenvolver a aplicação web completa. Qualquer dúvida durante o desenvolvimento, consulte este documento ou a documentação original do software desktop.
