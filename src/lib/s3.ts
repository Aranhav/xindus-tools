import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const bucket = process.env.MINIO_BUCKET || "xindus-tools";

export const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export const S3_BUCKET = bucket;

/** Upload a file (Buffer or stream) to S3. */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream | Uint8Array,
  contentType?: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, bucket };
}

/** Download a file as a readable stream. */
export async function getFile(key: string) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  return res;
}

/** Delete a file. */
export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );
}

/** Check if a file exists. */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** List files under a prefix. */
export async function listFiles(prefix?: string, maxKeys = 1000) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );
  return res.Contents ?? [];
}

/** Generate a pre-signed URL for downloading (default 1 hour). */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
) {
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;

  // For presigned URLs, use the public endpoint so the browser can reach it
  const presignClient = publicEndpoint
    ? new S3Client({
        endpoint: publicEndpoint,
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || "",
          secretAccessKey: process.env.MINIO_SECRET_KEY || "",
        },
        forcePathStyle: true,
      })
    : s3;

  return getSignedUrl(
    presignClient,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}

/** Generate a pre-signed URL for uploading (default 1 hour). */
export async function getPresignedUploadUrl(
  key: string,
  contentType?: string,
  expiresIn = 3600,
) {
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;

  const presignClient = publicEndpoint
    ? new S3Client({
        endpoint: publicEndpoint,
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || "",
          secretAccessKey: process.env.MINIO_SECRET_KEY || "",
        },
        forcePathStyle: true,
      })
    : s3;

  return getSignedUrl(
    presignClient,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}
