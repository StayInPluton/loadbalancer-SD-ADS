# 🚀 Escalabilidade de Aplicações Web com Load Balancer

Projeto desenvolvido como Atividade Avaliativa sobre **Escalabilidade Horizontal e Balanceamento de Carga**. A solução simula um ambiente distribuído onde múltiplas instâncias independentes de uma aplicação web em Node.js atendem requisições através de um único ponto de entrada gerenciado pelo NGINX atuando como Load Balancer.

---

## 📐 Arquitetura da Solução

O ambiente é orquestrado via **Docker Compose** e composto por 4 containers principais:

```text
               +-----------------------+
               |  Cliente / Navegador  |
               +-----------------------+
                           |
                           v  (http://localhost:8080)
               +-----------------------+
               | NGINX (Load Balancer) |
               +-----------------------+
                 /         |         \
   Round-Robin  /          |          \  Round-Robin
               v           v           v
        +------------+ +------------+ +------------+
        |   app-01   | |   app-02   | |   app-03   |
        | (Node.js)  | | (Node.js)  | | (Node.js)  |
        |  Port 3001 | |  Port 3002 | |  Port 3003 |
        +------------+ +------------+ +------------+
               \           |           /
                +----------+----------+
                           |
                           v
                Identificador Visual &
                Cabeçalho X-Served-By
```

### Componentes da Arquitetura

1. **Load Balancer (NGINX)**:
   - Atua como Proxy Reverso e único ponto de entrada para os usuários na porta `8080`.
   - Distribui o tráfego entre os servidores usando o algoritmo **Round-Robin**.
2. **Instâncias da Aplicação (`app-01`, `app-02`, `app-03`)**:
   - Três instâncias independentes da aplicação Node.js/Express na porta interna `3000`.
   - Cada container possui variáveis de ambiente exclusivas (`INSTANCE_ID` e `BG_COLOR`).
   - As respostas HTML são renderizadas no servidor (_Server-Side Rendering_) utilizando o motor de templates **Handlebars**.
3. **Cabeçalho de Resposta HTTP**:
   - Cada requisição devolve o cabeçalho personalizado `X-Served-By: <nome-da-instancia>` para auditoria e verificação via CLI (`curl`).

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem & Runtime:** Node.js (v18)
- **Framework Web:** Express.js
- **Template Engine:** Handlebars (`express-handlebars`)
- **Balanceador de Carga / Proxy Reverso:** NGINX (Alpine Image)
- **Containerização & Orquestração:** Docker e Docker Compose

---

## ⚙️ Configuração do Balanceamento de Carga

O balanceador de carga NGINX foi configurado no arquivo `nginx.conf` definindo um bloco `upstream` com os nomes de serviço mapeados pelo Docker Compose:

```nginx
events { worker_connections 1024; }

http {
    upstream app_cluster {
        server app-01:3000;
        server app-02:3000;
        server app-03:3000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://app_cluster;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados no computador.

### Passo Único de Execução

No terminal, navegue até a raiz do projeto e execute o comando abaixo:

```bash
docker compose up --build
```

O Docker baixará as imagens necessárias, construirá o container da aplicação Node.js, configurará o NGINX e subirá todo o cluster automaticamente.

---

## 🧪 Roteiro de Testes e Demonstração (Seção 4 da Atividade)

Abaixo estão as etapas para validar o funcionamento do ambiente durante a apresentação:

### 1. Teste Visual de Alternância (Navegador)

1. Abra o navegador e acesse: `http://localhost:8080`.
2. Pressione `Ctrl + F5` (ou `Cmd + Shift + R`) repetidamente para forçar a atualização da página sem usar o cache do navegador.
3. **Resultado Esperado:** O cartão central alterará entre:
   - **app-01** com fundo Azul (`#1e40af`)
   - **app-02** com fundo Verde (`#15803d`)
   - **app-03** com fundo Laranja (`#c2410c`)
4. O horário em formato de Brasília (América/São Paulo) será atualizado a cada requisição.

---

### 2. Teste por Linha de Comando (Inspecionar Cabeçalhos)

Execute o comando abaixo 3 ou mais vezes seguidas no terminal:

```bash
curl -I http://localhost:8080
```

**Resultado Esperado:** Inspecione a linha do cabeçalho `X-Served-By`. Ela mudará em ordem circular:

