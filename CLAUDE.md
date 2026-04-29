# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Aplicação simples de cadastro (CRUD) — tela para incluir, alterar e excluir registros. Projeto de aprendizado para desenvolvimento com Claude Code.

## Tecnologias

- **Frontend:** React + Vite (pasta `/frontend`, porta 3000)
- **Backend:** Node.js + Express (pasta `/backend`, porta 3001)
- **Banco:** SQL Server via `mssql`

## Estrutura

```
/backend    — Express API (rotas JSON, express-session, bcryptjs)
/frontend   — React + Vite (React Router, Context API, axios)
```

## Comandos

Na raiz do projeto:

- `npm run dev` — inicia backend (3001) e frontend (3000) juntos com concurrently
- `npm run dev:backend` — apenas o backend
- `npm run dev:frontend` — apenas o frontend

No frontend:

- `npm run build` — gera o build de produção

## Preferências

- Escreva comentários de código em português
- Após cada alteração, explique o que foi feito
