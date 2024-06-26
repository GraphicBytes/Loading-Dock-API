//##########################################################
//############### GET PLATFORM DATA FUNCTION ###############
//##########################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import options from '../config/options.js'; 

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { platformsModel } from '../models/platformsModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getPlatformData(platform) { 
  
  return new Promise((resolve) => { 

      platformsModel.findOne({ platform: platform }, function (err, obj) {

        if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
          console.log("---DB: looked for platform data");
        }

        if (obj) { 
          resolve(obj.data);

        } else { 
          resolve(false);
        }
      }); 
  });
}
