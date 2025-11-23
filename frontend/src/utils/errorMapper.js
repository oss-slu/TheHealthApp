const STATUS_KEY_MAP = {
  400: 'errors.badRequest',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  422: 'errors.validation',
  429: 'errors.rateLimited',
  500: 'errors.server',
  502: 'errors.server',
  503: 'errors.server',
  504: 'errors.server',
};

const messageIncludes = (message, search) =>
  typeof message === 'string' && message.toLowerCase().includes(search.toLowerCase());

export const mapApiError = (error) => {
  if (!error.response) {
    return {
      messageKey: 'errors.network',
      message: 'Network error. Check your connection.',
    };
  }

  const { status, data } = error.response;
  const errorDetail = data?.error ?? {};
  const backendMessage = errorDetail.message || error.message;

  if (status === 401 && messageIncludes(backendMessage, 'incorrect username or password')) {
    return {
      messageKey: 'errors.invalidCredentials',
      message: backendMessage,
      status,
    };
  }

  if (status === 409 && messageIncludes(backendMessage, 'username already exists')) {
    return {
      messageKey: 'errors.usernameExists',
      message: backendMessage,
      status,
    };
  }

  if (status === 409 && messageIncludes(backendMessage, 'phone number is already in use')) {
    return {
      messageKey: 'errors.phoneExists',
      message: backendMessage,
      status,
    };
  }

  const messageKey = STATUS_KEY_MAP[status] || errorDetail.code || 'errors.generic';

  return {
    messageKey,
    message: backendMessage,
    status,
    details: errorDetail.details,
  };
};
