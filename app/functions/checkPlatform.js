//#######################################################
//############### PLATFORM CHECK FUNCTION ###############
//####################################################### 

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { platformsModel } from '../models/platformsModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
async function checkPlatform(platform) { 

  return new Promise((resolve) => {  

      platformsModel.findOne({ platform: platform }, function (err, obj) { 

        if (obj) { 
          resolve(true);
        } else { 
          resolve(false);
        }
      }); 

  });
}

module.exports = checkPlatform;