# Portaria Primavera

PWA operacional do Condomínio Edifício Primavera para controle de portaria, moradores, visitantes, prestadores e rotinas administrativas.

## Versão atual

**v150 — baseline estável pós-Autenticação 2.0**

Estado validado em 03/09/2026:

- splash e abertura do PWA funcionando normalmente;
- login local estável;
- recuperação de senha por e-mail via Supabase Auth;
- redefinição de senha dentro do próprio Portaria;
- contador regressivo para novas solicitações de recuperação;
- preservação das credenciais locais durante a sincronização;
- GitHub Pages publicado no escopo `/Portaria/`;
- biometria/passkeys não fazem parte desta baseline e ficam adiadas para um ciclo futuro isolado.

## Arquivos principais

- `index.html` — aplicativo principal;
- `sw.js` — Service Worker estável do PWA;
- `manifest.webmanifest` — configuração de instalação;
- `recuperar-admin.html` — recuperação administrativa de emergência;
- `assets/icons/` — ícones do PWA;
- `assets/screenshots/` — screenshots do projeto;
- `backups/` — versões preservadas antes de alterações relevantes.

## Publicação

Projeto publicado pelo GitHub Pages no escopo:

`/Portaria/`

Após uma atualização de produção, feche e abra novamente o PWA para carregar a versão publicada mais recente.

## Autenticação 2.0

A versão atual mantém o login tradicional e adiciona recuperação segura por e-mail. O e-mail precisa estar previamente vinculado e validado no Supabase Auth para que a redefinição funcione.

Passkeys/biometria foram testadas em ciclo separado, mas retiradas desta baseline após afetarem a inicialização do PWA. Qualquer retomada futura deve ser feita primeiro em ambiente isolado, sem alterar o caminho crítico do splash/login.

## Perfis iniciais

Os usuários e permissões devem ser administrados dentro do próprio Portaria em **Ferramentas → Usuários e perfis**.

## Regra de manutenção

Antes de qualquer alteração relevante no `index.html`, `sw.js` ou autenticação, preservar uma cópia em `backups/`. Mudanças de autenticação, service worker e splash devem ser feitas em ciclos pequenos e validados separadamente.
