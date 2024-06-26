//##################################################################
//############### SEND PROCCESSED FILES TO WAREHOUSE ###############
//##################################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import { platformSendingToWarehouseCache } from '../../config/cache.cjs';

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';
import path from 'path';
import axios from 'axios';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { encrypt } from '../../functions/crypt/encrypt.js';
import { getPlatformData } from '../../functions/getPlatformData.js';
import { lockFile } from '../../functions/fileProcess/lockFile.js';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
export async function bankFilesToWarehouse() { 

  const warehouseUrl = process.env.DEFAULT_WAREHOUSE_URL + "/new-file/";
  const networkPassPhrase = encrypt(process.env.NETWORK_SUPER_USER_PASSPHRASE, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

  return new Promise((resolve) => {

    let sendingData = platformSendingToWarehouseCache.get("sending-data-to-warehouse");

    if (sendingData !== "sending") {

      try {

        tempFilesModel.findOne({ file_lock: 0, virus_scanned: 1, rendered: 1, sent_to_warehouse: 0, error: 0 }, async function (err, obj) {

          if (obj) {

            platformSendingToWarehouseCache.set("sending-data-to-warehouse", "sending");

            let filePlatform = obj.platform;
            let fileID = obj.file_id;
            let fileUploadTime = obj.upload_time;
            let fileUploadIP = obj.upload_ip;
            let fileUploadUseragent = obj.upload_useragent;
            let fileType = obj.file_type;
            let processType = obj.process_type;
            let fileUserGroup = obj.user_group;
            let fileData = obj.data;
            let bePublic = obj.be_public;

            await lockFile(fileID);

            if (process.env.NODE_ENV === "development") {
              console.log('File Saving to warehouse id:' + fileID + ' started');
            }

            let platformData = await getPlatformData(filePlatform);
            let processingInstructions

            let filePaths = []
            let thefilesData = {}
            let fileMeta = {}

            let i = 0;

            let doPostData = false;

            //////////////////////////
            ////// HANDLE VIDEO //////
            //////////////////////////
            if (fileType === "video") {

              processingInstructions = platformData.video_processing.process_types[processType];
              
              fileMeta.metaData = fileData;
              fileMeta.duration = fileData.duration;

              if (processingInstructions.keep_original === 1) {

                filePaths[i] = fileData.original_file.file_location;
                thefilesData[i] = {};
                thefilesData[i].type = "original";
                thefilesData[i].size = "Original"
                thefilesData[i].file_name = path.basename(fileData.original_file.file_location);
                thefilesData[i].width = fileData.original_file.width;
                thefilesData[i].height = fileData.original_file.height;
                thefilesData[i].bitrate = fileData.original_file.bitrate;
                thefilesData[i].frame_rate = fileData.original_file.frame_rate;
                thefilesData[i].frame_rate = fileData.original_file.frame_rate;

                i++;

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) {

                    filePaths[i] = fileData[key].file_location;
                    thefilesData[i] = {};
                    thefilesData[i].type = key;
                    thefilesData[i].size = processingInstructions.sizes[key].name;
                    thefilesData[i].file_name = path.basename(fileData[key].file_location);
                    thefilesData[i].width = fileData[key].width;
                    thefilesData[i].height = fileData[key].height;
                    thefilesData[i].bitrate = fileData[key].bitrate;
                    thefilesData[i].frame_rate = fileData[key].frame_rate;

                    i++;

                  }

                }
              }
              if (fileData.waveform_file) {
                filePaths[i] = fileData.waveform_file;
              }              
              doPostData = true;
            }


            //////////////////////////
            ////// HANDLE AUDIO //////
            ////////////////////////// 
            if (fileType === "audio") {

              processingInstructions = platformData.audio_processing.process_types[processType];

              fileMeta.metaData = fileData;
              fileMeta.duration = fileData.duration;

              if (processingInstructions.keep_original === 1) {

                filePaths[i] = fileData.original_file.file_location;
                thefilesData[i] = {};
                thefilesData[i].type = "original";
                thefilesData[i].size = "Original";
                thefilesData[i].file_name = path.basename(fileData.original_file.file_location);

                i++;

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) {

                    filePaths[i] = fileData[key].file_location;
                    thefilesData[i] = {};
                    thefilesData[i].type = key;
                    thefilesData[i].size = processingInstructions.sizes[key].name;
                    thefilesData[i].file_name = path.basename(fileData[key].file_location);
                    thefilesData[i].bitrate = fileData[key].bitrate;

                    i++;

                  }

                }
              }
              if (fileData.waveform_file) {
                filePaths[i] = fileData.waveform_file;
              }  
              doPostData = true;

            }


            //////////////////////////
            ////// HANDLE IMAGE //////
            ////////////////////////// 
            if (fileType === "image") {

              processingInstructions = platformData.image_processing.process_types[processType];

              fileMeta.metaData = fileData;

              if (processingInstructions.keep_original === 1) {

                filePaths[i] = fileData.original_file.file_location;
                thefilesData[i] = {};
                thefilesData[i].type = "original";
                thefilesData[i].size = "Original";
                thefilesData[i].file_name = path.basename(fileData.original_file.file_location);
                thefilesData[i].width = fileData.original_file.width;
                thefilesData[i].height = fileData.original_file.height;

                i++;

              }

              for (let key in processingInstructions.sizes) {
                if (processingInstructions.sizes.hasOwnProperty(key)) {

                  if (fileData[key]) {

                    filePaths[i] = fileData[key].file_location;
                    thefilesData[i] = {};
                    thefilesData[i].type = key;
                    thefilesData[i].size = processingInstructions.sizes[key].name;
                    thefilesData[i].file_name = path.basename(fileData[key].file_location);
                    thefilesData[i].width = fileData[key].width;
                    thefilesData[i].height = fileData[key].height;

                    i++;

                  }

                }
              }

              doPostData = true;

            }


            /////////////////////////////
            ////// HANDLE DOCUMENT //////
            /////////////////////////////
            if (fileType === "document") {

              processingInstructions = platformData.pdf_processing.process_types[processType];

              fileMeta.metaData = fileData;

              if (processingInstructions.keep_original === 1) {

                filePaths[i] = fileData.original_file.file_location;
                thefilesData[i] = {};
                thefilesData[i].type = "original";
                thefilesData[i].size = "Original";
                thefilesData[i].file_name = path.basename(fileData.original_file.file_location);

                i++;

              }

              if (processingInstructions.generate_thumbnail === 1) {

                filePaths[i] = fileData.thumb.file_location;
                thefilesData[i] = {};
                thefilesData[i].type = "thumb";
                thefilesData[i].file_name = path.basename(fileData.original_file.file_location);
                thefilesData[i].width = fileData.thumb.width;
                thefilesData[i].height = fileData.thumb.height;

              }

              doPostData = true;

            }


            /////////////////////////
            ////// HANDLE FILE //////
            /////////////////////////
            if (fileType === "file") {

              processingInstructions = platformData.file_processing.process_types[processType];

              fileMeta.metaData = fileData;

              filePaths[i] = fileData.original_file.file_location;
              thefilesData[i] = {};
              thefilesData[i].type = "original";
              thefilesData[i].size = "Original";
              thefilesData[i].file_name = path.basename(fileData.original_file.file_location);

              i++;

              doPostData = true;

            }







            if (doPostData) {

              let postData = {
                networkPassPhrase: networkPassPhrase,
                filePlatform: filePlatform,
                fileID: fileID,
                fileUploadTime: fileUploadTime,
                fileUploadIP: fileUploadIP,
                fileUploadUseragent: fileUploadUseragent,
                fileType: fileType,
                fileUserGroup: fileUserGroup,
                bePublic: bePublic,
                fileData: thefilesData,
                fileMeta: fileMeta,
              };

              const formData = new FormData();

              Object.entries(postData).forEach(([key, value]) => {

                if (typeof value === 'object') {
                  formData.append(key, JSON.stringify(value));
                } else {
                  formData.append(key, value);
                }

              });

              for (let index = 0; index < filePaths.length; index++) {
                try {
                  const filePath = filePaths[index];
                  const fileStream = fs.createReadStream(filePath);
                  const fileName = path.basename(filePath);

                  let thisFileData = [];

                  // Read the file stream and accumulate the data
                  for await (const chunk of fileStream) {
                    thisFileData.push(chunk);
                  }

                  // Create a Blob object from the accumulated data
                  const blob = new Blob(thisFileData, { type: 'video/mp4' });

                  // Append the Blob object to the FormData
                  formData.append(`file_${index + 1}`, blob, fileName);
                } catch (error) {
                  console.error('Error reading or creating Blob for file:', filePath, error);
                }
              }

              // Configuring axios with credentials
              const axiosInstance = axios.create({
                withCredentials: true,
                credentials: 'include',
              });

              //console.log(formData);

              // Sending the POST request
              async function sendPostRequest() {
                try {
                  const response = await axiosInstance.post(warehouseUrl, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      ...axiosInstance.defaults.headers.common,
                    },
                  });

                  ///////////////////////
                  ////// FINISH UP //////
                  /////////////////////// 

                  if (response.data.status === 1) {

                    let finishedFilter = { file_id: fileID };
                    let finishedUpdate = { $set: { sent_to_warehouse: 1 } };
                    let finishedOpts = { upsert: true };
                    tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

                    if (process.env.NODE_ENV === "development") {
                      console.log('File Saving to warehouse id:' + fileID + ' complete');
                    }

                  } else {

                    let finishedFilter = { file_id: fileID };
                    let finishedUpdate = { $set: { file_lock: 0 } };
                    let finishedOpts = { upsert: true };
                    tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

                    if (process.env.NODE_ENV === "development") {
                      console.log('File Saving to warehouse id:' + fileID + ' failed');
                    }

                  }




                } catch (error) {
                  //console.error('Error:', error);
                }
              }
              await sendPostRequest();


              platformSendingToWarehouseCache.set("sending-data-to-warehouse", "not-sending");

              resolve(true);

            } else {

              let finishedFilter = { file_id: fileID };
              let finishedUpdate = { $set: { file_lock: 0 } };
              let finishedOpts = { upsert: true };
              tempFilesModel.collection.updateOne(finishedFilter, finishedUpdate, finishedOpts);

              if (process.env.NODE_ENV === "development") {
                console.log('File Saving to warehouse id:' + fileID + ' failed');
              }

              platformSendingToWarehouseCache.set("sending-data-to-warehouse", "not-sending");

              console.error('Error sending file');
              resolve(false);

            } 

          } else {
            resolve(false);
          }

        });


      } catch (error) {
        
        platformSendingToWarehouseCache.set("sending-data-to-warehouse", "not-sending");

        console.error('Error processing:', error);

        resolve(false);

      }

    } else {

      if (process.env.NODE_ENV === "development") {
        console.log('Already sending data to warehouse, waiting to retry');
      }

    }


  });
}

export default bankFilesToWarehouse;

