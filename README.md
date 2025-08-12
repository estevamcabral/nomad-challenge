# nomad-challenge

API (NestJS) para ingestão de logs de jogo e geração de estatísticas.
Requisitos:

- Node.js 22 (via nvm)
- Docker e Docker Compose
- npm

Instalação e configuração:

1. Selecionar Node 22: nvm use 22 (se necessário: nvm install 22)
2. Instalar dependências: npm install

Subir serviços com Docker:

- docker compose up -d

A API ficará disponível em [http://localhost:3000](http://localhost:3000) (padrão).
Testes rápidos com curl:

- Upload de logs (envia o arquivo JSON bruto no body, certifique-se de estar na raiz do projeto para usar o arquivo
  pronto): curl -X POST [http://localhost:3000/uploads](http://localhost:3000/uploads) -H "Content-Type:
  application/json" --data-binary @game_logs_10k.json
- Ranking de partidas por jogador: curl -X
  GET "[http://localhost:3000/statistics/match-ranking/20000001](http://localhost:3000/statistics/match-ranking/20000001)"
  -H "Accept: application/json"
- Arma preferida por jogador: curl -X
  GET "[http://localhost:3000/statistics/preferred-weapon/20000001](http://localhost:3000/statistics/preferred-weapon/20000001)"
  -H "Accept: application/json"
- Ranking global: curl -X
  GET "[http://localhost:3000/statistics/global-ranking](http://localhost:3000/statistics/global-ranking)" -H "Accept:
  application/json"

Stack:

- NestJS 11, TypeORM, PostgreSQL e Redis (via Docker Compose), BullMQ, Jest, ESLint, Prettier
