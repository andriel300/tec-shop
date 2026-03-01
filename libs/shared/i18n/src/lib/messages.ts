type Messages = Record<string, unknown>;

const sharedMessages: Record<string, Messages> = {
  en: {
    Common: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      logout: 'Logout',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      noResults: 'No results found',
      error: 'Error',
    },
    LanguageSwitcher: {
      changeLanguage: 'Change language',
      english: 'English',
      portuguese: 'Portuguese (BR)',
    },
  },
  'pt-BR': {
    Common: {
      signIn: 'Entrar',
      signUp: 'Cadastrar',
      logout: 'Sair',
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      search: 'Buscar',
      noResults: 'Nenhum resultado encontrado',
      error: 'Erro',
    },
    LanguageSwitcher: {
      changeLanguage: 'Alterar idioma',
      english: 'Ingles',
      portuguese: 'Portugues (BR)',
    },
  },
};

export function getSharedMessages(locale: string): Messages {
  return sharedMessages[locale] ?? sharedMessages['en'];
}

export function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = result[key];
    const overrideVal = override[key];
    if (
      key in result &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      typeof overrideVal === 'object' &&
      overrideVal !== null
    ) {
      result[key] = mergeMessages(baseVal as Messages, overrideVal as Messages);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}
