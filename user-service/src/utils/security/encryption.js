const crypto = require('crypto');

// Расшифровка данных
const decrypt = (encryptedData, key) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
};

// Проверка подписи
const verifySignature = (data, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  const calculatedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
};

module.exports = {
  decrypt,
  verifySignature
}; 