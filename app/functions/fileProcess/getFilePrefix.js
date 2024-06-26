//################################################
//############### CREATE UNIQUE ID ###############
//################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function getFilePrefix(ext) {

  let prefix;

  let lowerCaseExt = ext.toLowerCase();

  if (
    lowerCaseExt === ".jpg"
    || lowerCaseExt === ".jpeg"
    || lowerCaseExt === ".png"
    || lowerCaseExt === ".gif"
    || lowerCaseExt === ".webp"
  ) { prefix = "i_" }

  else if (
    lowerCaseExt === ".mp4"
    || lowerCaseExt === ".mov"
    || lowerCaseExt === ".wmv"
    || lowerCaseExt === ".avi"
  ) { prefix = "v_" }

  else if (
    lowerCaseExt === ".pdf"
  ) { prefix = "d_" }

  else if (
    lowerCaseExt === ".mp3"
    || lowerCaseExt === ".wav"
    || lowerCaseExt === ".aac"
    || lowerCaseExt === ".ogg"
    || lowerCaseExt === ".flac"
    || lowerCaseExt === ".aiff"
  ) { prefix = "a_" }

  else { prefix = "f_" }

  return prefix;

} 