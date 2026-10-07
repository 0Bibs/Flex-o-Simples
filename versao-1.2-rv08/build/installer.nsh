; Pasta padrao de instalacao: padrao de trabalho do escritorio.
; $DESKTOP acompanha a Area de Trabalho do usuario (inclusive no OneDrive).
!macro preInit
  SetRegView 64
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$DESKTOP\PADRÃO DE TRABALHO\Ferramentas Padronizadas\CONCRETO ARMADO\Flexão Simples"
  SetRegView 32
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$DESKTOP\PADRÃO DE TRABALHO\Ferramentas Padronizadas\CONCRETO ARMADO\Flexão Simples"
!macroend
