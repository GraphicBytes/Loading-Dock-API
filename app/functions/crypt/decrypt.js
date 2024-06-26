//################################################
//############### Decrypt Function ###############
//################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { createDecipheriv } from 'crypto';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
export function unScrampbleToken(str, position, numChars) { 
  let newStr = str.slice(0, position) + str.slice(position + numChars);
  newStr = newStr.replace(/:/g, '=');
  newStr = newStr.replace(/\$/g, '+');
  newStr = newStr.replace(/%/g, '/');
  newStr = newStr.replace(/\./g, '==');
  return newStr;
}

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function decrypt(ciphertext, key) {
  try {
    let theCiphertext = unScrampbleToken(ciphertext, 9, 17)
    const cipher = 'aes-256-gcm';
    const encrypted = Buffer.from(theCiphertext, 'base64');
    const iv = encrypted.slice(0, 12);
    const authTag = encrypted.slice(12, 28);
    const decipherObject = createDecipheriv(cipher, key, iv);
    decipherObject.setAuthTag(authTag);
    let ciphertextSliced = encrypted.slice(28);
    let plaintext = decipherObject.update(ciphertextSliced, 'base64', 'utf8');
    plaintext += decipherObject.final('utf8');
    return plaintext;
  } catch (error) {
    return false;
  }
}
