import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  it('requires configured JWT secrets in production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'JWT_SECRET must be configured in production.',
    );
  });

  it('rejects short and known weak secrets', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'secret-key',
        JWT_REFRESH_SECRET: 'another secret that is at least 32 bytes long',
      }),
    ).toThrow(
      'JWT_SECRET must be a non-placeholder secret of at least 32 bytes.',
    );
  });

  it('rejects identical access and refresh secrets', () => {
    const sharedSecret = 'a sufficiently long shared secret for jwt signing';
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: sharedSecret,
        JWT_REFRESH_SECRET: sharedSecret,
      }),
    ).toThrow('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  });

  it('accepts distinct strong production secrets', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: 'access secret with enough entropy bytes 001',
      JWT_REFRESH_SECRET: 'refresh secret with enough entropy bytes 002',
    });

    expect(environment.JWT_SECRET).toBe(
      'access secret with enough entropy bytes 001',
    );
    expect(environment.JWT_REFRESH_SECRET).toBe(
      'refresh secret with enough entropy bytes 002',
    );
  });

  it('generates ephemeral, distinct secrets in non-production when omitted', () => {
    const environment = validateEnvironment({ NODE_ENV: 'development' });
    const accessSecret = environment.JWT_SECRET as string;
    const refreshSecret = environment.JWT_REFRESH_SECRET as string;

    expect(Buffer.byteLength(accessSecret, 'utf8')).toBeGreaterThanOrEqual(32);
    expect(Buffer.byteLength(refreshSecret, 'utf8')).toBeGreaterThanOrEqual(32);
    expect(accessSecret).not.toBe(refreshSecret);
  });
});
