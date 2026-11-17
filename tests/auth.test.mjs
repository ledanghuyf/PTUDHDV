// Kiểm tra băm mật khẩu và quy tắc mật khẩu. Chạy: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, passwordError, randomSalt } from '../src/js/auth.js';

test('băm cùng mật khẩu + muối cho cùng kết quả; khác muối thì khác', async () => {
    const salt = randomSalt();
    assert.equal(salt.length, 32);
    const h1 = await hashPassword('(đã ẩn)', salt);
    assert.equal(h1, await hashPassword('(đã ẩn)', salt));
    assert.notEqual(h1, await hashPassword('(đã ẩn)', randomSalt()));
    assert.match(h1, /^[0-9a-f]{64}$/);
});

test('verifyPassword: đúng mật khẩu mới qua, thiếu dữ liệu thì từ chối', async () => {
    const salt = randomSalt();
    const user = { salt, passwordHash: await hashPassword('matkhau99', salt) };
    assert.equal(await verifyPassword('matkhau99', user), true);
    assert.equal(await verifyPassword('matkhau98', user), false);
    assert.equal(await verifyPassword('matkhau99', null), false);
    assert.equal(await verifyPassword('matkhau99', { salt }), false);
});

test('passwordError: đủ 8 ký tự, có chữ và số', () => {
    assert.match(passwordError('abc12'), /8 ký tự/);
    assert.match(passwordError('abcdefgh'), /chữ và số/);
    assert.match(passwordError('12345678'), /chữ và số/);
    assert.equal(passwordError('(đã ẩn)'), '');
    assert.equal(passwordError('mậtkhẩu9'), '');
});
