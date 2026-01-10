#!/usr/bin/env ts-node
/**
 * Generate API keys and encryption keys for partner integrations
 * 
 * Usage:
 *   npx ts-node scripts/generate-partner-keys.ts
 * 
 * This script generates:
 * 1. API keys for partner authentication
 * 2. RSA key pairs for encrypted phone number transfer
 */

import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate API key for partner
 */
function generateAPIKey(partner: string, env: 'dev' | 'prod' | 'live' = 'live'): string {
  const random = crypto.randomBytes(24).toString('hex');
  return `${partner}_${env}_${random}`;
}

/**
 * Generate RSA key pair
 */
function generateKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    publicKey,
    privateKey,
  };
}

/**
 * Main function
 */
function main() {
  const partner = process.argv[2] || 'businessos';
  const env = (process.argv[3] as 'dev' | 'prod' | 'live') || 'live';

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     Partner Integration Key Generator                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Generate API keys
  const apiKey = generateAPIKey(partner, env);
  console.log(`📋 ${partner.toUpperCase()} API Key (${env.toUpperCase()}):`);
  console.log(`   ${apiKey}\n`);

  // Generate encryption keys
  console.log('🔐 Generating RSA key pair for phone number encryption...\n');
  const { publicKey, privateKey } = generateKeyPair();

  console.log('📄 Public Key (share with partner):');
  console.log(publicKey);
  console.log('\n🔒 Private Key (keep in CareOS .env - NEVER share):');
  console.log(privateKey);

  // Save to files (optional)
  const outputDir = path.join(process.cwd(), 'keys', partner);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(outputDir, `${partner}_${env}_api_key_${timestamp}.txt`),
    apiKey
  );
  fs.writeFileSync(
    path.join(outputDir, `${partner}_public_key_${timestamp}.pem`),
    publicKey
  );
  fs.writeFileSync(
    path.join(outputDir, `${partner}_private_key_${timestamp}.pem`),
    privateKey
  );

  console.log(`\n✅ Keys saved to: ${outputDir}/\n`);

  // Print environment variable instructions
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           Environment Variables Setup                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Add to CareOS .env:\n');
  console.log(`# ${partner.toUpperCase()} Integration`);
  console.log(`${partner.toUpperCase()}_API_KEY="${apiKey}"`);
  console.log(`CAREOS_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`);
  console.log(`CAREOS_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`);

  console.log('\nAdd to BusinessOS .env:\n');
  console.log(`# CareOS Integration`);
  console.log(`CAREOS_API_KEY="${generateAPIKey('careos', env)}"`);
  console.log(`CAREOS_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`);

  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Never commit private keys to git');
  console.log('   - Add keys/ directory to .gitignore');
  console.log('   - Store private keys securely');
  console.log('   - Rotate keys periodically\n');
}

if (require.main === module) {
  main();
}

export { generateAPIKey, generateKeyPair };

