//#####################################
//############### CACHE ###############
//#####################################

const NodeCache = require('node-cache');

const cpuInUseCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 600
});   

const platformSendingToWarehouseCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 1800
});

const cleaningDataCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 1800
}); 

module.exports = {
  cpuInUseCache,    
  platformSendingToWarehouseCache,
  cleaningDataCache, 
};