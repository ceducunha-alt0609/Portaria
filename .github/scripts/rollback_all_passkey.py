from pathlib import Path
src=Path('backups/index_pre_passkey_cycle1_2026-09-03.html')
dst=Path('index.html')
if not src.exists(): raise SystemExit('backup pre-passkey ausente')
current=dst.read_text(encoding='utf-8')
Path('backups/index_passkey_problematico_final_2026-09-03.html').write_text(current,encoding='utf-8')
restored=src.read_text(encoding='utf-8')
for required in ['passwordRecoveryModal','recoveryContinueBtn','requestPasswordRecovery','authRecoveryEnabled']:
    if required not in restored: raise SystemExit('backup sem Auth 2.0: '+required)
for forbidden in ['loginPasskeyBtn','portariaCompletePasskeyLogin','registerPasskey()','uPasskeyBox']:
    if forbidden in restored: raise SystemExit('backup ainda contem passkey: '+forbidden)
dst.write_text(restored,encoding='utf-8')
