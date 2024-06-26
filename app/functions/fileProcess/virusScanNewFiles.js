//####################################################
//############### VIRUS SCAN NEW FILES ###############
//####################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { updateCpuThreadsInUse } from '../../functions/fileProcess/updateCpuThreadsInUse.js';
import virusScanFile from '../../functions/fileProcess/antiVirus/virusScanFile.js';
import { lockFile } from '../../functions/fileProcess/lockFile.js';
import { cpuThreadsFree } from './cpuThreadsFree.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function virusScanNewFiles() { 

  let cpuThreadsToUse = await cpuThreadsFree();

  return new Promise((resolve) => {

    try {

      if (cpuThreadsToUse > 0) {

        cpuThreadsToUse = 1;

        tempFilesModel.findOne({ file_lock: 0, virus_scanned: 0, error: 0 }, async function (err, obj) {

          if (obj) {

            let fileID = obj.file_id;
            let fileLocation = obj.file_location;

            await updateCpuThreadsInUse(cpuThreadsToUse);

            await lockFile(fileID);

            if (process.env.NODE_ENV === "development") {
              console.log('Virus scanning:' + fileID + ' started');
            }

            let fileExists;
            try {
              fs.accessSync(fileLocation, fs.constants.F_OK);
              fileExists = true;
            } catch (err) {
              fileExists = false;
            }

            if (fileExists) {
              
              let AvScanResult = await virusScanFile(fileLocation);

              let finishedFilter = { file_id: fileID };

              if (AvScanResult === "scan-failed") {

                let finishedUpdate = { $set: { virus_scanned: 0, file_lock: 0 } };
                let finishedOpts = { upsert: true };
                tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);
                
              } else if (AvScanResult === true) {
                
                let finishedUpdate = { $set: { virus_scanned: 1, error: 1, data: { error:"virus found, file deleted"} } };
                let finishedOpts = { upsert: true };
                tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

                fs.unlink(fileLocation, (err) => {
                  if (err) {
                    console.error('Error deleting virus infected file:', err);
                    return;
                  }
                }); 

                if (process.env.NODE_ENV === "development") {
                  console.log('VIRUS FOUND:' + fileID);
                }

              } else {

                let finishedUpdate = { $set: { virus_scanned: 1, file_lock: 0 } };
                let finishedOpts = { upsert: true };
                tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

              }

              await updateCpuThreadsInUse(cpuThreadsToUse, 1);
              

              if (process.env.NODE_ENV === "development") {
                console.log('Virus scanning:' + fileID + ' complete');
              }

              resolve(true);

            } else {
              console.log('file id:' + fileID + ' does not exist at ' + fileLocation);
              resolve(false);
            }

          } else {
            resolve(false);
          }

        });


      } else { 

        resolve(false);

      }


    } catch (error) {
      console.error('Error virus scanning:', error);

      resolve(false);

    }

  });
}

export default virusScanNewFiles;

