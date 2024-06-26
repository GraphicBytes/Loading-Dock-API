//###############################################################
//############### UPDATE CPU THREADS IN USE TALLY ###############
//###############################################################

////////////////////////////////
////// Data Model Imports //////
////////////////////////////////
import { apiDataModel } from '../../models/apiDataModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { theEpochTime } from '../../functions/helpers/theEpochTime.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function updateLastCpuThreadsUseTally() {
  const filter = { meta_key: "last_cpu_threads_use_tally" };
  const update = { $set: { meta_value: theEpochTime() } };
  const opts = { upsert: true };
  await apiDataModel.collection.updateOne(filter, update, opts);
}