export const UI_TEXT = {
  // Navegação
  nav: {
    playlists: "Playlists",
    channels: "Canais",
    configPlaylists: "Configurar Playlists",
    configChannels: "Configurar Canais",
    quota: "Quota",
    logout: "Sair",
    autoCloseMenu: "Fechar menu automaticamente",
  },

  // Playlists
  playlists: {
    title: "Gerenciar Playlists",
    sourcePlaylist: "Playlist de Origem",
    destinationPlaylist: "Playlist de Destino",
    selectPlaylist: "Selecione uma playlist",
    loadVideos: "Carregar Vídeos",
    transferVideos: "Transferir Vídeos",
    removeFromSource: "Excluir da origem",
    noVideos: "Nenhum vídeo encontrado",
    loadingVideos: "Carregando vídeos...",
    loadingPlaylists: "Carregando playlists...",
  },

  // Canais
  channels: {
    title: "Gerenciar Canais",
    selectChannel: "Selecione um canal",
    destinationPlaylist: "Playlist de Destino",
    assignToPlaylist: "Atribuir à Playlist",
    noVideos: "Nenhum vídeo encontrado",
    loadingVideos: "Carregando vídeos...",
    loadingChannels: "Carregando canais...",
  },

  // Filtros
  filters: {
    title: "Filtros",
    search: "Buscar...",
    searchInTitle: "Título",
    searchInDescription: "Descrição",
    searchInChannel: "Canal",
    language: "Idioma",
    allLanguages: "Todos os idiomas",
    duration: "Duração",
    durationMin: "Mínima (segundos)",
    durationMax: "Máxima (segundos)",
    views: "Visualizações",
    viewsMin: "Mínimas",
    viewsMax: "Máximas",
    reset: "Resetar Filtros",
    selectAll: "Selecionar Todos",
    deselectAll: "Desmarcar Todos",
  },

  // Presets
  presets: {
    duration: {
      all: "Todos",
      shorts: "Shorts",
      short: "Curtos",
      medium: "Médios",
      long: "Longos",
    },
    views: {
      all: "Todas",
      low: "Baixas",
      medium: "Médias",
      high: "Altas",
      viral: "Virais",
    },
  },

  // Estatísticas
  stats: {
    total: "Total",
    filtered: "Filtrados",
    selected: "Selecionados",
    duration: "Duração",
    selectedDuration: "Duração selecionada",
  },

  // Visualização
  viewMode: {
    grid: "Grade",
    list: "Lista",
    table: "Tabela",
  },

  // Colunas da tabela
  columns: {
    select: "Selecionar",
    thumbnail: "Miniatura",
    title: "Título",
    channel: "Canal",
    duration: "Duração",
    views: "Visualizações",
    published: "Publicado",
    added: "Adicionado",
    language: "Idioma",
  },

  // Quota
  quota: {
    title: "Status de Quota",
    subtitle: "Gerenciamento de quota da API do YouTube",
    used: "Utilizada",
    remaining: "Restante",
    limit: "Limite diário",
    history: "Histórico",
    historySubtitle: "Consumo dos últimos 7 dias",
    costs: "Custos por Operação",
    costsSubtitle: "Quanto custa cada operação",
    warning: "Atenção: Quota em {percent}%",
    exceeded: "Limite diário de quota atingido. Tente novamente amanhã.",
    units: "unidades",
  },

  // Configurações
  config: {
    playlistsTitle: "Configuração de Playlists",
    playlistsSubtitle: "Ative ou desative playlists para exibição",
    channelsTitle: "Configuração de Canais",
    channelsSubtitle: "Ative ou desative canais para exibição",
    enableAll: "Ativar Todos",
    disableAll: "Desativar Todos",
    videos: "vídeos",
    enabled: "Ativada",
    disabled: "Desativada",
    showOnlyActive: "Apenas Ativas",
    saving: "Salvando...",
    saved: "Salvo!",
  },

  // Mensagens
  messages: {
    transferSuccess: "Transferidos {count} vídeos com sucesso!",
    transferPartial: "Transferidos {success} vídeos. {errors} erros.",
    transferError: "Erro ao transferir vídeos.",
    assignSuccess: "Atribuídos {count} vídeos com sucesso!",
    assignPartial: "Atribuídos {success} vídeos. {errors} erros.",
    assignError: "Erro ao atribuir vídeos.",
    loadError: "Erro ao carregar dados.",
    quotaExceeded: "Quota diária excedida.",
    quotaWarning: "Quota está em {percent}%. Use com moderação.",
    noSelection: "Selecione pelo menos um vídeo.",
    noDestination: "Selecione uma playlist de destino.",
    samePlaylist: "A playlist de origem e destino são iguais.",
  },

  // Autenticação
  auth: {
    login: "Entrar",
    loginWithGoogle: "Entrar com Google",
    logout: "Sair",
    welcome: "Bem-vindo(a)!",
    loginTitle: "YT Playlist Manager Pro",
    loginSubtitle: "Gerencie suas playlists do YouTube de forma profissional",
    loginDescription:
      "Organize seus vídeos, transfira entre playlists e monitore seu uso da API do YouTube.",
  },

  // Geral
  general: {
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Salvar",
    close: "Fechar",
    back: "Voltar",
    next: "Próximo",
    refresh: "Atualizar",
  },

  // Transferência
  transfer: {
    title: "Transferir Vídeos",
    description: "Você está prestes a transferir {count} vídeo(s).",
    quotaCost: "Custo em quota: {cost} unidades",
    quotaRemaining: "Quota restante: {remaining} unidades",
    quotaInsufficient: "Quota insuficiente para esta operação.",
    confirm: "Confirmar Transferência",
    inProgress: "Transferindo...",
    success: "Transferência concluída!",
    error: "Erro na transferência",
  },

  // Atribuição
  assign: {
    title: "Atribuir à Playlist",
    description: "Você está prestes a adicionar {count} vídeo(s) à playlist.",
    quotaCost: "Custo em quota: {cost} unidades",
    quotaRemaining: "Quota restante: {remaining} unidades",
    quotaInsufficient: "Quota insuficiente para esta operação.",
    confirm: "Confirmar Atribuição",
    inProgress: "Atribuindo...",
    success: "Atribuição concluída!",
    error: "Erro na atribuição",
  },
};

// Função helper para substituir placeholders
export function t(
  text: string,
  params?: Record<string, string | number>
): string {
  if (!params) return text;

  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
