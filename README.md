# nomad-challenge

API (NestJS) para ingestão de logs de jogo multiplayer e geração de estatísticas.
Requisitos:

- Docker e Docker Compose

Para iniciar a aplicação, execute o seguinte comando:

- docker compose up -d

A API ficará disponível em [http://localhost:3000](http://localhost:3000) (padrão).

Para executar os testes, acesse [http://localhost:3000/swagger](http://localhost:3000/swagger).

Faça o upload de um arquivo de logs no formato JSON especificado.
Você pode utilizar os arquivos disponíveis neste repositório: game_logs.json e game_logs_10k.json.
Baixe um deles e realize o upload pela interface do Swagger para testar a aplicação.

Observação: se desejar usar mais de um arquivo JSON de logs, certifique-se de que os IDs das partidas criadas sejam
únicos, garantindo o correto funcionamento da aplicação.

A aplicação adota uma arquitetura modular em NestJS, organizada por domínios (uploads, statistics, match, player, kill e
match-participation) e apoiada por infraestrutura de Postgres (TypeORM) e Redis com BullMQ. O fluxo começa no módulo de
uploads, que recebe um arquivo JSON de logs, parseia as linhas e publica eventos na fila; em paralelo, um serviço
consumidor lê continuamente essa fila e despacha cada evento para os serviços de domínio apropriados (por exemplo,
início/fim de partida e abates), persistindo os dados e atualizando estatísticas. O AppModule compõe os módulos de
infraestrutura e de negócios, garantindo baixo acoplamento, alta coesão e processamento assíncrono escalável. A
exposição HTTP (como a de estatísticas) é feita via controllers, e a execução é containerizada com Docker/Docker Compose
para subir facilmente API, banco e Redis.

<img width="1495" height="857" alt="image" src="https://github.com/user-attachments/assets/29eebc1c-0e39-44b9-ad94-f7a7bd99633c" />

Stack:

- NestJS 11, TypeORM, PostgreSQL e Redis (via Docker Compose)
