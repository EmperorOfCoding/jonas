# Jonas Lavagem

Sistema mobile-first para registrar lavagens, consultar dashboard e exportar relatórios.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Database
- PWA manifest

## Rodar localmente

```bash
npm install
npm run dev
```

App local: `http://localhost:3000`

## Ambiente

Crie `.env.local` a partir de `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`DATABASE_URL` pode existir para operações administrativas locais, mas o app não usa essa variável em runtime.

## Tabela esperada

O app usa a tabela Supabase `servicos` com estes campos:

- `id`
- `placa`
- `tipo_lavagem`
- `andar`
- `local`
- `funcionario`
- `data_hora`
- `forma_pagamento`
- `valor`

Leituras e escritas exigem usuário autenticado. A lógica server-side valida sessão com `supabase.auth.getUser()`.

Para bloquear leitura direta pela chave pública anon, rode `docs/supabase-rls.sql` no SQL Editor do Supabase.

## Rotas

- `/login`: autenticação
- `/registro`: novo serviço
- `/dashboard`: KPIs por dia, semana ou mês
- `/atividades`: últimos serviços registrados, com edição e exclusão
- `/relatorio`: filtro por período e exportação
- `/api/relatorio/csv`: export CSV
- `/api/relatorio/pdf`: export PDF

## Regras de negócio

- Preço padrão: `Completo` = R$40, `Externo` = R$30.
- Parte CEO: até R$20 por serviço.
- Parte funcionário: valor restante do serviço.
- Placa normalizada para 7 caracteres alfanuméricos.

## Verificação

```bash
npm run test
npm run lint
npm run build
```

## Progressive Web App (PWA)

O aplicativo foi configurado como um PWA (Progressive Web App) usando a biblioteca `@ducanh2912/next-pwa`. Isso significa que ele pode ser instalado como um aplicativo nativo no celular ou no computador diretamente pelo navegador.
- O Service Worker é gerado automaticamente durante o `npm run build`.
- Para instalar no iOS (Safari): Toque no botão de Compartilhar > "Adicionar à Tela de Início".
- Para instalar no Android (Chrome): Toque no menu (três pontos) > "Adicionar à tela inicial" ou aceite o prompt automático de instalação.
