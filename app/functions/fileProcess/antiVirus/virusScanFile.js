//###############################################
//############### VIRUS SCAN FILE ###############
//###############################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import NodeClam from 'clamscan';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export const virusScanFile = async (filePath) => { 
  
  try {
    const ClamScan = new NodeClam();
    const clamscan = await ClamScan.init({
      clamdscan: {
        host: 'clamav',
        port: 3310,
      },
    });
    
    return await new Promise((resolve) => {

      const timeoutDuration = 10000; 
      const timeoutId = setTimeout(() => {
        console.error('Scan timeout exceeded');
        resolve("scan-failed");
      }, timeoutDuration);

      clamscan.scanFile(filePath, (err, file, isInfected) => { 
        clearTimeout(timeoutId);
        if (err) {
          console.error(err);
          resolve("scan-failed");
        } else { 
          resolve(isInfected ? isInfected.isInfected : false);
        }
      });
    });

  } catch (error) {
    console.error(error.message);
    return "scan-failed";
  }
};

export default virusScanFile;

