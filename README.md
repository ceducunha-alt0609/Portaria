# Portaria Primavera

PWA de controle de portaria, moradores e operação da guarita do Condomínio Primavera.

## Versão

**v1.0.1 — pacote GitHub corrigido**

Correção aplicada: o pacote anterior podia ficar preso na tela de splash por causa de um erro de script no `index.html` gerado para o GitHub. Esta versão usa o HTML íntegro da v105 e atualiza o cache do Service Worker.

## Arquivos principais

- `index.html` — aplicativo completo
- `sw.js` — Service Worker com cache PWA
- `manifest.webmanifest` — instalação como PWA
- `assets/icons/` — ícones do app
- `assets/screenshots/` — espaço para screenshots do GitHub/PWA

## Como publicar no GitHub Pages

1. Envie todos os arquivos para o repositório.
2. Em **Settings → Pages**, selecione a branch principal e a pasta raiz.
3. Aguarde a publicação.
4. Abra a URL publicada e use **Ctrl + F5** na primeira abertura após atualizar.

## Observação sobre atualização do PWA instalado

Se já instalou a versão anterior e ela ficou presa no splash:

1. Feche o app instalado.
2. No navegador, abra a URL do GitHub Pages.
3. Pressione **Ctrl + F5**.
4. Se ainda carregar a versão antiga, desinstale o PWA antigo e instale novamente.

## Uso

Perfis iniciais:

- Admin: `admin / admin123`
- Portaria: `portaria / 1234`

Depois, ajuste os usuários em **Ferramentas → Usuários e perfis**.
