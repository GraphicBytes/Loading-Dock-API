//####################################################
//############### Send Output Function ###############
//####################################################

////////////////////////////
////// THESE FUNCTION //////
////////////////////////////
export async function ok(res, send) {
  res.statusCode = 200;
  res.send(send);
  //console.log("------ send ok");
}

export async function notFound(res, send) {
  res.statusCode = 200;
  res.send(send);
  //console.log("------ send not found");
}
