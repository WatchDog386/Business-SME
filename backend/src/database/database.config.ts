import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Stops the API from starting in production on anything but the server's own PostgreSQL. */
function assertServerDatabase(config: ConfigService, isPostgres: boolean): void {
  if (!isPostgres) {
    throw new Error("DB_DRIVER must be 'postgres' in production: the API only uses the server's own database.");
  }
  const rawUrl = config.get<string>('database.url');
  let host = config.get<string>('database.host') ?? '';
  if (rawUrl) {
    try {
      host = new URL(rawUrl).hostname;
    } catch {
      host = '';
    }
  }
  // A path means a local unix socket
  if (!LOCAL_HOSTS.has(host.toLowerCase()) && !host.startsWith('/')) {
    throw new Error(
      `The database host "${host}" is not this server. In production the API only uses the PostgreSQL ` +
        'on the server itself: clear DATABASE_URL and set DB_HOST=127.0.0.1 in the environment file.',
    );
  }
}

export function dataSourceOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const driver = config.get<string>('database.driver');
  const isPostgres = driver === 'postgres';

  // Live data lives in one place only: the PostgreSQL on the server itself.
  // A leftover connection string to a hosted database, or the file database
  // used for quick local trials, would quietly split the records in two.
  const production = config.get<string>('nodeEnv') === 'production';
  if (production) assertServerDatabase(config, isPostgres);

  const common = {
    autoLoadEntities: true,
    synchronize: config.get<boolean>('database.synchronize') ?? true,
    logging: config.get<string>('nodeEnv') === 'development',
  };

  if (isPostgres) {
    const rawUrl = config.get<string>('database.url');
    if (rawUrl) {
      // Fail fast with a readable message instead of endless
      // "getaddrinfo ENOTFOUND ..." retries when the connection
      // string is truncated or has unencoded special characters.
      let host: string | null = null;
      try {
        host = new URL(rawUrl).hostname || null;
      } catch {
        host = null;
      }
      if (!host) {
        throw new Error(
          'DATABASE_URL is not a valid PostgreSQL connection string. ' +
            'Expected format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE ' +
            '(URL-encode @ # ? / : in the password).',
        );
      }
    }
    return {
      ...common,
      type: 'postgres' as const,
      url: config.get<string>('database.url') || undefined,
      host: config.get<string>('database.host'),
      port: config.get<number>('database.port'),
      username: config.get<string>('database.user'),
      password: config.get<string>('database.password'),
      database: config.get<string>('database.name'),
      ssl: config.get<boolean>('database.ssl')
        ? { rejectUnauthorized: false }
        : undefined,
    };
  }

  const dir = join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  return {
    ...common,
    type: 'sqljs' as const,
    location: join(dir, 'dev.sqlite'),
    autoSave: true,
  };
}