//################################################
//############### HANDLE TEST PAGE ###############
//################################################

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import { sysMsg } from '../config/systemMessages.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';
// import { processVideo } from '../functions/fileProcess/processVideo.js';
// import { processAudio } from '../functions/fileProcess/processAudio.js';
// import { processImage } from '../functions/fileProcess/processImage.js';
// import { processDocument } from '../functions/fileProcess/processDocument.js';
// import { processFile } from '../functions/fileProcess/processFile.js';
import { ensureEven } from '../functions/helpers/ensureEven.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleTest(req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0
  };
  let msg = {}

  try {

 
    resSendOk(req, res, outputResult, msg);

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

export default handleTest;