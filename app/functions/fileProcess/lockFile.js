//#########################################
//############### LOCK FILE ###############
//#########################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function lockFile(fileID) {
  const filter = { file_id: fileID };
  const update = { $set: { file_lock: 1 } };
  const opts = { upsert: true };
  await tempFilesModel.collection.updateOne(filter, update, opts);
}