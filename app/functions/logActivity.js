//######################################################
//###############  LOG ACTIVITY FUNCTION ###############
//######################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theUserIP } from './helpers/theUserIP.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function logActivity(req, userID, platform, logMessage) {
  return new Promise((resolve) => {

    let userIP = theUserIP(req);
    let requestTime = theEpochTime();
    let userAgent = theUserAgent(req);

    activityLogModel.create({
      user_id: userID,
      platform: platform,
      user_ip: userIP,
      user_agent: userAgent,
      log_event: logMessage,
      log_time: requestTime
    });

    resolve(true);

  });
}