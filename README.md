# PulseBoard

Dashboard premium de tarefas e agenda, com pipeline, calendário e organização por status.

## Visão geral

Este projeto foi criado para funcionar como uma plataforma visual de acompanhamento de atividades, com foco em produtividade, organização e apresentação profissional.

## Funcionalidades

- Pipeline por etapas
- Calendário mensal
- Criação de tarefas
- Busca por atividades
- Resumo executivo
- Persistência local no navegador
- Assistente ChatGPT para perguntas sobre as tarefas

## Integração ChatGPT (OpenAI API)

O assistente usa a API da OpenAI por um servidor Node.js. A chave fica no backend, em um arquivo `.env` ignorado pelo Git — nunca no JavaScript do navegador ou no repositório.

### Pré-requisitos

- Node.js 20 ou superior e npm
- Uma chave da API da OpenAI com acesso habilitado e faturamento/limites configurados na plataforma da OpenAI

> A assinatura do ChatGPT e o uso da API são serviços e cobranças separados. A chave da API é criada na plataforma da OpenAI; não compartilhe essa chave no chat, em commits ou em capturas de tela.

### Configuração local no Windows PowerShell

1. Abra o terminal na pasta deste projeto.
2. Instale as dependências: `npm install`.
3. Copie `.env.example` para `.env`.
4. Abra `.env` e substitua o valor de `OPENAI_API_KEY` pela chave da API. O modelo padrão é `gpt-4.1-mini`; pode ser alterado em `OPENAI_MODEL` se estiver disponível na conta.
5. Inicie com `npm start` e abra `http://localhost:3000`.

O painel exibe o estado de configuração. Sem uma chave válida, o chat entra em **modo demonstração** e gera uma resposta simulada localmente, usando as tarefas do navegador. Esse modo serve para demonstrar a interface e o fluxo, mas não consulta o ChatGPT.

### GitHub e demonstração

O código de exemplo da integração pode ficar no repositório GitHub; a chave secreta, não. Em hospedagem estática como GitHub Pages, não há backend Node para guardar a chave: o assistente funciona em modo demonstração e identifica as respostas como simuladas. Para respostas reais, hospede `server.js` em um serviço de backend, configure `OPENAI_API_KEY` nos secrets/variáveis privadas desse serviço e conecte o frontend ao endpoint HTTPS publicado. Não publique a chave em GitHub Actions logs, no HTML, no JavaScript do browser ou em commits.

### Uso e privacidade

- O chat envia sua pergunta e o contexto das tarefas do PulseBoard para a API configurada.
- O histórico da conversa fica apenas na memória da página atual; não é persistido pelo app.
- O backend limita tamanho das mensagens, histórico e frequência de solicitações.
- A IA não altera tarefas, não executa comandos Git e não publica commits.
- Não envie dados confidenciais, tokens, senhas ou informações pessoais que não sejam necessárias.
- Se uma chave for exposta, revogue-a e crie outra; removê-la do arquivo não invalida uma chave vazada.

### Publicação

Para publicar o app, hospede o backend e o frontend em um serviço seguro, defina `OPENAI_API_KEY` como secret/environment variable no provedor e configure HTTPS, autenticação, limites de uso e monitoramento. Não coloque a chave no frontend nem em variáveis `VITE_*` ou equivalentes expostas ao browser.

## Como abrir

1. Abra a pasta do projeto.
2. Execute o arquivo `index.html` no navegador ou use um servidor local.
3. Também é possível abrir a apresentação em `github-presentation.html`.

## Apresentação sobre GitHub

A página `github-presentation.html` foi criada para apresentar o valor do GitHub em projetos digitais, mostrando versionamento, colaboração, organização e publicação.

## Estrutura

- `index.html` — dashboard principal
- `app.js` — lógica da aplicação
- `styles.css` — visual premium
- `server.js` — API backend segura para o assistente ChatGPT
- `.env.example` — modelo de variáveis locais sem credenciais
- `github-presentation.html` — apresentação do projeto e do GitHub
- `manifest.json` — configuração PWA

## Status

Projeto em evolução para versionamento, compartilhamento e publicação profissional.