```text
X-Served-By: app-01
...
X-Served-By: app-02
...
X-Served-By: app-03
```

---

### 3. Teste de Distribuição em Volume

Para demonstrar o equilíbrio no atendimento de requisições em lote:

#### No Linux / macOS (Bash):

```bash
for i in {1..90}; do curl -s -I http://localhost:8080 | grep "X-Served-By"; done | sort | uniq -c
```

#### No Windows (PowerShell):

```powershell
1..90 | ForEach-Object { (Invoke-WebRequest -Uri "http://localhost:8080").Headers['X-Served-By'] } | Group-Object | Select-Object Count, Name
```

**Resultado Esperado:** Aproximadamente **30 requisições** atendidas por cada uma das 3 instâncias (distribuição uniforme ~33% cada).

---

### 4. Teste de Tolerância a Falhas

1. Com o cluster em execução, abra um segundo terminal e simule a queda da instância `app-01`:
   ```bash
   docker stop meu-projeto-loadbalancer-app-01-1
   # ou simplesmente: docker compose stop app-01
   ```
2. Acesse `http://localhost:8080` no navegador e atualize a página várias vezes.
3. **Resultado Esperado:** O sistema continuará respondendo perfeitamente, alternando apenas entre `app-02` (Verde) e `app-03` (Laranja), sem gerar erros HTTP 500 para o usuário.
4. Para reativar a instância:
   ```bash
   docker compose start app-01
   ```
   A instância `app-01` voltará a integrar a rotação do balanceador.

---

### 5. Teste de Escala (Adicionar Nova Instância)

Para demonstrar a capacidade de escalar a aplicação horizontalmente:

1. Adicione a quarta instância `app-04` no `docker-compose.yml`:
   ```yaml
   app-04:
     build: .
     environment:
       INSTANCE_ID: "app-04"
       BG_COLOR: "#6b21a8" # Roxo
     ports:
       - "3004:3000"
   ```
2. Adicione a nova linha `server app-04:3000;` no bloco `upstream` de `nginx.conf`.
3. Reinicie os serviços:
   ```bash
   docker compose up -d --build
   ```
4. Recarregue a página no navegador. A quarta instância (`app-04` na cor roxa) passará a receber requisições no rodízio.

---

### 6. Teste de Health Check

Acesse diretamente a rota de saúde da aplicação:

```bash
curl http://localhost:8080/health
```

**Resultado Esperado:** Retorno em formato JSON indicando o estado de saúde da instância sorteada:

```json
{ "status": "UP", "instance": "app-02" }
```

---

### 🔍 Prova Negativa

Acesse uma das instâncias diretamente bypassando o NGINX, como por exemplo: `http://localhost:3001` (referente à `app-01`).

**Resultado Esperado:** Recarregar essa página repetidamente **nunca mudará a cor nem o nome da instância**, comprovando que a alternância visual observada na porta `8080` é promovida exclusivamente pela camada de rede do Load Balancer.

---

## 🔮 Evolução Futura da Solução

Caso esta aplicação precise evoluir para um ambiente em produção de grande escala, as seguintes melhorias poderiam ser implementadas:

1. **Persistência e Gerenciamento de Sessão (_Sticky Sessions_ / Redis):**
   - Caso a aplicação exigisse autenticação ou carrinho de compras, a alternância entre instâncias destruiria a sessão local em memória. A solução ideal seria integrar uma camada externa de cache compartilhado como o **Redis** ou **Memcached** para guardar sessões de forma centralizada.
2. **Auto Scaling com Orquestradores:**
   - Utilização de **Kubernetes** (HPA - _Horizontal Pod Autoscaler_) ou **Docker Swarm** para criar e destruir réplicas de pods automaticamente com base na utilização de CPU e memória do cluster.
3. **Active Health Checks e Failover Dinâmico:**
   - Configuração do NGINX Plus ou Traefik com verificações de saúde ativas em tempo real (`/health`), removendo automaticamente do upstream qualquer container que apresente instabilidade antes de repassar a requisição do usuário.
4. **Resiliência e SSL/TLS Termination:**
   - Configuração de certificados SSL (HTTPS) diretamente no NGINX para desacelerar o consumo de CPU das aplicações Node.js e garantir comunicação criptografada.
