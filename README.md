# Portaria Primavera v1.0

PWA para controle de acessos, moradores e operação da portaria do Condomínio Edifício Primavera.

## Arquivos principais

- `index.html` — aplicativo completo
- `manifest.webmanifest` — manifesto PWA para instalação no Windows/Android
- `sw.js` — Service Worker para cache/offline
- `assets/icons/` — ícones do app
- `assets/screenshots/` — screenshots para instalação

## Publicação no GitHub Pages

1. Suba todos os arquivos deste pacote para um repositório.
2. Em **Settings → Pages**, selecione a branch principal e a pasta `/root`.
3. Aguarde o endereço `https://usuario.github.io/repositorio/` ficar disponível.
4. Abra no Chrome/Edge e use **Instalar aplicativo**.

## Atualização depois de publicar

Após enviar uma nova versão, use `Ctrl + F5` no navegador. Se o app instalado mantiver cache antigo, desinstale e instale novamente.

## Versão

Base: `portaria_primavera_pwa_v105_tour_guiado.html`

## Observação

O backup local e os dados gravados no navegador continuam usando `localStorage`. O Service Worker apenas permite carregamento mais rápido/offline do aplicativo.
