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

## Apresentação GitHub + IA

A página `github-presentation.html` é um material estático para a aula. Ela explica conceitos de GitHub, uso de IA no desenvolvimento, branches, pull requests, segurança e como uma integração de API pode ser arquitetada.

**Este projeto não contém uma integração funcional com ChatGPT nem respostas simuladas de IA.** A explicação da API é apenas conceitual; não é necessário criar chave, conta de API ou configurar backend para apresentar a aula.

## Como abrir

1. Abra a pasta do projeto.
2. Execute `index.html` no navegador ou sirva a pasta com qualquer servidor estático local.
3. Abra `github-presentation.html` para a apresentação da aula.

## Apresentação sobre GitHub

A página `github-presentation.html` é a apresentação premium sobre Git, GitHub, trabalho em equipe e IA. Ela pode ser publicada sozinha como página inicial do GitHub Pages pelo workflow `.github/workflows/publish-presentation.yml`.

### Colocar a apresentação online

1. Crie um repositório GitHub e conecte esta pasta local com `git remote add origin URL_DO_REPOSITORIO`.
2. Envie a branch `main` ou `master` para o GitHub.
3. Nas configurações do repositório, em **Settings → Pages**, selecione **GitHub Actions** como origem.
4. Aguarde a execução de **Publish GitHub + IA presentation** na aba **Actions**.
5. A página publicada ficará em `https://USUARIO.github.io/REPOSITORIO/` (ou `https://USUARIO.github.io/` para um repositório de usuário chamado `USUARIO.github.io`).

O workflow já prepara `github-presentation.html` como `index.html` e publica apenas essa apresentação. Este workspace ainda não possui um remoto GitHub configurado; por isso, é necessário conectar o repositório e fazer o primeiro push para disponibilizar um endereço público.

## Estrutura

- `index.html` — dashboard principal
- `app.js` — lógica da aplicação
- `styles.css` — visual premium
- `github-presentation.html` — apresentação do projeto e do GitHub
- `manifest.json` — configuração PWA

## Status

Projeto em evolução para versionamento, compartilhamento e publicação profissional.
