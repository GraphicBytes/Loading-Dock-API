//########################################################
//############### CHECK MALICIOUS ACTIVITY ###############
//########################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import options from '../../config/options.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { maliciousIpsModel } from '../../models/maliciousIpsModel.js';
import { maliciousUserAgentsModel } from '../../models/maliciousUserAgentsModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { sha256 } from '../../functions/crypt/sha256.js'; 
import { theUserIP } from '../../functions/helpers/theUserIP.js';
import { theUserAgent } from '../../functions/helpers/theUserAgent.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkMalicious(req, platformData) {
  return new Promise((resolve) => { 

    let userIP = theUserIP(req);
    let userAgent = theUserAgent(req);

    if (userIP !== null && userIP !== "") {

      let toHash = userAgent + userIP;
      let userAgentHash = sha256(toHash)


        maliciousIpsModel.findOne({ ip: userIP }, function (err, obj) {

          if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
            console.log("---DB: looked for malicious IP");
          }

          if (obj) {

            var ipEvents = obj.attempts;
            if (ipEvents > parseInt(platformData.user_ip_block_threshold)) {
              
              resolve(true)

            } else { 

              maliciousUserAgentsModel.findOne({ agent_hash: userAgentHash }, function (err, obj) {

                if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
                  console.log("---DB: looked for malicious User Agent");
                }

                if (obj) {
                  var agentEvents = obj.attempts;
                  if (agentEvents > parseInt(platformData.user_agent_block_threshold)) { 
                    resolve(true);
                  } else { 
                    resolve(false);
                  }
                } else { 
                  resolve(false);
                }
              });

            }
          } else { 

            maliciousUserAgentsModel.findOne({ agent_hash: userAgentHash }, function (err, obj) {

              if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
                console.log("---DB: looked for malicious User Agent");
              }

              if (obj) {
                var agentEvents = obj.attempts;
                if (agentEvents > parseInt(platformData.user_agent_block_threshold)) { 
                  resolve(true);
                } else { 
                  resolve(false);
                }
              } else { 
                resolve(false);
              }
            });

          }
        });
 

    } else {
      resolve(false);
    }

  });
}