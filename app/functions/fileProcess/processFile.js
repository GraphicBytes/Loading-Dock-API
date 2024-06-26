//######################################################
//############### PROCESS IMAGE FUNCTION ###############
//######################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';
import path from 'path';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getPlatformData } from '../getPlatformData.js';
import { updateCpuThreadsInUse } from './updateCpuThreadsInUse.js';
import { lockFile } from './lockFile.js';
import { cpuThreadsFree } from './cpuThreadsFree.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function processFile(fileID, publicFile = false) {

  let cpuThreadsToUse = await cpuThreadsFree();

  return new Promise((resolve) => {

    try {

      if (cpuThreadsToUse > 0) {

        cpuThreadsToUse = 1;

        tempFilesModel.findOne({ file_id: fileID, virus_scanned: 1, file_lock: 0, rendered: 0, error: 0 }, async function (err, obj) {

          if (obj) {

            await updateCpuThreadsInUse(cpuThreadsToUse);

            await lockFile(fileID);

            let platform = obj.platform;
            let fileLocation = obj.file_location;
            let processType = obj.process_type;
            let fileName = path.basename(fileLocation);
            let processMetaData = obj.data; 
            let fileMeta = obj.data;

            if (process.env.NODE_ENV === "development") {
              console.log('Document processing id:' + fileID + ' started');
            }

            let platformData = await getPlatformData(platform);

            let fileExists;
            try {
              fs.accessSync(fileLocation, fs.constants.F_OK);
              fileExists = true;
            } catch (err) {
              fileExists = false;
            }

            if (fileExists) {

              let processingInstructions = platformData.file_processing.process_types[processType];
              let processingFolderPath = '/usr/app/processing/' + fileID + '/';
              let originalFileFilePath = processingFolderPath + fileName;
              let originalFileExtension = path.extname(originalFileFilePath);
              let originalFileFilePathDesination = processingFolderPath + fileID + "_" + "original" + originalFileExtension;

              await fs.mkdir(processingFolderPath, { recursive: true }, async (err) => {

                if (err) {
                  console.error('Failed to create directory:', err);
                  resolve(false);
                } else {



                  //////////////////////////////
                  ////// KEEP ORIGIIONAL? //////
                  //////////////////////////////
                  async function proccessIfKeepOriginal() {
                    return new Promise((resolve) => { 

                        fs.copyFile(fileLocation, originalFileFilePathDesination, (err) => {
                          if (err) {
                            console.error('Failed to copy file id:' + fileID + ' ', err);
                            resolve(false);
                          } else {

                            processMetaData.original = {};
                            processMetaData.original.fileLocation = originalFileFilePath;

                            fileMeta.original_file = {
                              file_location: originalFileFilePathDesination
                            };

                            resolve(true);

                            if (process.env.NODE_ENV === "development") {
                              console.log('Document processing id:' + fileID + ' original complete');
                            }

                          }
                        }); 

                    });
                  }
                  await proccessIfKeepOriginal();


                  ///////////////////////
                  ////// FINISH UP //////
                  ///////////////////////
                  let finishedFilter = { file_id: fileID };
                  let finishedUpdate = { $set: { file_lock: 0, rendered: 1, data: fileMeta } };
                  let finishedOpts = { upsert: true };
                  tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

                  await updateCpuThreadsInUse(cpuThreadsToUse, 1); 

                  //console.log(processMetaData);

                  if (process.env.NODE_ENV === "development") {
                    console.log('Document processing id:' + fileID + ' complete');
                  }

                  resolve(true);

                }

              });

            } else {
              console.log('Image file id:' + fileID + ' does not exist');
            }

          } else {
            console.error('Error processing document:', err);
            resolve(false);
          }

        });

      } else {

        if (process.env.NODE_ENV === "development") {
          console.log('NO CPU THREAD AVAILABLE FOR RENDER!');
        }

        resolve(false);

      }


    } catch (error) {
      console.error('Error processing image:', error);

      resolve(false);

    }

  });
}

export default processFile;