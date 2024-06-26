//######################################################
//############### DELETE PROCESSED FILES ###############
//######################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import { cleaningDataCache } from '../../config/cache.cjs';

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
import { getPlatformData } from '../../functions/getPlatformData.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
export async function deleteProcessedFiles() {

  return new Promise((resolve) => {

    let cleaningData = cleaningDataCache.get("cleaning-data");

    if (cleaningData !== "cleaning") {

      try {

        tempFilesModel.findOne({ file_lock: 1, rendered: 1, sent_to_warehouse: 1, error: 0 }, async function (err, obj) {

          if (obj) {

            cleaningDataCache.set("cleaning-data", "cleaning");

            let filePlatform = obj.platform;
            let fileID = obj.file_id;
            let fileUploadTime = obj.upload_time;
            let fileUploadIP = obj.upload_ip;
            let fileUploadUseragent = obj.upload_useragent;
            let tempFileLocation = obj.file_location;
            let fileType = obj.file_type;
            let processType = obj.process_type;
            let fileUserGroup = obj.user_group;
            let fileData = obj.data;

            let platformData = await getPlatformData(filePlatform);
            let processingInstructions;

            let cleaned = false;

            const processingFolder = "/usr/app/processing/" + fileID + "/";

            if (process.env.NODE_ENV === "development") {
              console.log('Cleaning processed file :' + fileID + ' started');
            }


            //////////////////////////
            ////// HANDLE VIDEO //////
            //////////////////////////
            if (fileType === "video") {

              processingInstructions = platformData.video_processing.process_types[processType]; 

              if (processingInstructions.keep_original === 1) {

                await fs.unlink(fileData.original_file.file_location, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting file: ' + fileData.original_file.file_location, err);
                    return;
                  }
                });

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) { 

                    await fs.unlink(fileData[key].file_location, (err) => {
                      if (err && process.env.NODE_ENV === "development") {
                        //console.error('Error deleting file: ' + fileData[key].file_location, err);
                        return;
                      }
                    });

                  }

                }
              }

              if (fileData.waveform_file) {

                await fs.unlink(fileData.waveform_file, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting file: ' + fileData.waveform_file, err);
                    return;
                  }
                });

              }

              cleaned = true;

            }


            //////////////////////////
            ////// HANDLE AUDIO //////
            ////////////////////////// 
            if (fileType === "audio") {

              processingInstructions = platformData.audio_processing.process_types[processType];

              if (processingInstructions.keep_original === 1) { 

                await fs.unlink(fileData.original_file.file_location, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting file: ' + fileData.original_file.file_location, err);
                    return;
                  }
                });

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) { 

                    await fs.unlink(fileData[key].file_location, (err) => {
                      if (err && process.env.NODE_ENV === "development") {
                        //console.error('Error deleting file: ' + fileData[key].file_location, err);
                        return;
                      }
                    });

                  }

                }
              }

              if (fileData.waveform_file) {

                await fs.unlink(fileData.waveform_file, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting file: ' + fileData.waveform_file, err);
                    return;
                  }
                });

              }

              cleaned = true;

            }


            //////////////////////////
            ////// HANDLE IMAGE //////
            ////////////////////////// 
            if (fileType === "image") {

              processingInstructions = platformData.image_processing.process_types[processType];

              if (processingInstructions.keep_original === 1) {

                await fs.unlink(fileData.original_file.file_location, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting file: ' + fileData.original_file.file_location, err);
                    return;
                  }
                });

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) {

                    await fs.unlink(fileData[key].file_location, (err) => {
                      if (err && process.env.NODE_ENV === "development") {
                        //console.error('Error deleting file: ' + fileData[key].file_location, err);
                        return;
                      }
                    });

                  }

                }
              }

              cleaned = true;

            }


            /////////////////////////////
            ////// HANDLE DOCUMENT //////
            /////////////////////////////
            if (fileType === "document") {

              const processedFile = fileData.original_file.file_location;
              const thumbnailFile = fileData.thumb.file_location;

              await fs.unlink(processedFile, (err) => {
                if (err && process.env.NODE_ENV === "development") {
                  //console.error('Error deleting file: ' + processedFile, err);
                  return;
                }
              });

              await fs.unlink(thumbnailFile, (err) => {
                if (err && process.env.NODE_ENV === "development") {
                  //console.error('Error deleting file: ' + thumbnailFile, err);
                  return;
                }
              });

              cleaned = true;

            }


            /////////////////////////
            ////// HANDLE FILE //////
            /////////////////////////
            if (fileType === "file") {

              await fs.unlink(fileData.original_file.file_location, (err) => {
                if (err && process.env.NODE_ENV === "development") {
                  //console.error('Error deleting file: ' + fileData.original_file.file_location, err);
                  return;
                }
              });

              cleaned = true;

            }


            //////////////////////////////////////////////////////////////
            ////// DELETE TEMP FILE & DELETE PROCESSING FOLDER FILE //////
            //////////////////////////////////////////////////////////////
            if (cleaned) {

              await fs.unlink(tempFileLocation, (err) => {
                if (err && process.env.NODE_ENV === "development") {
                  //console.error('Error deleting file: ' + tempFileLocation, err);
                  return;
                }
              });

              setTimeout(() => {
                fs.rmdir(processingFolder, (err) => {
                  if (err && process.env.NODE_ENV === "development") {
                    //console.error('Error deleting folder : ' + processingFolder, err);
                    return;
                  }
                }); 
              }, 10000); 

            }


            //////////////////////////////////
            ////// DELETE DB ENTRY FILE //////
            //////////////////////////////////
            if (cleaned) {
              await tempFilesModel.deleteOne({ file_id: fileID });
            }


            cleaningDataCache.set("cleaning-data", "not-cleaning");


            if (process.env.NODE_ENV === "development") {
              //console.log('Cleaning processed file :' + fileID + ' complete');
            }

            resolve(true);

          } else {
            resolve(false);
          }

        });

      } catch (error) {

        cleaningDataCache.set("cleaning-data", "not-cleaning");

        console.error('Error processing:', error);

        resolve(false);

      }

    } else {

      if (process.env.NODE_ENV === "development") {
        console.log('Already cleaning a processed file, waiting to retry');
      }

    }

  });
}

export default deleteProcessedFiles;



