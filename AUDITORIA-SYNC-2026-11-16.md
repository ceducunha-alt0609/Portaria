# Auditoria de sincronização por alterações — 16/11/2026

Ramificação experimental. NÃO publicada na versão principal.

- Backup integral da branch main em backup-portaria-2026-11-16-pre-otimizacao-sync.
- Marca pendente limpa apenas após confirmação de envio e somente se não houve edição durante a requisição.
- Erro 402 pausa consultas de sincronização por 1 hora, preservando os dados locais.
- Backup diário só envia novamente se o estado mudou desde o último backup diário concluído.
- Polling de 30 segundos já estava desativado no código original; nenhuma nova consulta periódica foi adicionada.

Limites: nenhuma migração para sincronização incremental ainda; snapshots inteiros continuam no fluxo. Testes de sincronização entre equipamentos pendentes por cota excedida.

## Descoberta histórica (16/11)
- Setembro: implementação multi-dispositivo já utilizava snapshots e consultas periódicas.
- Em 15/11 às 20:57 UTC, o commit `74f0a290fc9e` removeu `setInterval(...,30000)` e desativou o websocket do núcleo; ocorreu após registros de erro 402 no mesmo dia.
- Sync Guard lê até 12 snapshots completos por consulta, além do mais recente do Admin: com ~120 KB por snapshot recente, cada leitura pode transferir ~1,5 MB.
- A versão experimental muda o Sync Guard para consultar primeiro apenas IDs e buscar os dados completos só quando a lista de snapshots ou o ID do Admin mudar.
- A versão principal continua intacta; sem teste real de sincronização devido à cota.
- IMPORTANTE: o bloqueio de publicação em tela mobile no Sync Guard precisa de revisão específica, pois a operação de saída pelo celular deve continuar autorizada, sem permitir criar novas entradas.
