//############################################
//############### DEFAULT PAGE ###############
//############################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetDefault(req, res) {

  let outputResult = {
    "status": 0,
    "qry": 0
  };
  let msg = {}

  try {

    //no one should be trying to access blank domain
    logMalicious(req, "USER HIT DEFAULT PAGE");
    resSendOk(req, res, outputResult);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    resSendOk(req, res, outputResult);
    return null; 

  }
}

export default handleGetDefault;