//#######################################################
//############### TEMP UPLOADS DATA MODEL ###############
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
const tempFilesSchema = new Schema({
  platform: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  file_id: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  upload_time: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  upload_ip: {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  upload_useragent : {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  file_location: {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  file_type: {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  process_type: {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  user_group: {
    type: String, 
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  virus_scanned: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  process: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  file_lock: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  rendered: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  sent_to_warehouse: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  error: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  be_public: {
    type: Number, 
    required: [true, ''],
    validate: {
      validator: function (value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  data: { type: Object },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const tempFilesModel = mongoose.model('temp_files', tempFilesSchema);

export { tempFilesModel };