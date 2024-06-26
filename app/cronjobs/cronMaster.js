//#########################################
//############### CRON JOBS ###############
//#########################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { apiDataModel } from '../models/apiDataModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { virusScanNewFiles } from '../functions/fileProcess/virusScanNewFiles.js';
import { runProcessQueue } from '../functions/fileProcess/runProcessQueue.js';
import { theEpochTime } from '../functions/helpers/theEpochTime.js';

//////////////////////////////
////// CRON JOB IMPORTS //////
//////////////////////////////
import maliciousIpsCleanup from './jobs/maliciousIpsCleanup.js';
import maliciousUserAgentsCleanup from './jobs/maliciousUserAgentsCleanup.js';
import bankFilesToWarehouse from './jobs/bankFilesToWarehouse.js';
import deleteProcessedFiles from './jobs/deleteProcessedFiles.js';
import deleteOldTempFileDB from './jobs/deleteOldTempFileDB.js';
import deleteOldTempFiles from './jobs/deleteOldTempFiles.js';

///////////////////////////////////////
////// IN-LINE SUPPORT FUNCTIONS //////
///////////////////////////////////////
export const fileProcessingTasks = async () => {
  try {

    virusScanNewFiles();

    setTimeout(runProcessQueue, 1000);

    setTimeout(bankFilesToWarehouse, 2000);

    setTimeout(deleteProcessedFiles, 3000);

    setTimeout(deleteProcessedFiles, 3000);

  } catch (error) {
    console.error('An error occurred while executing the tasks:', error);
  }
};

export const tempCleanUp = async () => {
  try {

    deleteOldTempFileDB();
    deleteOldTempFiles();


  } catch (error) {
    console.error('An error occurred while executing the tasks:', error);
  }
}

export async function cronTasks() {

  let requestTime = theEpochTime();

  //// MALICIOUS IP CLEAN UP ////
  maliciousIpsCleanup(); 

  //// MALICIOUS USER AGENTS CLEAN UP ////
  maliciousUserAgentsCleanup(); 

  //// UPDATE LAST CRON TIME ////
  let filter = { meta_key: "last_cron" };
  let update = { $set: { meta_value: requestTime, } };
  let opts = { upsert: true };
  apiDataModel.collection.updateOne(filter, update, opts);

}