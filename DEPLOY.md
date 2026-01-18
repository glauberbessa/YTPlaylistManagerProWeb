# Guia de Deploy - YT Playlist Manager Pro Web

Este guia explica como publicar o projeto em hospedagem gratuita com PostgreSQL gratuito.

## Opções de Hospedagem Gratuita

### Opção 1: Vercel + Neon (Recomendado)

Esta é a combinação mais recomendada para projetos Next.js.

#### Passo 1: Criar conta no Neon (PostgreSQL Gratuito)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto
3. Copie a connection string que será algo como:
   ```
   postgresql://usuario:senha@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

**Limites do plano gratuito Neon:**
- 512 MB de armazenamento
- 1 projeto
- 10 branches
- Compute: 0.25 vCPU, 1 GB RAM

#### Passo 2: Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em "Add New Project"
3. Importe o repositório `YTPlaylistManagerProWeb`
4. Configure as variáveis de ambiente:
   ```
   DATABASE_URL=<sua-connection-string-do-neon>
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   NEXTAUTH_SECRET=<gere-com-openssl-rand-base64-32>
   GOOGLE_CLIENT_ID=<seu-client-id>
   GOOGLE_CLIENT_SECRET=<seu-client-secret>
   ```
5. Clique em "Deploy"

**Limites do plano gratuito Vercel:**
- 100 GB de bandwidth/mês
- Builds ilimitados
- Serverless Functions (limite de 10s execução)
- Deploy automático a cada push

---

### Opção 2: Vercel + Supabase

#### Passo 1: Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto (escolha uma senha forte)
3. Vá em Settings > Database > Connection string
4. Copie a URI (modo Session/Transaction pooling para melhor performance):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

**Limites do plano gratuito Supabase:**
- 500 MB de banco de dados
- 1 GB de armazenamento de arquivos
- 2 GB de bandwidth
- Pausa após 7 dias de inatividade

#### Passo 2: Deploy no Vercel
(Mesmo processo da Opção 1)

---

### Opção 3: Railway (Tudo em um só lugar)

Railway oferece hospedagem + PostgreSQL em uma única plataforma.

1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Crie um novo projeto
3. Adicione um serviço PostgreSQL
4. Adicione seu repositório GitHub
5. Configure as variáveis de ambiente
6. Railway detectará automaticamente que é um projeto Next.js

**Limites do plano gratuito Railway:**
- $5 de crédito gratuito/mês
- Após esgotar, o serviço para
- Ideal para projetos de baixo tráfego

---

### Opção 4: Render

1. Acesse [render.com](https://render.com) e crie uma conta
2. Crie um PostgreSQL gratuito (expira após 90 dias)
3. Crie um Web Service conectado ao seu repositório

**Limites do plano gratuito Render:**
- PostgreSQL gratuito por 90 dias apenas
- Web service pode ter "cold starts" de 30+ segundos

---

## Configuração Detalhada (Vercel + Neon)

### 1. Preparar o Banco de Dados

Após criar seu banco no Neon, execute as migrations do Prisma:

```bash
# Localmente, configure a DATABASE_URL temporariamente
export DATABASE_URL="postgresql://..."

# Execute as migrations
npx prisma migrate deploy

# Ou, se ainda não tem migrations, crie a primeira
npx prisma migrate dev --name init
```

### 2. Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Crie um "OAuth 2.0 Client ID"
5. Configure as URIs autorizadas:
   - **Authorized JavaScript origins:**
     - `https://seu-projeto.vercel.app`
   - **Authorized redirect URIs:**
     - `https://seu-projeto.vercel.app/api/auth/callback/google`
6. Ative a YouTube Data API v3

### 3. Gerar NEXTAUTH_SECRET

```bash
# No terminal, execute:
openssl rand -base64 32
```

### 4. Deploy via CLI (Alternativa)

```bash
# Instale a Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel

# Para produção
vercel --prod
```

---

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://user:pass@host/db` |
| `NEXTAUTH_URL` | URL do seu site em produção | `https://seu-app.vercel.app` |
| `NEXTAUTH_SECRET` | Chave secreta para sessões | `abc123...` (32+ caracteres) |
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth Google | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret do cliente OAuth | `GOCSPX-...` |

---

## Comandos Úteis

```bash
# Verificar se o build funciona localmente
npm run build

# Testar em modo produção local
npm run start

# Ver logs no Vercel
vercel logs

# Ver status do banco Prisma
npx prisma studio
```

---

## Troubleshooting

### Erro: "PrismaClientInitializationError"
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que o banco permite conexões externas
- No Neon/Supabase, verifique se `?sslmode=require` está na URL

### Erro: "NEXTAUTH_URL mismatch"
- A `NEXTAUTH_URL` deve ser exatamente igual à URL do seu site
- Inclua `https://` no início
- Não inclua barra `/` no final

### Erro de OAuth: "redirect_uri_mismatch"
- Verifique se a URL de callback está configurada no Google Console
- Deve ser: `https://seu-site.vercel.app/api/auth/callback/google`

### Build falha no Vercel
- Execute `npm run build` localmente primeiro
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs de build no dashboard do Vercel
- Por padrão, o build no Vercel ignora migrations. Para habilitar, defina `RUN_DB_MIGRATIONS=1`.

---

## Comparativo de Custos

| Serviço | PostgreSQL Gratuito | Hospedagem Gratuita | Melhor Para |
|---------|---------------------|---------------------|-------------|
| Vercel + Neon | 512 MB | Ilimitado* | Produção |
| Vercel + Supabase | 500 MB | Ilimitado* | Produção |
| Railway | Incluído ($5/mês) | Incluído | Hobby |
| Render | 90 dias apenas | Cold starts | Testes |

*Sujeito a limites de bandwidth e execução

---

## Recomendação Final

Para este projeto, recomendo **Vercel + Neon**:
- Melhor integração com Next.js
- PostgreSQL serverless sem cold starts
- Fácil configuração
- Plano gratuito generoso
- Deploy automático via GitHub
