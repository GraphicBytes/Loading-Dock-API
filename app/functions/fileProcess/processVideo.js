//######################################################
//############### PROCESS VIDEO FUNCTION ###############
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
import { renderVideoMp4 } from './render/renderVideoMp4.js';
import { createWaveImage } from './render/createWaveImage.cjs';
import { convertToWaveFile } from './render/convertToWaveFile.js';
import { updateCpuThreadsInUse } from './updateCpuThreadsInUse.js';
import { lockFile } from './lockFile.js';
import { markError } from './markError.js';
import { cpuThreadsFree } from './cpuThreadsFree.js';
import { getVideoMeta } from './getVideoMeta.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function processVideo(fileID, publicFile = false) {

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
            let rawData = {};
            let fileMeta = obj.data;

            if (process.env.NODE_ENV === "development") {
              console.log('Video processing id:' + fileID + ' started');
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

              fs.stat(fileLocation, (err, stats) => {
                if (err) {
                  console.error('Error getting file stats:', err);
                } else {
                  fileMeta.stats = stats;
                }
              });

              let processingInstructions = platformData.video_processing.process_types[processType];
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
                  await getVideoMeta(fileLocation)
                    .then(metaData => {
                      
                      rawData.metaData = metaData;
                      rawData.duration = metaData.stream.duration;

                      fileMeta.metaData = metaData;

                      processMetaData.original = {};
                      processMetaData.original.width = metaData.stream.width;
                      processMetaData.original.height = metaData.stream.height;
                      processMetaData.original.bitrate = (metaData.stream.bit_rate / 1000).toFixed(2);
                      const [firstFPS, secondFPS] = metaData.stream.r_frame_rate.split('/');
                      processMetaData.original.frame_rate = (firstFPS / secondFPS).toFixed(3);
                      processMetaData.original_meta = metaData;

                      fileMeta.duration = metaData.stream.duration;

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
                  if (rawData.duration <= processingInstructions.max_length) {
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

                              let ogBitrate = processMetaData.original.bitrate;

                              fileMeta.original_file = {
                                file_location: originalFileFilePathDesination,
                                width: processMetaData.original.width,
                                height: processMetaData.original.height,
                                bitrate: ogBitrate,
                                frame_rate: processMetaData.original.frame_rate,
                              };

                              resolve(true);

                              if (process.env.NODE_ENV === "development") {
                                console.log('Video processing id:' + fileID + ' original complete');
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

                        const forceResolution = value.force_resolution;
                        const forceFramerate = value.force_framerate;

                        const inputFile = fileLocation;
                        const outputFile = processingFolderPath + fileID + "_" + key + ".mp4";
                        const width = value.width;
                        const height = value.height;
                        const frameRate = value.frame_rate;
                        const bitRate = value.bitrate;
                        const audioBitRate = value.audio_bitrate;

                        if (processMetaData.original.frame_rate >= frameRate || forceFramerate === 1) {

                          if ((processMetaData.original.width >= width && processMetaData.original.height >= height) || forceResolution === 1) {

                            fileMeta[key] = {
                              file_location: outputFile,
                              width: width,
                              height: height,
                              bitrate: bitRate,
                              audio_bitrate: audioBitRate,
                              frame_rate: frameRate,
                            };

                            await renderVideoMp4(inputFile, outputFile, width, height, frameRate, bitRate, audioBitRate, cpuThreadsToUse);

                          }
                        }

                      }
                    }



                    ////////////////////////////////
                    ////// GENERATE WAVE FILE //////
                    ////////////////////////////////
                    const toWavePath = processingFolderPath + fileID + "__toWaveFile.wav";
                    const waveFilePath = processingFolderPath + fileID + "__wave_file.png";
                    const waveFileWebpPath = processingFolderPath + fileID + "_" + "audio_waveform.webp";

                    const makeWaveFile = await convertToWaveFile(fileLocation, toWavePath, cpuThreadsToUse);

                    if (makeWaveFile) {
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
                      console.log('Video processing id:' + fileID + ' complete');
                    }

                    resolve(true);

                  } else {

                    await updateCpuThreadsInUse(cpuThreadsToUse, 1);

                    if (process.env.NODE_ENV === "development") {
                      console.log('Video processing id:' + fileID + ' failed, invalid file');
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
            console.error('Error processing video:', err);
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
      console.error('Error processing video:', error);

      resolve(false);

    }

  });
}

export default processVideo;