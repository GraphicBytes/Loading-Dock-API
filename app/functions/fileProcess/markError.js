//##########################################
//############### MARK ERROR ###############
//##########################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { tempFilesModel } from '../../models/tempFilesModel.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function markError(fileID) {
  const filter = { file_id: fileID };
  const update = { $set: { file_lock: 0, error: 1 } };
  const opts = { upsert: true };
  await tempFilesModel.collection.updateOne(filter, update, opts);
}
