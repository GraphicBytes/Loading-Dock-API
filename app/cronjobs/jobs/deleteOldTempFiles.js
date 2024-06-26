//#########################################################
//############### DELETE TEMP FILES FROM DB ###############
//#########################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import fs from 'fs';
import path from 'path';

///////////////////////////
////// THIS CRON JOB //////
///////////////////////////
export async function deleteOldTempFiles() {

  return new Promise((resolve) => {
    try {

      const directoryPath = '/usr/app/temp';
      const directoryPath2 = '/usr/app/temp2';
      const now = new Date().getTime();

      const maxAge = 6 * 60 * 60 * 1000;  // 6 hours

      fs.readdir(directoryPath, (err, files) => {
        if (err) {
          //resolve(null);
          return;
        }

        files.forEach(file => {
          let filePath = path.join(directoryPath, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              //resolve(null);
              return;
            }

            if (now - new Date(stats.mtime).getTime() > maxAge) {
              // File is older than 6 hours
              fs.unlink(filePath, (err) => {
                if (err) {
                  //resolve(null);
                } else {
                  //resolve(null);
                }
              });
            }
          });
        });
      });


      fs.readdir(directoryPath2, (err, files) => {
        if (err) {
          //resolve(null);
          return;
        }

        files.forEach(file => {
          let filePath = path.join(directoryPath2, file);
          fs.stat(filePath, (err, stats) => {
            if (err) {
              //resolve(null);
              return;
            }

            if (now - new Date(stats.mtime).getTime() > maxAge) {
              // File is older than 6 hours
              fs.unlink(filePath, (err) => {
                if (err) {
                  //resolve(null);
                } else {
                  //resolve(null);
                }
              });
            }
          });
        });
      });

    } catch (error) {
      //resolve(false);
    }

    resolve(false);

  });
}

export default deleteOldTempFiles;



