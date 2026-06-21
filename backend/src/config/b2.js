const { S3Client } = require('@aws-sdk/client-s3');

// Backblaze B2 expone una API "S3-compatible". Esto significa que
// podemos usar el SDK oficial de AWS para S3 (muy maduro y bien
// documentado) simplemente apuntando el "endpoint" a B2 en lugar
// de a AWS. No necesitamos ningun SDK propietario de Backblaze.
const b2Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,        // ej: https://s3.us-west-004.backblazeb2.com
  region: process.env.B2_REGION || 'us-west-004',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true, // requerido por la mayoria de proveedores S3-compatibles que no son AWS
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME;

module.exports = { b2Client, BUCKET_NAME };
