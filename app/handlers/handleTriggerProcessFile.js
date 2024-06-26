//###################################################
//############### HANDLE PROCESS FILE ###############
//###################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../config/systemMessages.js';

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../models/tempFilesModel.js';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import axios from 'axios';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';
import { encrypt } from '../functions/crypt/encrypt.js';
import { decrypt } from '../functions/crypt/decrypt.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleTriggerProcessFile(req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0
  };
  let msg = {}

  try {

    if (process.env.NODE_ENV === "development") {
      console.log("File process triggered");
    }

    //##########################
    //##### SUBMITTED DATA #####
    //##########################

    //////////////////////
    ////// CHECK SUBMITTED DATA //////
    //////////////////////
    if (isNullOrEmpty(req.body.networkPassPhrase)) {
      msg[2] = sysMsg[2];
      logMalicious(req, "2");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    if (isNullOrEmpty(req.body.filePlatform)) {
      msg[1] = sysMsg[1];
      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    if (isNullOrEmpty(req.body.fileID)) {
      msg[3] = sysMsg[3];
      logMalicious(req, "3");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    if (isNullOrEmpty(req.body.fileUserGroup)) {
      msg[4] = sysMsg[4];
      logMalicious(req, "4");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    const networkPassPhraseCrypted = req.body.networkPassPhrase;
    const filePlatform = req.body.filePlatform;
    const fileID = req.body.fileID;
    const fileUserGroup = req.body.fileUserGroup;

    //////////////////////
    ////// CHECK NETWORK PASS PHRASE //////
    //////////////////////
    const networkPassPhrase = decrypt(networkPassPhraseCrypted, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);
    if (networkPassPhrase !== process.env.NETWORK_SUPER_USER_PASSPHRASE) {
      msg[5] = sysMsg[5];
      logMalicious(req, "5");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// CHECK PLATFORM //////
    //////////////////////
    let platformData = await getPlatformData(filePlatform);
    if (!platformData) {
      msg[1] = sysMsg[1];
      logMalicious(req, "1");
      resSendOk(req, res, outputResult, msg);
      return null;
    }

    //////////////////////
    ////// Handle Request //////
    //////////////////////
    const warehouseUrl = process.env.DEFAULT_WAREHOUSE_URL + "/new-file-processing";
    let bePublic = 0;
    if (req.body.bePublic === 1 || req.body.bePublic === "1") {
      bePublic = 1;
    }

    await tempFilesModel.findOne({ file_id: fileID }, async function (err, obj) {
      if (obj) {

        const newNetworkPassPhrase = encrypt(process.env.NETWORK_SUPER_USER_PASSPHRASE, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

        const postData = {
          networkPassPhrase: newNetworkPassPhrase,
          filePlatform: filePlatform,
          fileID: fileID,
          fileUserGroup: fileUserGroup,
          bePublic: bePublic
        };

        const processType = isNullOrEmpty(req.body.processType) ? 'default' : req.body.processType;

        await tempFilesModel.collection.updateOne(
          { file_id: fileID },
          { $set: { platform: filePlatform } },
          { upsert: true });

        await tempFilesModel.collection.updateOne(
          { file_id: fileID },
          { $set: { process_type: processType } },
          { upsert: true });

        const axiosInstance = axios.create({
          withCredentials: true,
          credentials: 'include',
        });

        const warehouseResponse = await axiosInstance.post(warehouseUrl, postData, {
          headers: {
            'Content-Type': 'application/json',
            ...axiosInstance.defaults.headers.common,
          },
        });

        if (warehouseResponse.data.qry === 1) {

          let filter = { file_id: fileID };
          let update = {
            $set: {
              user_group: fileUserGroup,
              process: 1,
              be_public: bePublic
            }
          };
          let opts = { upsert: true };
          await tempFilesModel.collection.updateOne(filter, update, opts);

          outputResult['status'] = 1;
          outputResult['qry'] = 1;
          msg[6] = "FILE " + fileID + " PROCESSING STARTED";

          resSendOk(req, res, outputResult, msg);
          return null;

        } else {

          msg[7] = sysMsg[7];
          resSendOk(req, res, outputResult, msg);
          return null;

        }

      } else {

        msg[8] = sysMsg[8];
        resSendOk(req, res, outputResult, msg);
        return null;

      }
    });

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    msg[0] = sysMsg[0];
    resSendOk(req, res, outputResult, msg);

    return null;
  }
}

export default handleTriggerProcessFile;