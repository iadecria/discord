# Master Plan — Executar e testar o Backspace localmente (texto + voz + federação)

## Objetivo

Colocar o **Backspace** (monorepo pnpm/TypeScript: servidor Fastify + Drizzle/SQLite, cliente React/Vite, voz LiveKit, federação S2S) rodando na **máquina Windows local** e validá-lo por smoke test em três camadas:

1. **Texto/plataforma** — registro, spaces/canais, mensagens, permissões, DMs, amigos/presença, uploads, busca, admin, PWA/responsivo.
2. **Voz** — LiveKit local via Docker: entrar em canal de voz, mute/deafen, screen share, chamada de DM.
3. **Federação** — duas instâncias locais com peering, amizade e DM cross-instance.

Além de rodar, o plano passa pelos **gates automatizados** existentes (typecheck, lint, testes) e por um **build de produção**.

> Não é um plano de alteração de código de produto. É um plano de execução/validação. Qualquer correção de bug encontrada deve virar item separado para um agente de implementação.

## Estado atual do repositório (verificado)

- Clone limpo, branch `main`, árvore sem alterações. **Não existe** `node_modules/`, `.env` nem `data/` (setup a partir do zero).
- Node exigido: `>=22.12` (`.nvmrc` = **24**). pnpm pinado em `10.34.3` (`packageManager`, via Corepack).
- Primeiro usuário registrado **vira admin** (sem credenciais padrão).
- Servidor de dev: `PORT=3005`; Vite: `5173`, com proxy `/api` e `/ws` → `localhost:3005`.
- CSP do dev (`packages/web/index.html`) só restringe `script-src/worker-src/object-src/base-uri` — **sem `connect-src`**, então `ws://localhost:7880` (LiveKit) funciona sem ajuste de CSP.
- O cliente web suporta **múltiplas conexões de instância** (`instanceStore`), permitindo federação a partir de um único navegador.
- Testes automatizados: Vitest em `server`, `web`, `desktop`, `scripts/*`. O `server` tem suíte pesada de federação com harness de duas instâncias (`packages/server/test/helpers/twoInstanceHarness.ts`).
- CI/segurança: CodeQL, OSV, gitleaks, Trivy, Scorecard, ZAP (fora do escopo deste smoke local).

## Pré-requisitos e verificação de ambiente

Executar antes de tudo e registrar a saída:

- [ ] Node: `node --version` → **≥ 22.12** (recomendado 24).
- [ ] pnpm: `corepack enable` e depois `pnpm --version` → **10.34.3**.
- [ ] Docker: `docker --version` e `docker info` (necessário para a fase de voz). Se indisponível, ver "Riscos" → o smoke de voz é bloqueado; seguir com texto + federação.
- [ ] Portas livres: `3005`, `3006`, `5173`, `7880`, `7881`, UDP `50000-60000`.
- [ ] Rede: internet para embeds (YouTube/OG) e busca de GIF (Klipy) — opcional, apenas para esses itens.

## Fase 0 — Setup

Trabalhar na raiz do repo. Em PowerShell:

