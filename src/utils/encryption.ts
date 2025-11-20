import nacl from "tweetnacl";
import util from "tweetnacl-util";

export function encryptMessage(
  message: string,
  mySecretKey64: string,
  theirPublicKey64: string
): string {
  try {
    const mySecretKey = util.decodeBase64(mySecretKey64);
    const theirPublicKey = util.decodeBase64(theirPublicKey64);

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = util.decodeUTF8(message);

    const encryptedBox = nacl.box(
      messageUint8,
      nonce,
      theirPublicKey,
      mySecretKey
    );

    const fullMessage = new Uint8Array(nonce.length + encryptedBox.length);
    fullMessage.set(nonce);
    fullMessage.set(encryptedBox, nonce.length);

    return util.encodeBase64(fullMessage);
  } catch (e) {
    console.error("Encryption Error:", e);
    return "⚠️ Encryption Failed";
  }
}

export function decryptMessage(
  encryptedMessage64: string,
  mySecretKey64: string,
  theirPublicKey64: string
): string {
  try {
    const mySecretKey = util.decodeBase64(mySecretKey64);
    const theirPublicKey = util.decodeBase64(theirPublicKey64);
    const messageWithNonceAsUint8 = util.decodeBase64(encryptedMessage64);

    const nonce = messageWithNonceAsUint8.slice(0, nacl.box.nonceLength);
    const message = messageWithNonceAsUint8.slice(
      nacl.box.nonceLength,
      messageWithNonceAsUint8.length
    );

    const decrypted = nacl.box.open(
      message,
      nonce,
      theirPublicKey,
      mySecretKey
    );

    if (!decrypted) {
      throw new Error("Decryption failed");
    }

    return util.encodeUTF8(decrypted);
  } catch (error) {
    return "🔒 Unreadable Message";
  }
}

export function generateSafetyNumber(keyA: string, keyB: string): string {
  try {
    const sortedKeys = [keyA, keyB].sort();
    const combined = sortedKeys[0] + sortedKeys[1];

    const hash = nacl.hash(util.decodeUTF8(combined));

    let numericString = "";
    for (let i = 0; i < hash.length; i++) {
      numericString += hash[i].toString();
    }

    const code = numericString.substring(0, 60);
    const chunks = code.match(/.{1,5}/g) || [];

    return chunks.slice(0, 12).join(" ");
  } catch (e) {
    return "Error Generating Safety Number";
  }
}
