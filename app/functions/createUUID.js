//################################################
//############### CREATE UNIQUE ID ###############
//################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { randomString } from './crypt/randomString.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { num2alpha } from './helpers/num2alpha.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function createUUID() {

  const timeStamp = theEpochTime();
  const currentTimeAlpha = num2alpha(timeStamp);
  const randFillChars = 14 - currentTimeAlpha.length;
  const randFill = randomString(randFillChars);
  const theID = currentTimeAlpha + randFill;

  return theID;

} 