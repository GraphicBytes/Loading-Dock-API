//#########################################################
//############### UPDATE CPU THREADS IN USE ###############
//#########################################################

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
export async function updateCpuThreadsInUse(cpusClaimed, direction=0) {

  let freeCpus = cpuInUseCache.get("free_cpus");

  let leftOver = freeCpus - cpusClaimed;
  if (direction === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log(cpusClaimed + " cpus/s taken")
    }
    leftOver = freeCpus - cpusClaimed
  } else if (direction === 1) {
    if (process.env.NODE_ENV === "development") {
      console.log(cpusClaimed + " cpu/s released")
    }
    leftOver = freeCpus + cpusClaimed
    const cpuCoreCount = os.cpus().length;
    if (leftOver > cpuCoreCount) {
      leftOver = cpuCoreCount;
    }
  }
  
  if (leftOver < 0) { leftOver = 0 }

  cpuInUseCache.set("free_cpus", leftOver);

}