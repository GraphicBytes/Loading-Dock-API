//################################################
//############### CHECK AUTH TOKEN ###############
//################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from '../functions/crypt/decrypt.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { checkMalicious } from '../functions/malicious/checkMalicious.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { getSession } from '../functions/getSession.js';
import { theUserIP } from '../functions/helpers/theUserIP.js';
import { theEpochTime } from '../functions/helpers/theEpochTime.js';
import { theUserAgent } from '../functions/helpers/theUserAgent.js';
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkAuthToken(app, req, res, platform, tokenString) {
  try {

    let outputResult = false;

    if (
      !isNullOrEmpty(tokenString)
    ) {

      let tokenData = JSON.parse(decrypt(tokenString, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));

      if (tokenData !== null) {

        let platformData = await getPlatformData(platform);
        let sessionID = await getSession(app, req, res, platformData);

        if (platformData) {

          let isMalicious = await checkMalicious(req, platformData);
          let requestTime = theEpochTime();

          let tokenSessionID = tokenData.session_id;
          let tokenUserID = tokenData.user_id;
          let tokenSuperUser = parseInt(tokenData.super_user);
          let tokenPlatform = tokenData.platform;
          let tokenUserEmail = tokenData.user_email;
          let tokenCreated = parseInt(tokenData.created);
          let tokenCookieString = tokenData.cookie_string;
          let tokenUserAgent = tokenData.user_agent;
          let userIP = theUserIP(req);
          let tokenUserIP = tokenData.user_ip;
          let tokenRememberMe = parseInt(tokenData.remember_me);

          let userAgent = theUserAgent(req);

          let rememberMeCutOFf = requestTime - platformData.auth_remember_me_age_limit;
          let nonRememberMeCutOFf = requestTime - platformData.auth_non_remember_me_age_limit;

          if (
            !isMalicious
            && sessionID === tokenSessionID
            && platform === tokenPlatform
            && tokenUserAgent === userAgent
            && (
              (tokenRememberMe === 1 && tokenCreated > rememberMeCutOFf)
              || (tokenRememberMe === 0 && tokenCreated > nonRememberMeCutOFf)
            )
            && (
              (tokenSuperUser === 0)
              || (tokenSuperUser === 1 && tokenUserIP === userIP)
            )
          ) {

            let userData = await getUser(tokenUserEmail, platform);

            if (userData) {

              if (
                userData.userID === tokenUserID
                && userData.userData[tokenPlatform].cookie_string === tokenCookieString
                && userData.userBanned === 0
                && userData.userLoginFail <= platformData.maximun_pw_attempts 
              ) {

                outputResult = true;

              } else {
                logMalicious(req, "AUTH TOKEN WITH WRONG COOKIE STRING USED");
              }
            } else {
              logMalicious(req, "AUTH TOKEN DATA MISSING USER");
            }
          } else {
            logMalicious(req, "AUTH DATA FAILED TO VALIDATE");
          }
        } else {
          logMalicious(req, "INVALID PLAFORM DATA");
        }
      } else {
        logMalicious(req, "AUTH TOKEN FAILED TO VALIDATE");
      }
    } else {
      logMalicious(req, "NO AUTH TOKEN GIVEN");
    }

    return outputResult;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return false;
  }
} 