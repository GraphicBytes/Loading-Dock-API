//#######################################################
//############### ACTIVITY LOG DATA MODEL ###############
//#######################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mongoose from 'mongoose';

/////////////////////////////////
////// Connect to Mongoose //////
/////////////////////////////////
mongoose.connect(
  "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@mongodb:27017/" + process.env.DB_DATABASE + "?authSource=admin",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
    } else {
      //console.log('CONNECTED TO MONGODB');
    }
  }
);

/////////////////////////////
////// Mongoose Schema //////
/////////////////////////////
const Schema = mongoose.Schema;
const activityLogModelSchema = new Schema({
  user_id: { type: String, index: true },
  platform: { type: String, index: true },
  user_ip: { type: String },
  user_agent: { type: String },
  log_event: { type: String },
  log_time: { type: String }
});

//////////////////////////
////// Model Export //////
//////////////////////////
const activityLogModel = mongoose.model('activity_logs', activityLogModelSchema);

export { activityLogModel };