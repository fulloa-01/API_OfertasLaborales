// server/src/config/s3Config.js
const AWS = require('aws-sdk');

AWS.config.update({
    region: process.env.AWS_REGION,
    credentials: new AWS.Credentials(
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY
    )
});

const s3 = new AWS.S3();
module.exports = s3;
