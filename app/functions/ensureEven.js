
//#####################################################
//############### Ensure Number is Even ###############
//#####################################################

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function ensureEven(n) {
  if (n % 2 === 1) {
      return Math.ceil(n);
  }
  return n;
}