```powershell
node --version
corepack enable
pnpm install
New-Item -ItemType Directory -Force -Path data | Out-Null
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Colar o valor gerado em `JWT_SECRET=` no `.env` (mín. 32 chars, exigido pelo `config.ts`).
- [ ] Confirmar `REGISTRATION_OPEN=true` e `MAX_UPLOAD_SIZE=104857600` (defaults servem).
- [ ] `pnpm install` pode emitir aviso de `uiohook-napi` não recompilado — **esperado e ignorado** (só afeta o app desktop).

**Aceite:** `pnpm install` termina sem erro; `data/` existe; `.env` tem `JWT_SECRET` com ≥32 chars.

## Fase 1 — Gates automatizados (executar antes de abrir o navegador)

```powershell
pnpm typecheck   # compila shared, roda -r typecheck, checa i18n
pnpm lint        # eslint --max-warnings 0 (com eslint-suppressions.json)
pnpm test        # vitest recursivo em todos os pacotes com script "test"
```

Subconjuntos úteis se o run completo for lento ou falhar em pacote fora de escopo:

```powershell
pnpm --filter @backspace/server test
pnpm --filter @backspace/web test
pnpm --filter @backspace/server test:federation-e2e   # harness de 2 instâncias (lento)
pnpm --filter @backspace/server test:federation-identity
```

- [ ] Registrar o resultado de cada gate (pass/fail) no log de evidências abaixo.
- [ ] Se `pnpm test` falhar em `desktop`/`scripts/*` mas `server`+`web` passarem, registrar como **falha fora de escopo** (o smoke alvo é server/web/voz/federação) e seguir.
- [ ] **Aceite:** `pnpm typecheck` e `pnpm lint` saem com código 0; `server` e `web` verdes.

## Fase 2 — Subir o dev local (instância única)

Voz e federação exigem overrides de ambiente que estão versionados no `.env`; defina-os **na sessão do shell** (o `dotenv` não sobrescreve variáveis já presentes):

```powershell
$env:DOMAIN="a.test"
$env:PUBLIC_ORIGIN="http://127.0.0.1:3005"
$env:FEDERATION_ALLOW_PRIVATE_PEERS="true"
pnpm dev
```

- [ ] Servidor em `http://localhost:3005`; Vite em `http://localhost:5173`.
- [ ] `Invoke-RestMethod http://127.0.0.1:3005/api/health` → `{ status = 'ok'; timestamp = ... }`.
- [ ] `Invoke-RestMethod http://127.0.0.1:3005/api/instance/info` responde com versão e domínio.
- [ ] Log do servidor sem erros de boot (migrations aplicam na primeira execução).

**Aceite:** ambos os processos no ar, health `ok`, página `http://localhost:5173` carrega a tela de login/registro.

## Fase 3 — Smoke test: texto e plataforma

Dica: use **dois perfis de navegador** (janela normal + anônima/perfil 2) para simular dois usuários sem perder sessão.

| # | Cenário | Passos | Critério de aceite |
|---|---------|--------|--------------------|
| 3.1 | Registro + bootstrap admin | Registrar 1º usuário em `localhost:5173` | Conta criada e vira **admin** (painel de instância acessível) |
| 3.2 | Space + canais | Criar space; criar categoria e canal de texto | Space aparece na barra; canal abre |
| 3.3 | Mensagens | Enviar mensagem; editar; apagar; responder; reagir | Todas as ações refletem em tempo real no 2º perfil |
| 3.4 | Menções/typing | `@` autocomplete; ver "está digitando…" | Autocomplete e indicador funcionam |
| 3.5 | Não-lidas | Marcar canal/mensagem como não lido | Badge de não-lidas aparece/limpa |
| 3.6 | Uploads | Arrastar imagem; colar imagem; avatar/banner com crop | Upload ok, thumbnail gerada, arquivo servido |
| 3.7 | Embeds / GIF | Colar link YouTube + link genérico; busca de GIF | Embed renderiza; GIF insere (requer internet) |
| 3.8 | Permissões (RBAC) | Criar cargo; aplicar override de canal negando envio; logar 2º usuário com o cargo | 2º usuário **não** consegue enviar; admin consegue |
| 3.9 | DMs | 1:1 e grupo (até 10); mensagens e reações | DMs abrem e sincronizam |
| 3.10 | Amigos/presença | Pedido de amizade; aceitar; ver Online/Idle/DND e status custom | Presença muda em tempo real; status custom aparece |
| 3.11 | Descoberta | Buscar usuário; ver amigos/espaços em comum | Resultados corretos |
| 3.12 | Busca | `Ctrl/Cmd+K`, filtros `from:` `has:` `before:` `after:`; jump-to-message | Filtros e salto funcionam |
| 3.13 | Moderação | Banir com motivo; desconectar membro de voz (voz na Fase 4); aprovar pedido de entrada de space gated | Ações refletem; auditoria registrada |
| 3.14 | Admin | Painel: config de instância, gestão de usuários, storage, streaming, toggle de registro | Alterações persistem |
| 3.15 | Responsivo/PWA | DevTools → largura mobile; "Add to Home Screen" (Chrome) | Layout mobile (bottom nav), PWA instalável |
| 3.16 | Offline queue | Simular offline (DevTools) e enviar mensagem; voltar online | Mensagem envia ao reconectar |

**Aceite da fase:** todos os itens acima passam, ou cada exceção é registrada com evidência (screenshot/log) e classificação (bug de app / limitação de ambiente / rede).

## Fase 4 — Smoke test: voz/vídeo (LiveKit via Docker)

### 4.1 Subir o LiveKit

Criar `livekit.yaml` na raiz (config local mínima):

```yaml
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false
keys:
  devkey: devsecretdevsecretdevsecretdevsecret
logging:
  level: info
```

```powershell
docker run --rm `
  -p 7880:7880 `
  -p 7881:7881 `
  -p 50000-60000:50000-60000/udp `
  -v "${PWD}/livekit.yaml:/etc/livekit.yaml" `
  livekit/livekit-server:v1.9.11 --config /etc/livekit.yaml
```

Adicionar ao `.env` e **reiniciar o `pnpm dev`**:

```
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecretdevsecretdevsecretdevsecret
```

- [ ] `npx tsx packages/server/verify-livekit.ts` → "LIVEKIT VERIFICATION SUCCESS" (gera token, valida JWT, alcança o servidor via REST).

### 4.2 Cenários de voz

| # | Cenário | Passos | Critério de aceite |
|---|---------|--------|--------------------|
| 4.1 | Entrar em canal de voz | Dois perfis entram no mesmo canal de voz | Ambos aparecem como participantes; áudio flui |
| 4.2 | Mute/deafen | Alternar mute e deafen de cada lado | Estado propaga; áudio para/volta |
| 4.3 | Volume 0–200% | Ajustar volume do outro participante | Volume muda |
| 4.4 | Compartilhar tela | Iniciar screen share (resolução/fps/codec/bitrate) | Preview e tile ao vivo; badge de resolução/fps |
| 4.5 | Inspector de conexão | Abrir inspector | Bitrate/codec/ping/packet loss/jitter mostram valores |
| 4.6 | Restrição de voz | Admin aplica space-mute/deafen; mover/desconectar membro | Restrição persiste no reconnect; move/disconnect funcionam |
| 4.7 | Chamada de DM | Iniciar chamada em DM 1:1: tocar → aceitar | Ring, aceite e áudio; reject e end funcionam |

**Aceite da fase:** entradas de voz e chamada de DM funcionam com dois clientes; itens de WebRTC que dependem de rede (UDP, hairpin) registrados com a evidência do inspector.

## Fase 5 — Smoke test: federação local (duas instâncias)

Objetivo: dois servidores em loopback, peering ativo, amizade e DM cross-instance a partir de um único cliente web.

### 5.1 Subir a segunda instância (B) na mesma máquina

A (home) já roda em `:3005` com `PUBLIC_ORIGIN=http://127.0.0.1:3005` (Fase 2). Subir B em outro terminal, **sem** o script `dev` (que força `PORT=3005`), com env próprio:

```powershell
New-Item -ItemType Directory -Force -Path data-b\uploads | Out-Null
$env:PORT="3006"
$env:DOMAIN="b.test"
$env:PUBLIC_ORIGIN="http://127.0.0.1:3006"
$env:DB_PATH="$PWD\data-b\backspace.db"
$env:UPLOAD_DIR="$PWD\data-b\uploads"
$env:JWT_SECRET="<outra string de 32+ chars>"
$env:FEDERATION_ALLOW_PRIVATE_PEERS="true"
$env:REGISTRATION_OPEN="true"
pnpm --filter @backspace/server start
```

- [ ] `Invoke-RestMethod http://127.0.0.1:3006/api/instance/info` responde; health `ok`.
- [ ] Registrar um usuário em B diretamente (abrir a web)? **Não** — B não tem UI própria aqui; o cadastro em B será feito pelo fluxo de conta federada do cliente (5.3) ou pela API. Para o teste S2S puro (5.2), cadastre o usuário B via `POST /api/auth/register` (curl/Invoke-RestMethod) usando o `DOMAIN=b.test`.

### 5.2 Peering (S2S)

- [ ] No painel admin de A: **Settings → Connections/Federation**, adicionar peer com origem `http://127.0.0.1:3006`.
- [ ] Em B, aprovar o pedido (ou ligar auto-accept nas configurações de instância de B para simplificar).
- [ ] Confirmar em ambas as telas que o peer aparece **ativo** (`GET /api/federation/peers` retorna status ativo).

### 5.3 Cenários de federação

| # | Cenário | Passos | Critério de aceite |
|---|---------|--------|--------------------|
| 5.1 | Peering ativo | Ver acima | Peer `active` nos dois lados |
| 5.2 | Amizade cross-instance (S2S) | Em A, adicionar amigo por handle `bob@b.test` | Pedido chega; aceito; amizade refletida em A |
| 5.3 | DM cross-instance (S2S) | Abrir DM com `bob@b.test` e enviar mensagens/reagir | Mensagens entregues ao usuário de B (S2S relay) |
| 5.4 | Presença/atividades cross-instance | B fica online/offline | Presença de B reflete em A |
| 5.5 | Conta federada + espaço remoto (client federation) | Em A, **Connections → Add instance** `http://127.0.0.1:3006`; entrar num space de B | Conta federada criada (`usuario@a.test`); space remoto acessível |
| 5.6 | Chamada federada (opcional) | Com voz ativa (Fase 4), iniciar DM call cross-instance | Ring e áudio via LiveKit do host |

Observações:
- O caminho S2S (5.2/5.3) é o mais simples e é fortemente coberto pelos testes automatizados (`test:federation-e2e`); use o smoke manual como sanidade.
- Se a criação da conta federada pelo cliente (5.5) apresentar atrito, consulte `docs/systems/client-federation.md` (fluxo `connectToRemote`, per-remote credentials) e `docs/systems/federation.md`. O harness `packages/server/test/helpers/twoInstanceHarness.ts` é a referência "known-good" da fiação de env entre instâncias.
- `FEDERATION_ALLOW_PRIVATE_PEERS=true` é necessário para origens assertadas em loopback; o peering **admin-driven** funciona mesmo sem o flag.

**Aceite da fase:** peer ativo, amizade e DM cross-instance funcionam; conta federada loginável é criada quando 5.5 é exercitado.

## Fase 6 — Verificação de build de produção (local)

```powershell
pnpm build   # shared → server → web
```

- [ ] Build sem erro. O servidor serve o cliente em `packages/web/dist`.
- [ ] Subir o servidor em modo produção local: `pnpm --filter @backspace/server start` **sem** `PORT` de dev (usa `PORT` do `.env`/ambiente, ex. 3000), acessar `http://localhost:3000` e repetir um subconjunto rápido da Fase 3 + entrar num canal de voz (a CSP de produção inclui `connect-src` para `LIVEKIT_URL`, então `ws://localhost:7880` passa).
- [ ] **Aceite:** app carrega servido pelo backend; login e voz funcionam em modo build.

## Log de evidências (preencher durante a execução)

| Fase | Item | Comando/Passos | Resultado (PASS/FAIL) | Evidência (log/screenshot) | Notas |
|------|------|----------------|-----------------------|----------------------------|-------|
| 0 | Setup | `pnpm install` etc. | | | |
| 1 | typecheck/lint/test | | | | |
| 2 | Boot dev + health | | | | |
| 3 | Texto/plataforma (3.1–3.16) | | | | |
| 4 | Voz (4.1–4.7) | | | | |
| 5 | Federação (5.1–5.6) | | | | |
| 6 | Build prod | | | | |

## Riscos e mitigações

- **Módulos nativos no Windows (`better-sqlite3`, `sharp`).** `better-sqlite3` 13.x traz binários pré-compilados dentro do pacote (por isso está em `pnpm.ignoredBuiltDependencies`); `sharp` compila no install. Se o servidor falhar ao carregar `better_sqlite3.node`, rodar `pnpm approve-builds` / ajustar `onlyBuiltDependencies` no `package.json` raiz e reinstalar. `uiohook-napi` não recompilado é esperado (só afeta o desktop).
- **Portas ocupadas** (`3005/3006/5173/7880`). Liberar ou trocar `PORT`/`APP_PORT`. O harness de testes aloca portas efêmeras — não conflita com o dev.
- **Voz/WebRTC no Windows.** UDP `50000-60000` e `7881/tcp` precisam passar pelo Docker Desktop; `use_external_ip: false` evita o LiveKit anunciar IP externo. Se o navegador não conectar, conferir o inspector e a `verify-livekit.ts`.
- **Federação em loopback.** Sem `FEDERATION_ALLOW_PRIVATE_PEERS=true`, origens assertadas privadas são rejeitadas; use peering admin-driven como alternativa. `PUBLIC_ORIGIN` é obrigatório para que cada instância anuncie uma origem de transporte alcançável (`http://127.0.0.1:<porta>`).
- **Suíte pesada.** Os testes de federação sobem várias instâncias `tsx` (timeouts de 90–180s). Em run completo lento, rodar por pacote.
- **Funcionalidades dependentes de internet** (embeds, GIF Klipy) podem falhar por rede — classificar como limitação de ambiente, não bug.
- **`pnpm test` inclui pacotes fora do escopo** (`desktop`, `scripts/*`). Falhas ali não bloqueiam o objetivo; registrar separadamente.

## Fora de escopo

- Build do app **desktop** (Electron) no Windows (exige toolchain C++ e não é alvo do smoke).
- **Deploy de produção** real (Docker Compose + Caddy + HTTPS + portas públicas) — ver `docs/systems/deployment.md`.
- Testes em **dispositivos móveis físicos** (só responsivo via DevTools + PWA no desktop).
- **Playwright/E2E automatizado novo**: o `packages/web/package.json` referencia `e2e/identity-deletion.spec.ts`, mas não há config/spec no repo — não será criado aqui.
- Correções de código de produto. Itens FAIL viram tarefas para um agente de implementação.

## Handoff

Este plano é **somente execução/validação** (comandos, cenários e critérios). Para corrigir qualquer FAIL encontrado, mudar para um agente com permissão de edição de código-fonte, que deve seguir `CLAUDE.md` e os specs em `docs/systems/`.
