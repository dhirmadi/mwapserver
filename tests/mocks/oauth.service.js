// Test shim for CJS require path used by integration tests
// Provide vi.fn when available so tests can spy/mutate behavior via CJS require
const maybeVi = (globalThis && globalThis.vi) ? globalThis.vi : undefined;

export class OAuthService {
  constructor() {
    // no-op
  }
}

const defaultExchange = async function(_code, _provider, _redirectUri, _codeVerifier) {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    scopesGranted: []
  };
};

const defaultRefresh = async function(_refreshToken, _provider) {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    scopesGranted: []
  };
};

OAuthService.prototype.exchangeCodeForTokens = maybeVi ? maybeVi.fn(defaultExchange) : defaultExchange;
OAuthService.prototype.refreshTokens = maybeVi ? maybeVi.fn(defaultRefresh) : defaultRefresh;


