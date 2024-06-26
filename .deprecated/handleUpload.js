//#################################################
//############### HANDLE NEW UPLOAD ###############
//#################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../app/models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';
import path from 'path';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../app/functions/resSend/resSendOk.js';
import { resSendNotFound } from '../app/functions/resSend/resSendNotFound.js';
import { logMalicious } from '../app/functions/malicious/logMalicious.js';
import { getPlatformData } from '../app/functions/getPlatformData.js';
import { getFilePrefix } from '../app/functions/fileProcess/getFilePrefix.js';
import { theUserIP } from '../app/functions/helpers/theUserIP.js';
import { theEpochTime } from '../app/functions/helpers/theEpochTime.js';
import { theUserAgent } from '../app/functions/helpers/theUserAgent.js';
import { isNullOrEmpty } from '../app/functions/helpers/isNullOrEmpty.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleUpload(req, res) {
  try {

    let outputResult = { "status": 0 };

    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////

    const { processType, fromPlatform } = req.params;
    const fileName = req.file.filename;
    const fileSize = req.file.size;

    if (
      isNullOrEmpty(processType)
      || isNullOrEmpty(fromPlatform)
      || isNullOrEmpty(fileName)
      || isNullOrEmpty(fileSize)
    ) {
      logMalicious(req, "INVALID FORM DATA TRYING TO UPLOAD FILE");
      resSendNotFound(req, res, outputResult);
    }

    //#########################
    //##### CHECK REQUEST #####
    //#########################

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platformData = await getPlatformData(fromPlatform);
    if (!platformData) {
      logMalicious(req, "INVALID PLATFORM DATA TRYING TO UPLOAD FILE");
      resSendNotFound(req, res, outputResult);
    }

    //###########################
    //##### HANDLE REQUEST #####
    //###########################

    //////////////////////
    ////// Set up data //////
    //////////////////////
    let fileID = path.parse(fileName);
    fileID = fileID.name;

    const tempFolderPath = "/usr/app/uploads/";
    const fileLocation = tempFolderPath + fileName;

    const ext = path.extname(fileName);
    let prefix = getFilePrefix(ext);

    const currentTime = theEpochTime();
    const userIP = theUserIP(req);
    const userAgent = theUserAgent(req);
    const fileData = { id: fileID };

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

    resSendOk(req, res, outputResult, msg);
    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleUpload;