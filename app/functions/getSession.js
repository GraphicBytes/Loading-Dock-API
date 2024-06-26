//#####################################################
//############### Get Session Functions ###############
//#####################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import options from '../config/options.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { encrypt } from './crypt/encrypt.js';
import { decrypt } from './crypt/decrypt.js';
import { sha256 } from './crypt/sha256.js';
import { randomString } from './crypt/randomString.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getSession(app, req, res, platformData) {

  return new Promise((resolve) => {
   
    if (app.locals.session_id !== null) {
      resolve(app.locals.session_id); 
    } else {
    
        let cookieId = platformData.platform_tag.toUpperCase() + 'LOADINGDOCK';
        let sessionData = {};
        let sessionID = "null";
        let currentTime = theEpochTime();
        let ageLimitToReset = currentTime - 3600;

        let userAgent = theUserAgent(req);
        let hashedUserAgent = sha256(userAgent);
        let referer = req.headers.referer;

        let validCookie = false;
        let pushCookie = true;

        if (req.cookies !== undefined && req.cookies[cookieId] !== undefined) {

          const userCookieString = req.cookies[cookieId];
          let userCookieData = JSON.parse(decrypt(userCookieString, process.env.NETWORK_MINOR_ENCRYPTION_KEY));

          if (userCookieData) {

            if (
              userCookieData.platform === platformData.platform_tag
              && userCookieData.user_agent === hashedUserAgent
              //&& userCookieData.referer === referer
            ) {

              sessionData['platform'] = userCookieData.platform;
              sessionData['session_id'] = userCookieData.session_id;
              sessionData['user_agent'] = userCookieData.user_agent;
              sessionData['referer'] = userCookieData.referer;

              let tokenAge = parseInt(userCookieData.token_age);

              if (tokenAge < ageLimitToReset || tokenAge === NaN || !tokenAge) {
                sessionData['token_age'] = currentTime;
              } else {
                sessionData['token_age'] = userCookieData.token_age;
                pushCookie = false;
              }
              validCookie = true;

            }
          }
        }

        if (!validCookie) {

          sessionID = randomString(32);
          sessionData['platform'] = platformData.platform_tag;
          sessionData['session_id'] = sessionID;
          sessionData['user_agent'] = hashedUserAgent;
          sessionData['referer'] = referer;
          sessionData['token_age'] = currentTime;

        }

        if (pushCookie) {

          const cookieString = encrypt(JSON.stringify(sessionData), process.env.NETWORK_MINOR_ENCRYPTION_KEY);
          res.setHeader('Set-Cookie', cookieId + '=' + cookieString + '; HttpOnly; Secure; SameSite=None; max-age=1209600; Domain=' + process.env.HOST_NAME + '; path=/');
          
          if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
            console.log("---created new session")
          } 

        }

        app.locals.session_id = sessionData.session_id;
        resolve(sessionData.session_id);
 
    }
  });
}
 