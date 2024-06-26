//################################################
//############### Check CSRF Token ###############
//################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from '../../functions/crypt/decrypt.js';
import { sha256 } from '../../functions/crypt/sha256.js';
import { logMalicious } from '../../functions/malicious/logMalicious.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { getSession } from '../../functions/getSession.js';
import { theUserIP } from '../../functions/helpers/theUserIP.js';
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';
import { theUserAgent } from '../../functions/helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkCsrfToken(app, req, res) {

  let platformData = await getPlatformData(req.params.fromPlatform);
  let sessionID = await getSession(app, req, res, platformData);

  return new Promise((resolve) => {

    if (platformData) {

      let csrfSalt = platformData.csrf_salt;
      let csrfTimeLimit = platformData.csrf_time_limit;
      let csrfIpSecured = platformData.csrf_ip_secure;

      let userAgent = theUserAgent(req);
      let userAgentHash = sha256(userAgent);

      let token = req.body.csrf;
      let tokenData = decrypt(token, process.env.NETWORK_MINOR_ENCRYPTION_KEY);
      let csrfTokenData = JSON.parse(tokenData); 

      if (csrfTokenData) {

        let tokenCutoffTime = theEpochTime() - csrfTimeLimit;

        let tokenPreValidation = true;

        if (csrfTimeLimit > 0) {
          if (csrfTokenData.created < tokenCutoffTime) {
            tokenPreValidation = false;
            resolve(false);
            logMalicious(req, "OUT OF DATE CSRF TOKEN DATA");
          }
        }

        if (csrfIpSecured === 1) {
          let userIP = theUserIP(req);
          if (csrfTokenData.user_ip !== userIP) {
            tokenPreValidation = false;
            resolve(false);
            logMalicious(req, "FAILED CSRF TOKEN CHECK INVALID IP");
          }
        }
        
        if (
          tokenPreValidation
          && csrfTokenData.platform === req.params.fromPlatform
          && csrfTokenData.session_id === sessionID
          && csrfTokenData.user_agent === userAgentHash
          && csrfTokenData.csrf_salt === csrfSalt
        ) {
          resolve(true);
        } else {
          resolve(false);
          logMalicious(req, "INVALID CSRF TOKEN DATA");
        } 

      } else {
        resolve(false);
        logMalicious(req, "INVALID CSRF TOKEN DECRYPT");
      }
    } else {
      resolve(false);
      logMalicious(req, "INVALID PLATFORM WHEN CHECKING CSRF TOKEN");
    }

  });
}
