import { loadConfig } from '../../src/config/env';

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      CORS_ORIGIN: ['http://localhost:5173'],
      LOG_LEVEL: 'info',
      RATE_LIMIT_MAX: 300,
    });
  });

  it('parses a comma-separated list of CORS origins', () => {
    expect(
      loadConfig({ CORS_ORIGIN: 'https://a.example, https://b.example,' }).CORS_ORIGIN,
    ).toEqual(['https://a.example', 'https://b.example']);
  });

  it('fails fast with a readable message for invalid values', () => {
    expect(() => loadConfig({ PORT: 'eighty', NODE_ENV: 'staging' })).toThrow(
      /Invalid environment configuration: NODE_ENV: .*PORT: /,
    );
  });
});
