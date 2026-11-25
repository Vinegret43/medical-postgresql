import { randomBytes, scryptSync } from 'node:crypto';
import * as OTPAuth from 'otpauth';

const [command, value] = process.argv.slice(2);

if (command === 'hash') {
	if (!value) throw new Error('usage: node scripts/auth-tools.mjs hash <password>');
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(value, salt, 64).toString('hex');
	console.log(`${salt}:${hash}`);
} else if (command === 'totp') {
	if (!value) throw new Error('usage: node scripts/auth-tools.mjs totp <base32-secret>');
	const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(value) });
	console.log(totp.generate());
} else {
	console.log('usage: node scripts/auth-tools.mjs hash <password> | totp <base32-secret>');
}
