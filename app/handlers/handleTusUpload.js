//#################################################
//############### HANDLE NEW UPLOAD ###############
//#################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs/promises';
import path from 'path';

//////////////////////////////
////// FUNCTION IMPORTS //////
////////////////////////////// 
import { getPlatformData } from '../functions/getPlatformData.js';
import { getFilePrefix } from '../functions/fileProcess/getFilePrefix.js'; 
import { theEpochTime } from '../functions/helpers/theEpochTime.js'; 
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleTusUpload(event) {
  try {

    async function readJsonFile(filePath) {
      try {
        // Read the file
        const data = await fs.readFile(filePath, 'utf8');

        // Parse and return the JSON data
        return JSON.parse(data);
      } catch (error) {
        console.error('Error reading or parsing the file:', error);
        throw error; // Re-throw the error for caller handling
      }
    }

    async function renameFile(oldPath, newPath) {
      try {
        await fs.rename(oldPath, newPath);
      } catch (error) {
        console.error('Error occurred:', error);
      }
    }

    async function deleteFile(filePath) {
      try {
        await fs.unlink(filePath); 
      } catch (error) {
        console.error('Error occurred:', error);
      }
    }
    
    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////
    const pathname = event._parsedUrl.pathname;
    const theFileID = pathname.split('/').pop();
    const tempFolderPath = "/usr/app/uploads/";
    const jsonFilePath = tempFolderPath + theFileID + ".json";
    const fileJsonData = await readJsonFile(jsonFilePath);
    
    const processType = fileJsonData.processType;
    const fromPlatform = fileJsonData.fromPlatform;

    let outputResult = { "status": 0 };
    const originalFileName = fileJsonData.metadata.filename;
    const fileSize = fileJsonData.size;

    const ext = path.extname(originalFileName);   
    const fileName = theFileID + ext;

    const uploadedFile = tempFolderPath + theFileID;
    const changeUploadedFileTo = uploadedFile + ext;
    await renameFile(uploadedFile, changeUploadedFileTo); 

    deleteFile(jsonFilePath);

    if (
      isNullOrEmpty(processType)
      || isNullOrEmpty(fromPlatform)
      || isNullOrEmpty(fileName)
      || isNullOrEmpty(fileSize)
    ) {
      return null;
    }

    //#########################
    //##### CHECK REQUEST #####
    //######################### 

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platformData = await getPlatformData(fromPlatform);
    if (!platformData) {
      return null;
    } 

    //###########################
    //##### HANDLE REQUEST #####
    //###########################

    //////////////////////
    ////// Set up data //////
    //////////////////////
    let fileID = path.parse(fileName);
    fileID = fileID.name;

    const fileLocation = tempFolderPath + fileName;

    let prefix = getFilePrefix(ext);

    const currentTime = theEpochTime();
    const userIP = "n/a";
    const userAgent = "n/a";
    const fileData = {
      id: fileID,
      original_filename: originalFileName,
    };

    let uploadType;
    let logDB = false;

    //////////////////////////
    ////// Image upload //////
    //////////////////////////
    if (prefix === "i_") {

      if (platformData.image_processing.process_types[processType].max_file_size) {

        if (platformData.image_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "image";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    //////////////////////////
    ////// Video upload //////
    //////////////////////////
    if (prefix === "v_") {

      if (platformData.video_processing.process_types[processType].max_file_size) {

        if (platformData.video_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "video";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    //////////////////////////
    ////// Audio upload //////
    //////////////////////////
    if (prefix === "a_") {

      if (platformData.audio_processing.process_types[processType].max_file_size) {

        if (platformData.audio_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "audio";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    //////////////////////////
    ////// Audio upload //////
    //////////////////////////
    if (prefix === "a_") {

      if (platformData.audio_processing.process_types[processType].max_file_size) {

        if (platformData.audio_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "audio";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    /////////////////////////////
    ////// Document upload //////
    /////////////////////////////
    if (prefix === "d_") {

      if (platformData.pdf_processing.process_types[processType].max_file_size) {

        if (platformData.pdf_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "document";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    /////////////////////////
    ////// file upload //////
    /////////////////////////
    if (prefix === "f_") {

      if (platformData.file_processing.process_types[processType].max_file_size) {

        if (platformData.file_processing.process_types[processType].max_file_size > fileSize) {

          logDB = true;
          uploadType = "file";

          outputResult.status = 1;
          outputResult.file_id = fileID;
          outputResult.type = uploadType;
          outputResult.message = "FILE UPLOAD SUCCESSFUL";

        } else {
          outputResult.status = 2;
          outputResult.message = "FILE SIZE TOO LARGE";
        }

      } else {
        outputResult.status = 2;
        outputResult.message = "INVALID PROCESS TYPE";
      }
    }

    /////////////////////////
    ////// SAVE DETAILS TO DB //////
    /////////////////////////

    if (logDB) {

      tempFilesModel.create({
        platform: fromPlatform,
        file_id: fileID,
        upload_time: currentTime,
        upload_ip: userIP,
        upload_useragent: userAgent,
        file_location: fileLocation,
        file_type: uploadType,
        process_type: processType,
        user_group: 0,
        virus_scanned: 0,
        process: 0,
        file_lock: 0,
        rendered: 0,
        sent_to_warehouse: 0,
        error: 0,
        be_public: 0,
        data: fileData,
      });

    } else {

      fs.unlink(fileLocation, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return;
        }
      });

    }
 
    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleTusUpload;