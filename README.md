# Portaria Primavera

PWA para controle de portaria do **Condomínio Edifício Primavera**.

## Recursos principais

- Controle de entrada e saída de visitantes/prestadores.
- Painel Resumo com alertas operacionais.
- Cadastro de moradores, veículos e contatos administrativos.
- Agenda operacional de salão e mudanças.
- Identificação do condomínio, emergências e prestadores/contratos.
- Relatórios operacionais com impressão/PDF pelo navegador.
- Logs/auditoria em acordeão.
- Perfis Admin e Portaria.
- Modo Kiosk.
- Temas Claro, Escuro e Automático.
- Backup local imediato e backup diário em nuvem/Supabase às 02:00.
- Tour guiado e botão flutuante de ajuda.

## Arquivos

```text
index.html
manifest.webmanifest
sw.js
favicon.png
assets/
  icons/
  screenshots/
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste pacote para a raiz do repositório.
3. Acesse **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/root`.
6. Aguarde o link do GitHub Pages ser gerado.

## Como instalar como PWA

No Chrome/Edge:

1. Abra o link publicado.
2. Clique no ícone de instalação na barra do navegador.
3. Instale como aplicativo.
4. Abra pelo atalho criado.

## Acessos iniciais

> Altere as senhas antes do uso em produção.

- Admin: `admin` / `admin123`
- Portaria: `portaria` / `1234`

## Observações de segurança

- O app usa armazenamento local do navegador para operação offline.
- O backup em nuvem depende das chaves/configurações Supabase já inseridas no HTML.
- Recomenda-se manter cópias de segurança antes de importar planilhas ou trocar versões.

## Próximas evoluções sugeridas para v1.1

- Consulta por placa na Busca Global.
- Autorizados permanentes por unidade.
- Contatos de emergência por morador/unidade.
- Data de nascimento, idade e grupo etário.
- Relatório de aniversariantes do mês.

## Versão

**v1.0 — Homologada para testes operacionais da portaria.**
