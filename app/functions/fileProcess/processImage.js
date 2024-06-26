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
import sharp from 'sharp';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { getPlatformData } from '../getPlatformData.js';
import { updateCpuThreadsInUse } from './updateCpuThreadsInUse.js';
import { lockFile } from './lockFile.js';
import { markError } from './markError.js';
import { cpuThreadsFree } from './cpuThreadsFree.js';
import { getImageMeta } from './getImageMeta.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function processImage(fileID, publicFile = false) {

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
            let rawData = {};
            let fileMeta = obj.data;

            if (process.env.NODE_ENV === "development") {
              console.log('Image processing id:' + fileID + ' started');
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

              let processingInstructions = platformData.image_processing.process_types[processType];
              let processingFolderPath = '/usr/app/processing/' + fileID + '/';
              let originalFileFilePath = processingFolderPath + fileName;
              let originalFileExtension = path.extname(originalFileFilePath);
              let originalFileFilePathDesination = processingFolderPath + fileID + "_" + "original" + originalFileExtension;

              await fs.mkdir(processingFolderPath, { recursive: true }, async (err) => {

                if (err) {
                  console.error('Failed to create directory:', err);
                  resolve(false);
                } else {

                  ///////////////////////////////
                  ////// GET RAW FILE DATA //////
                  ///////////////////////////////
                  const fileMetaData = await getImageMeta(fileLocation);
                  if (fileMetaData) {

                    rawData.width = fileMetaData.width;
                    rawData.height = fileMetaData.height;

                    processMetaData.original = {};
                    processMetaData.original.width = fileMetaData.width;
                    processMetaData.original.height = fileMetaData.height;
                    processMetaData.original.size = fileMetaData.size;
                    
                    fileMeta.original_meta = fileMetaData;
                  } 

                  //////////////////////////////////////////
                  ////// DOUBLE CHECK VALID FILE SIZE //////
                  //////////////////////////////////////////
                  let validFile = false;
                  if (rawData.width <= processingInstructions.max_width && rawData.height <= processingInstructions.max_height) {
                    validFile = true;
                  } else {
                    await markError(fileID);
                  }

                  if (validFile) {

                    //////////////////////////////
                    ////// KEEP ORIGIIONAL? //////
                    //////////////////////////////
                    async function proccessIfKeepOriginal() {
                      return new Promise((resolve) => {

                        if (processingInstructions.keep_original === 1) {

                          fs.copyFile(fileLocation, originalFileFilePathDesination, (err) => {
                            if (err) {
                              console.error('Failed to copy file id:' + fileID + ' ', err);
                              resolve(false);
                            } else {

                              processMetaData.original.fileLocation = originalFileFilePath;

                              fileMeta.original_file = {
                                file_location: originalFileFilePathDesination,
                                width: processMetaData.original.width,
                                height: processMetaData.original.height,
                              };

                              resolve(true);

                              if (process.env.NODE_ENV === "development") {
                                console.log('Image processing id:' + fileID + ' original complete');
                              }

                            }
                          });
                        } else {
                          resolve(true);
                        }

                      });
                    }
                    await proccessIfKeepOriginal();



                    ////////////////////////////////////////
                    ////// PROCESS DIFFERENT VERSIONS //////
                    ////////////////////////////////////////
                    for (let key in processingInstructions.sizes) {
                      if (processingInstructions.sizes.hasOwnProperty(key)) {

                        const value = processingInstructions.sizes[key];

                        const inputFile = fileLocation;
                        const outputFile = processingFolderPath + fileID + "_" + key + ".webp";
                        const width = value.width;
                        const height = value.height;
                        let crop = value.crop;
                        const compression = value.compression;
                        const force = value.force;

                        if (crop === "contain") {
                          crop = "inside";
                        }

                        if (rawData.width >= width || rawData.height >= height || force === 1) {

                          // convert to WebP and resize
                          await sharp(inputFile)
                            .resize(width, height, {
                              fit: crop,
                              position: 'center'
                            })
                            .webp({ quality: compression })
                            .toFile(outputFile)
                            .then(async () => {


                              await getImageMeta(outputFile)
                                .then(thisMetaData => {

                                  if (thisMetaData) {

                                    fileMeta[key] = {
                                      file_location: outputFile,
                                      width: thisMetaData.width,
                                      height: thisMetaData.height
                                    };

                                  }
                                })
                                .catch(error => {
                                  console.error('Error:', error);
                                  resolve(false);
                                });

                              if (process.env.NODE_ENV === "development") {
                                console.log('Image processing id:' + fileID + ' ' + key + ' complete');
                              }

                            })
                            .catch(err => {
                              console.error('Error converting to WebP and resizing:' + fileID + ' ', err);
                              resolve(false);
                            });

                        }

                      }
                    }


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
                      console.log('Image processing id:' + fileID + ' complete');
                    }

                    resolve(true);


                  } else {

                    await updateCpuThreadsInUse(cpuThreadsToUse, 1);

                    if (process.env.NODE_ENV === "development") {
                      console.log('Image processing id:' + fileID + ' failed, invalid file');
                    }
                    resolve(false);
                  }
                }

              });

            } else {
              if (process.env.NODE_ENV === "development") {
                console.log('Image file id:' + fileID + ' does not exist');
              }
            }

          } else {
            if (process.env.NODE_ENV === "development") {
              console.error('Error processing image:', err);
            }
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

export default processImage;