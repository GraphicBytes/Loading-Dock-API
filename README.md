# CLOUD LOADING DOCK API #

**VERSION**

  - 1.0.0 alpha

**AUTHORS**

  - Darren Morley

**CONTRIBUTING DEVELOPERS**

  - n/a

## ABOUT

Loading Dock is a REST-ful API/Microservice.

Car Park is responsible for handling the following areas of functionality

- File upload handling
- Anti-Virus scanning
- Image rendering and compression
- Video rendering and compression
- PDF thumbnail generation
- Audio rendering and compression

## MAIN REPO BRANCHES

This API follows a development -> staging -> production flow focused on the following git repo branches

**Main**

Latest beta testing build *(All development work should be done on this branch, or forked and re-merged with this branch before moving onto staging.)* 

**Staging**

Latest alpha testing build

**Production**

Latest production build

### API URLS

**Development:** [loading-dock-api.development.uk](https://loading-dock-api.development.uk)

**Staging:** [loading-dock-api.staging.uk](https://loading-dock-api.staging.uk)

**Production:** [loading-dock.cloud.com](https://loading-dock.cloud.com) & [loading-dock.brightcloud.uk.com](https://loading-dock.brightcloud.uk.com)

### DATABASE ADMIN URLS

**Development:** [loading-dock-api.dev-data.uk](https://loading-dock-api.dev-data.uk)

**Staging:** [loading-dock-api.staging-data.uk](https://loading-dock-api.staging-data.uk)

**Production:** [loading-dock-api.data.uk](https://loading-dock-api.data.uk)

## DOCKER STACK

`Node.js FROM node:20.11.1-slim`

`MongoDB FROM mongo:7.0.5`

`mongo-express FROM mongo-express:1.0.2-20`

`clamAV FROM debian:buster-slim`

## DOCKER PORTS ASSIGNED
- **3310** - Clamav
- **5103** - API
- **6103** - Database
- **7103** - Database Admin

## NODE.JS DEPENDENCIES

`@tus/file-store ^1.0.1`

`@tus/server "^1.0.1`

`axios ^1.4.0`

`bcrypt ^5.0.1`

`clamscan ^2.1.2`

`cookie-parser ^1.4.6`

`cors ^2.8.5`

`ejs ^3.1.9`

`execa ^7.1.1`

`exif-parser ^0.1.12`

`express ^4.16.4`

`ffmpeg-static ^4.4.0`

`fluent-ffmpeg ^2.1.2`

`mime-types ^2.1.35`

`mongoose ^5.4.10`

`multer ^1.4.5-lts.1`

`node-cache ^5.1.2`

`pdf-thumbnail ^1.0.6`

`pngjs ^7.0.0`

`sharp ^0.32.2`

`wavefile ^11.0.0`

## SCALE EXPECTATIONS

**OPTIMAL PERFORMANCE**

For optimal performance the API is intended to launch as a cluster, ideally 1 cluster fork per CPU thread.

### Short Term/Early Lifespan

Expecting:

- Data Storage Needs - **Light**
- CPU Needs - **Moderate**
- Memory Needs - **Moderate**
- hosting solution needed - **Shared hosting via docker.**

Minimum requirements:

- 4 CPU THREADS
- 8 GB RAM
- 40 GB SSD-SPEED STORAGE

### Long Term/Heavy Load

For long term or high traffic usage, this API will require dedicated hosting resources. 

- *Data Storage Needs* - **Light,** This API will be unlikely to consume large amounts of storage.
- *CPU Needs* -  **Heavy,** The main duties of ths API has the potential to occupy hight amounts of CPU for prolonged periods of time.
- *Memory Needs* -  **Moderate,**, The main duties of ths API will benefit greatly with more system memory, allowing for faster render times.

Minimum requirements:

- 8+ CPU THREADS
- 64+ GB RAM
- 120+ GB (or more) SSD-SPEED STORAGE 


## DEPLOYMENT

This API is launched via Docker containerization using a `docker-compose.yml` file. Environment files are used to separate deployment environments. The main ENV files and CLI commands are:

*note: Please use the "tools.sh" shell script instead of these commands, see below*

`docker-compose --env-file ./env/dev.env up`

`docker-compose --env-file ./env/stage.env up`

`docker-compose --env-file ./env/production.env up`

## TOOLS SCRIPT

**This repo contains a shell script to help manage this repo and docker container**

`sh tools.sh`

This shell script will give you 12 options

`1. Cancel/Close`

`2. Pull changes`

This option will pull the latest updates for the current git branch

`3. Start/Reboot docker container with dev.env`

This will boot up the API in development mode for beta testing

`4. Start/Reboot docker container with stage.env`

This will boot up the API in staging mode for alpha testing

`5. Start/Reboot docker container with production.env`

This will boot up the API in production mode

`6. View console log output`

This will show the live docker logs output, useful for debugging but are disabled in production mode.

`7. Git push changes to current branch`

This will push changes to the current branch while also offering an option to leave comment.

`8. Git merge Main to Staging`

This will merge the current Main branch into Staging when ready for Alpha testing

`9. Git merge Staging to Production`

This will merge the current Staging branch into Production

`10. Checkout Main branch`

This will switch to the Main branch

`11. Checkout Staging branch`

This will switch to the Staging branch

`12. Checkout Production branch`

This will switch to the Production branch

## MAIN REST-FUL API RESPONSE ###

Every request made to the server, good or bad, will return a JSON object. Every request will contain 2 core child objects alongside the individual  handler return data.

`qry: 1:0 `

**0:** request failed

**1:** request accepted

`msg:{} `

*msg* will return as an empty object unless the backend needs to communicate an error or warning to the front end. Which will be structured as follows

`{ (int)code : (string)"message", (int)code : (string)"message", (int)code : (string)"message" }`

Error and Warning codes are detailed per api end-point bellow.

## END POINTS AND USAGE ###

### SYSTEM END POINTS

**Process file**

`POST /process-file/ RETURNS json`

This is an end point for the other APIs to instruct Loading Dock to render a file and send to the Warehouse API for permanent storage.

*FORM DATA*:

`networkPassPhrase(string)` *encrypted with primary encryption key*

`filePlatform(string)`

`filePlatform(fileID)`

`filePlatform(fileUserGroup)` *group id*

*ERRORS*:

`0: unknown error`

`1: Missing or invalid platform id`

`2: Missing formData 'networkPassPhrase'`

`3: Missing formData 'fileID'`

`4: Missing formData 'fileUserGroup'`

`5: Cannot decrypt 'networkPassPhrase'`

`6: Processing file started`

`7: Error, unable to reach Warehouse API`

`8: Error, file ID not found`

### FILE UPLOADING

**Process file**

`TUS /upload-chunk/:processType/:fromPlatform/ RETURNS json` - deprecated 12/04/24

`TUS /upload/:processType/:fromPlatform/ RETURNS json`

*TUS/FORM DATA*:

`file(TUS)`

*ERRORS*:

Handled by tus

### MESSAGE RESPONSE MASTER LIST

`0: unknown error`

`1: Missing or invalid platform id`

`2: Missing formData 'networkPassPhrase'`

`3: Missing formData 'fileID'`

`4: Missing formData 'fileUserGroup'`

`5: Cannot decrypt 'networkPassPhrase'`

`6: Processing file started`

`7: Error, unable to reach Warehouse API`

`8: Error, file ID not found`

## Change Log

### v1.0.0
- Launch with core functionality for core user functions, auth, login, session management as to original spec agreed.
