//######################################################
//############### PROCESS AUDIO FUNCTION ###############
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
import { renderAudio } from './render/renderAudio.js';
import { createWaveImage } from './render/createWaveImage.cjs';
import { convertToWaveFile } from './render/convertToWaveFile.js';
import { updateCpuThreadsInUse } from './updateCpuThreadsInUse.js';
import { lockFile } from './lockFile.js';
import { markError } from './markError.js';
import { cpuThreadsFree } from './cpuThreadsFree.js';
import { getAudioMeta } from './getAudioMeta.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function processAudio(fileID, publicFile = false) {

  let cpuThreadsToUse = await cpuThreadsFree();

  return new Promise((resolve) => {

    try {

      if (cpuThreadsToUse > 0) {

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
              console.log('Audio processing id:' + fileID + ' started');
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

              let processingInstructions = platformData.audio_processing.process_types[processType];
              let processingFolderPath = '/usr/app/processing/' + fileID + '/';
              let originalFileFilePath = processingFolderPath + fileName;
              let originalFileExtension = path.extname(originalFileFilePath);
              let originalFileFilePathDesination = processingFolderPath + fileID + "_" + "original" + originalFileExtension;

              fs.mkdir(processingFolderPath, { recursive: true }, async (err) => {
                if (err) {
                  console.error('Failed to create directory:', err);
                  resolve(false);
                } else {

                  ///////////////////////////////
                  ////// GET RAW FILE DATA //////
                  ///////////////////////////////
                  await getAudioMeta(fileLocation)
                    .then(metaData => {

                      fileMeta.duration = metaData.metadata.format.duration;
                      fileMeta.original_meta = metaData.metadata;

                      // if (metaData?.metadata?.format?.tags !== undefined) {
                      //   fileMeta.tags = metaData.metadata.format.tags;
                      // } else {
                      //   fileMeta.tags = {};
                      // }

                      resolve(true);

                    })
                    .catch(error => {
                      console.error('Error:', error);
                      resolve(false);
                    });


                  ////////////////////////////////////////////
                  ////// DOUBLE CHECK VALID FILE LENGTH //////
                  ////////////////////////////////////////////
                  let validFile = false;
                  if (fileMeta.duration <= processingInstructions.max_length) {
                    validFile = true;
                  } else {
                    await markError(fileID);
                  }

                  if (validFile) {


                    /////////////////////////////////
                    ////// KEEP ORIGINAL FILE? //////
                    /////////////////////////////////
                    async function proccessIfKeepOriginal() {
                      return new Promise((resolve) => {

                        if (processingInstructions.keep_original === 1) {

                          fs.copyFile(fileLocation, originalFileFilePathDesination, (err) => {
                            if (err) {
                              console.error('Failed to copy file id:' + fileID + ' ', err);
                              resolve(false);
                            } else {

                              fileMeta.original_file = {
                                file_location: originalFileFilePathDesination
                              };

                              if (process.env.NODE_ENV === "development") {
                                console.log('Audio processing original copied');
                              }

                              resolve(true);

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

                    let rawFileBitrate = Math.round(parseInt(processMetaData.original_meta.streams[0].bit_rate) / 1000);

                    for (let key in processingInstructions.sizes) {
                      if (processingInstructions.sizes.hasOwnProperty(key)) {

                        const value = processingInstructions.sizes[key];

                        const inputFile = fileLocation;
                        const outputFile = processingFolderPath + fileID + "_" + key + ".mp3";
                        const bitRate = value.bitrate;
                        const forceBitrate = value.force_bitrate;

                        if (rawFileBitrate >= bitRate || forceBitrate === 1) {

                          fileMeta[key] = {
                            file_location: outputFile,
                            bitrate: bitRate
                          };

                          await renderAudio(inputFile, outputFile, bitRate);

                        }

                      }
                    }


                    ////////////////////////////////
                    ////// GENERATE WAVE FILE //////
                    ////////////////////////////////
                    const toWavePath = processingFolderPath + fileID + "__toWaveFile.wav";
                    const waveFilePath = processingFolderPath + fileID + "__wave_file.png";
                    const waveFileWebpPath = processingFolderPath + fileID + "_" + "audio_waveform.webp";

                    await convertToWaveFile(fileLocation, toWavePath, cpuThreadsToUse);

                    const waveFileBackgroundColour = processingInstructions.wave_file_theme.background;
                    const waveFileWaveColour = processingInstructions.wave_file_theme.waveform_color;

                    await createWaveImage(toWavePath, waveFilePath, waveFileWebpPath, waveFileBackgroundColour, waveFileWaveColour);

                    fileMeta.waveform_file = waveFileWebpPath;

                    fs.unlink(toWavePath, (err) => {
                      if (err) {
                        console.error('Error deleting file:', err);
                        return;
                      }
                    });


                    ///////////////////////
                    ////// FINISH UP //////
                    ///////////////////////
                    let finishedFilter = { file_id: fileID };
                    let finishedUpdate = { $set: { file_lock: 0, rendered: 1, data: fileMeta } };
                    let finishedOpts = { upsert: true };
                    tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

                    await updateCpuThreadsInUse(cpuThreadsToUse, 1); 

                    if (process.env.NODE_ENV === "development") {
                      console.log('Audio processing id:' + fileID + ' complete');
                    }


                    resolve(true);

                  } else {

                    await updateCpuThreadsInUse(cpuThreadsToUse, 1); 

                    if (process.env.NODE_ENV === "development") {
                      console.log('Audio processing id:' + fileID + ' failed, invalid file');
                    }
                    resolve(false);
                  }

                }
              });

            } else {
              if (process.env.NODE_ENV === "development") {
                console.log('Video file id:' + fileID + ' does not exist');
              }
            }

          } else {
            if (process.env.NODE_ENV === "development") {
              console.error('Error processing audio:', err);
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
      console.error('Error processing audio:', error);

      resolve(false);

    }

  });
}

export default processAudio;