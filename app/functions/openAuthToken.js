//###############################################
//############### OPEN AUTH TOKEN ###############
//###############################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from './crypt/decrypt.js';
import { logMalicious } from './malicious/logMalicious.js';
import { checkMalicious } from './malicious/checkMalicious.js';
import { getPlatformData } from './getPlatformData.js';
import { getSession } from './getSession.js';
import { theUserIP } from './helpers/theUserIP.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';
import { isNullOrEmpty } from './helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function openAuthToken(app, req, res, platform, tokenString) {
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

                let userGroups = userData.userData[platform].user_groups;

                let userPrivilages = {};
                let adminPrivilages = {};

                for (let groupTag in userGroups) {

                  let thisGroupData = await getUserGroupData(groupTag, platform);

                  if (thisGroupData) {

                    let groupName = thisGroupData.group_name;
                    let groupPrivilages = thisGroupData.user_privileges;
                    let adminGroupPrivilages = thisGroupData.admin_privileges;

                    for (let privKey in groupPrivilages) {

                      if (typeof groupPrivilages[privKey] !== 'undefined') {
                        userPrivilages[privKey] = {}
                      }

                      let thisModulePermsList = groupPrivilages[privKey];

                      for (let permissionKey in thisModulePermsList) {

                        if (typeof userPrivilages[privKey][permissionKey] === 'undefined') {

                          userPrivilages[privKey][permissionKey] = thisModulePermsList[permissionKey];

                        } else {

                          if (userPrivilages[privKey][permissionKey] === 0) {
                            userPrivilages[privKey][permissionKey] = thisModulePermsList[permissionKey];
                          }

                        }
                      }
                    }

                    for (let privKey in adminGroupPrivilages) {

                      if (typeof adminPrivilages[privKey] === 'undefined') {
                        adminPrivilages[privKey] = {}
                      }

                      if (typeof adminPrivilages["user_groups"] === 'undefined') {
                        adminPrivilages["user_groups"] = {}
                      }

                      if (typeof adminPrivilages["user_groups"][groupName] === 'undefined') {
                        adminPrivilages["user_groups"][groupName] = { group_id: groupTag }
                      }

                      adminPrivilages["user_groups"][groupName][privKey] = {};

                      if (adminGroupPrivilages[privKey].super_admin === 1) {

                        adminPrivilages["user_groups"][groupName][privKey] = {};
                        adminPrivilages["user_groups"][groupName][privKey]["super_admin"] = 1

                        adminPrivilages[privKey] = {};
                        adminPrivilages[privKey]["super_admin"] = 1;

                      } else {

                        let doLoop = true;

                        if (typeof adminPrivilages[privKey]["super_admin"] !== 'undefined') {

                          if (adminPrivilages[privKey]["super_admin"] === 1) {
                            doLoop = false;
                          }

                        }

                        let thisModulePermsList = adminGroupPrivilages[privKey];

                        if (doLoop) {

                          for (let permissionKey in thisModulePermsList) {

                            if (typeof adminPrivilages[privKey][permissionKey] === 'undefined') {

                              adminPrivilages[privKey][permissionKey] = thisModulePermsList[permissionKey];

                            } else {

                              if (adminPrivilages[privKey][permissionKey] === 0) {
                                adminPrivilages[privKey][permissionKey] = thisModulePermsList[permissionKey];
                              }

                            }
                          }
                        }

                        adminPrivilages["user_groups"][groupName][privKey] = thisModulePermsList;

                      }
                    }

                  }
                }

                outputResult = {
                  "tokenData": tokenData,
                  "userData": userData,
                  "userPrivilages": userPrivilages,
                  "adminPrivilages": adminPrivilages
                } 

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