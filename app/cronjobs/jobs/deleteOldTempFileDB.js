//#########################################################
//############### DELETE TEMP FILES FROM DB ###############
//#########################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
export async function deleteOldTempFileDB() { 

  return new Promise((resolve) => {

      try {

        let requestTime = theEpochTime();
        let cleanTime = requestTime - 21600; // minus 6 hours

        tempFilesModel.find({
          upload_time: { $lt: cleanTime }
        }, async function (err, obj) {

          if (obj) {

            for (const fileRow in obj) { 

              tempFilesModel.deleteOne({ _id: obj[fileRow]._id }, (err) => {
                if (err) {
                  console.error(err);
                }
              });

            }

            resolve(null);

          } else {
            resolve(false);
          }

        });

      } catch (error) { 
        resolve(false);
      } 

  });
}

export default deleteOldTempFileDB;



