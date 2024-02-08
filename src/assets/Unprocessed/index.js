
const { GetObjectCommand, S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require('uuid');



async function uploadToS3AndGeneratePresignedUrl(data) {
  const s3Client = new S3Client({ region: "ca-central-1" });
  const bucketName = 'gardenglobal';
  const objectKey = `requestCache/oversized/${uuidv4()}.json`;
  
  // Upload the data to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: JSON.stringify(data),
    ContentType: 'application/json'
  }));

  // Generate a pre-signed URL for the uploaded object
  const presignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  }), { expiresIn: 3600 }); // Link expires in 1 hour

  return presignedUrl;
}

async function uploadPublicJsonToS3(data) {
  const s3Client = new S3Client({ region: "ca-central-1" });
  const bucketName = 'gardenglobal';
  const objectKey = `requestCache/oversized/${uuidv4()}.json`;

  // Upload the data to S3 with public read access
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
    ACL: 'public-read'
  }));

  // Generate the public URL 38.5 37 37.5
  const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;
  return publicUrl;
}
exports.returnMsg = async function(code, msg, msgData = null){

  const payloadSizeBytes = JSON.stringify(msgData).length;

  if (payloadSizeBytes > 5 * 1024 * 1024) { 
    let url = await uploadToS3AndGeneratePresignedUrl(msgData);
    return {
      statusCode: 202,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        'Access-Control-Max-Age': 86400,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: msg,
        data: url
      }),
    };
  } else {
    return {
      statusCode: code,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        'Access-Control-Max-Age': 86400,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: msg,
        data: msgData
      }),
    };
  }
}

  

