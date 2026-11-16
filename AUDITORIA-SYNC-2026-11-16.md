# Auditoria de sincronização por alterações — 16/11/2026

Ramificação experimental. NÃO publicada na versão principal.

- Backup integral da branch main em backup-portaria-2026-11-16-pre-otimizacao-sync.
- Marca pendente limpa apenas após confirmação de envio e somente se não houve edição durante a requisição.
- Erro 402 pausa consultas de sincronização por 1 hora, preservando os dados locais.
- Backup diário só envia novamente se o estado mudou desde o último backup diário concluído.
- Polling de 30 segundos já estava desativado no código original; nenhuma nova consulta periódica foi adicionada.

Limites: nenhuma migração para sincronização incremental ainda; snapshots inteiros continuam no fluxo. Testes de sincronização entre equipamentos pendentes por cota excedida.
