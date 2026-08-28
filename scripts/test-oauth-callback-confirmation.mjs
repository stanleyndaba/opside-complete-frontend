import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/lib/oauthCallbackConfirmation.ts');
const compiler = path.join(root, 'node_modules/.bin/tsc');
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'margin-oauth-route-confirmation-'));

function statusFor(provider, overrides = {}) {
  return {
    amazon_connected: false,
    providers: {
      [provider]: { connected: true, auth_valid: true, needs_reconnect: false, ...overrides },
    },
  };
}

try {
  execFileSync(compiler, [
    source,
    '--target', 'ES2022',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--outDir', outputDir,
    '--skipLibCheck',
  ], { stdio: 'inherit' });

  const compiled = path.join(outputDir, 'oauthCallbackConfirmation.js');
  const {
    getProviderConnectionContext,
    hasAuthoritativeCallbackConfirmation,
    isSupportedOAuthProvider,
    normalizeCallbackProvider,
    resolveProviderConnectionContext,
  } = await import(pathToFileURL(compiled).href);

  const gmailOnly = {
    amazon_connected: false,
    providers: {
      gmail: { connected: true, auth_valid: true, needs_reconnect: false },
      dropbox: { connected: false, auth_valid: false, needs_reconnect: false },
    },
  };

  // Registered OAuthSuccess aliases are confirmation-aware OAuthCallback routes.
  for (const query of [
    '?provider=dropbox',
    '?provider=dropbox&code=forged',
    '?provider=dropbox&state=forged',
    '?provider=dropbox&success=true',
  ]) {
    const resolution = resolveProviderConnectionContext(query, gmailOnly);
    assert.equal(
      resolution.confirmed,
      false,
      `${query} must not confirm Dropbox from browser callback context or Gmail's status`,
    );
  }
  assert.equal(
    resolveProviderConnectionContext('?provider=gmail&status=ok', { amazon_connected: false, providers: {} }).confirmed,
    false,
    'Gmail status=ok cannot confirm Gmail without Gmail-specific authoritative truth',
  );

  const supportedNonAmazonProviders = [
    'gmail', 'outlook', 'gdrive', 'dropbox', 'slack', 'adobe_sign', 'onedrive', 'quickbooks', 'xero',
  ];
  for (const provider of supportedNonAmazonProviders) {
    assert.equal(
      resolveProviderConnectionContext(`?provider=${provider}&success=true`, { amazon_connected: false, providers: {} }).confirmed,
      false,
      `${provider} callback URL state cannot create success without exact-provider truth`,
    );
    assert.equal(
      resolveProviderConnectionContext(`?provider=${provider}`, statusFor(provider)).confirmed,
      true,
      `${provider} can confirm only after exact-provider authoritative truth`,
    );
  }

  const unsupported = resolveProviderConnectionContext('?provider=anything&success=true', gmailOnly);
  assert.equal(unsupported.provider, 'anything', 'unsupported provider context is preserved only for failure handling');
  assert.equal(unsupported.supported, false, 'unsupported provider must be rejected');
  assert.equal(unsupported.confirmed, false, 'unsupported provider must never be confirmed');
  assert.equal(isSupportedOAuthProvider('anything'), false, 'unknown provider must not be supported');
  assert.equal(normalizeCallbackProvider(' DROPBOX '), 'dropbox', 'provider names normalize deterministically');

  // Both redirect shims preserve query context but cannot bypass this resolver.
  for (const query of [
    '?provider=dropbox&code=forged',
    '?provider=dropbox&success=true',
  ]) {
    assert.equal(
      resolveProviderConnectionContext(query, gmailOnly).confirmed,
      false,
      `redirect-shim ${query} must remain unconfirmed without Dropbox truth`,
    );
  }
  assert.equal(
    resolveProviderConnectionContext('?provider=dropbox', statusFor('dropbox')).confirmed,
    true,
    'a legitimate redirect-shim/context path may confirm only after Dropbox-specific truth',
  );

  // Integrations Hub marker inputs are provider context, not connection truth.
  for (const query of [
    '?connected=gmail',
    '?gmail_connected=true',
    '?dropbox_connected=true',
    '?quickbooks_connected=true',
  ]) {
    assert.equal(
      resolveProviderConnectionContext(query, { amazon_connected: false, providers: {} }).confirmed,
      false,
      `Integrations Hub marker ${query} must not create success without exact-provider truth`,
    );
  }
  for (const marker of [
    '?gmail_connected=true', '?outlook_connected=true', '?gdrive_connected=true', '?dropbox_connected=true',
    '?quickbooks_connected=true', '?xero_connected=true', '?slack_connected=true', '?adobe_sign_connected=true',
    '?onedrive_connected=true', '?amazon_connected=1',
  ]) {
    assert.equal(
      resolveProviderConnectionContext(marker, { amazon_connected: false, providers: {} }).confirmed,
      false,
      `${marker} cannot create success without exact-provider authoritative truth`,
    );
  }
  assert.equal(
    resolveProviderConnectionContext('?dropbox_connected=true', gmailOnly).confirmed,
    false,
    'a Gmail connection must not confirm a Dropbox marker',
  );
  assert.equal(
    resolveProviderConnectionContext('?dropbox_connected=true', statusFor('dropbox')).confirmed,
    true,
    'an exact provider marker may show success only after Dropbox-specific truth',
  );
  assert.equal(
    resolveProviderConnectionContext('?dropbox_connected=true', statusFor('dropbox', { auth_valid: false })).confirmed,
    false,
    'auth-invalid provider state must not show marker-driven success',
  );
  assert.equal(
    resolveProviderConnectionContext('?dropbox_connected=true', statusFor('dropbox', { needs_reconnect: true })).confirmed,
    false,
    'reconnect-required provider state must not show marker-driven success',
  );

  // Amazon remains governed only by the canonical Amazon truth field.
  assert.equal(
    hasAuthoritativeCallbackConfirmation('amazon', {
      amazon_connected: true,
      providers: { amazon: { connected: false, auth_valid: false, needs_reconnect: false } },
    }),
    true,
    'canonical amazon_connected=true confirms Amazon',
  );
  assert.equal(
    resolveProviderConnectionContext('?amazon_connected=1', {
      amazon_connected: false,
      providers: { amazon: { connected: true, auth_valid: true, needs_reconnect: false } },
    }).confirmed,
    false,
    'Amazon-shaped provider subfields and URL markers cannot override false canonical Amazon truth',
  );

  const markerContext = getProviderConnectionContext('?gmail_connected=true');
  assert.deepEqual(
    markerContext,
    { provider: 'gmail', supported: true, source: 'provider_marker' },
    'named provider markers identify context only and carry no implied success state',
  );

  console.log('OAuth registered-route confirmation checks passed.');
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
