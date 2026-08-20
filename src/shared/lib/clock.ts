let serverMinusClientOffsetMs = 0;

export const syncClock = (serverNowIso: string): void => {
  serverMinusClientOffsetMs = Date.parse(serverNowIso) - Date.now();
};

export const now = (): number => Date.now() + serverMinusClientOffsetMs;
