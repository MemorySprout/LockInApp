let sessionExpiredHandler: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
  sessionExpiredHandler = handler;
};

export const notifySessionExpired = () => {
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  }
};
