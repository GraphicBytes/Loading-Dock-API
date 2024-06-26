//################################################
//############### FREE CPU THREADS ###############
//################################################

////////////////////////////
////// Config Imports //////
////////////////////////////
import { cpuInUseCache } from '../../config/cache.cjs';

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import os from 'os';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function cpuThreadsFree(req, message) {
  return new Promise((resolve) => {

    let freeCpus = cpuInUseCache.get("free_cpus");

    if (freeCpus === undefined) {

      const cpuCoreCount = os.cpus().length;
      let usableCoreCount = Math.round(cpuCoreCount / 2);
      if (usableCoreCount > 0 && usableCoreCount < 1) { usableCoreCount = 1 }
      if (usableCoreCount < 0) { usableCoreCount = 0 }

      cpuInUseCache.set("free_cpus", usableCoreCount);
      resolve(usableCoreCount);

    } else {
      resolve(freeCpus);  
    }
 
  });
}