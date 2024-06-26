//#####################################################
//############### Compress PDF Function ###############
//#####################################################

////////////////////////////////
////// NPM Module Imports //////
////////////////////////////////
import { exec } from 'child_process';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
function compressPDF(inputPath, outputPath, compressionLevel = 'screen') {
  return new Promise((resolve, reject) => {
    const qualitySettings = {
      screen: 'screen',
      ebook: 'ebook',
      printer: 'printer',
      prepress: 'prepress',
      default: 'default'
    };

    const quality = qualitySettings[compressionLevel] || qualitySettings['default'];

    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;
    
    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(`PDF compressed and saved at ${outputPath}`);
      }
    });
  });
}

export { compressPDF };
