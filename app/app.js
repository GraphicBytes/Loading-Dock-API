//####################################################
//####################################################
//#############                          #############
//#############     LOADING DOCK API     #############
//#############                          #############
//####################################################
//####################################################

//################################################
//############### CORE API MODULES ###############
//################################################ 
import express from 'express';
import cors from 'cors'; 
import cookieParser from 'cookie-parser';
import path from 'path';
import bodyParser from 'body-parser';
import { createUUID } from './functions/createUUID.js';
import { getFilePrefix } from './functions/fileProcess/getFilePrefix.js';
import { Server, EVENTS } from '@tus/server';
import { FileStore } from '@tus/file-store';

//###################################################
//############### CREATE EXPRESS APPS ###############
//###################################################
const app = express();
const uploadApp = express();

//###########################################
//############### APP OPTIONS ###############
//###########################################
app.disable('x-powered-by');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());

const corsOptions = {
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  app.locals.session_id = null;
  next();
});
app.use(express.json({ limit: '50000mb' }));

uploadApp.disable('x-powered-by');
uploadApp.use(cookieParser());
uploadApp.use(cors());

//####################################################
//############ REQUEST HANDLER IMPORTS ###############
//#################################################
import handleGetDefault from './handlers/handleGetDefault.js';
import handleTest from './handlers/handleTest.js';
import handleTriggerProcessFile from './handlers/handleTriggerProcessFile.js';
import handleTusUpload from './handlers/handleTusUpload.js'; 
 
//###########################################
//############### TUS STORAGE ###############
//###########################################
class CustomFileStore extends FileStore {
  constructor(opts) {
    super(opts); 
    this.fromPlatform = "system";
  } 

  setFromPlatform(fromPlatform) {
    this.fromPlatform = fromPlatform || "system";
  }
  
  create(...args) {   
    try { 
      if (args[0].offset === 0 && args[0].metadata && args[0].metadata.filename) {
        const filename = args[0].metadata.filename;
        const ext = path.extname(filename);
        const prefix = getFilePrefix(ext); 
        const fileID = prefix + createUUID(); 
        args[0].id = fileID; 
        args[0].processType = "default"; 
        args[0].fromPlatform = this.fromPlatform; 
      }
    } catch (error) {
      console.error('Error in custom file creation logic:', error);
    } 
    return super.create(...args);
  }
}

//##########################################
//############### TUS SERVER ###############
//##########################################
const tusServer = new Server({
  path: '/uploads',
  datastore: new CustomFileStore({ directory: './uploads' }),
  relativeLocation: true,
  respectForwardedHeaders: true
}); 
app.all('/uploads/*', async (req, res) => {
  tusServer.handle(req, res)
});

////// COMPLETE TUS FILE //////
tusServer.on(EVENTS.POST_FINISH, (event) => {   
  handleTusUpload(event);
});


//##############################################
//############### REQUEST ROUTER ###############
//##############################################

////// TEST FILE //////
app.get('/test/', (req, res) => {
  handleTest(req, res);
});

////// PROCESS FILE //////
app.post('/process-file/', (req, res) => {
  handleTriggerProcessFile(req, res);
});

/////////////////
////// END //////
/////////////////

////// 404 //////
app.use((req, res) => {
  handleGetDefault(req, res);
});

export default app; 