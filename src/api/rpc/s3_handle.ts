import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
 import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { randomBytes } from "crypto";
 const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export function nanoid(size = 21) {
  let id = '';
  const bytes = randomBytes(size); // Node.js specific method
  
  for (let i = 0; i < size; i++) {
    id += urlAlphabet[bytes[i] & 63];
  }
  
  return id;
}
// createPresignedPost
const S3 = new S3Client({
  region: "auto", // Required by SDK but not used by R2
  endpoint: `https://s3.cloudfly.vn`,
  credentials: {
    // accessKeyId: "Q3AM3UQ867SPQQA43P2F",
    // secretAccessKey: "Ik7nlCaUUCFOKDJAeSgFcbF5MEBGh9sVGBUrsUOp",
    accessKeyId: "BD707P5W8J5DHFPUKYZ6",
    secretAccessKey: "LTX7IizSDn28XGeQaHNID2fOtagfLc6L2henrP6P",
  },
  forcePathStyle: true,
});
// const S3 = new S3Client({
//   region: "auto", // Required by SDK but not used by R2
//   endpoint: `https://u.pipic.fun`,
//   credentials: {
//     // accessKeyId: "Q3AM3UQ867SPQQA43P2F",
//     // secretAccessKey: "Ik7nlCaUUCFOKDJAeSgFcbF5MEBGh9sVGBUrsUOp",
//     accessKeyId: "cdnadmin",
//     secretAccessKey: "D@tkhong9",
//   },
//   forcePathStyle: true,
// });
export const imageContentTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
export const videoContentTypes = ["video/mp4", "video/webm", "video/ogg", "video/*"];
const nanoId = () => {
  // return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return ""
}
export async function presignedPut(fileName: string, contentType: string){
  if (!imageContentTypes.includes(contentType)) {
    throw new Error("Invalid content type");
  }
  const key = nanoId()+"_"+fileName;
  const url = await getSignedUrl(
    S3,
    new PutObjectCommand({
      Bucket: "tmp",
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      // ContentLength: 31457280, // Max 30MB
      // ACL: "public-read", // Uncomment if you want the object to be publicly readable
    }),
    { expiresIn: 600 } // URL valid for 10 minutes
  );
  return { url, key };
}
export async function createPresignedUrls({
  key,
  uploadId,
  totalParts,
  expiresIn = 60 * 15, // 15 phút
}: {
  key: string;
  uploadId: string;
  totalParts: number;
  expiresIn?: number;
}) {
  const urls = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const command = new UploadPartCommand({
      Bucket: "tmp",
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const url = await getSignedUrl(S3, command, {
      expiresIn,
    });

    urls.push({
      partNumber,
      url,
    });
  }

  return urls;
}
export async function chunkedUpload(Key: string, contentType: string, fileSize: number) {
  // lớn hơn 3gb thì cút
  if (fileSize > 3 * 1024 * 1024 * 1024) {
    throw new Error("File size exceeds 3GB");
  }
  // CreateMultipartUploadCommand
  const uploadParams = {
    Bucket: "tmp",
    Key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  };
  let data = await S3.send(new CreateMultipartUploadCommand(uploadParams));
  return data;
}
export async function abortChunk(key: string, uploadId: string) {
  await S3.send(
    new AbortMultipartUploadCommand({
      Bucket: "tmp",
      Key: key,
      UploadId: uploadId,
    })
  );
}
export async function completeChunk(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
  const listed = await S3.send(
    new ListPartsCommand({
      Bucket: "tmp",
      Key: key,
      UploadId: uploadId,
    })
  );
  if (!listed.Parts || listed.Parts.length !== parts.length) {
    throw new Error("Not all parts have been uploaded");
  }
  await S3.send(
    new CompleteMultipartUploadCommand({
      Bucket: "tmp",
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    })
  );
}
export async function deleteObject(bucketName: string, objectKey: string) {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    })
  );
}
export async function listBuckets() {
  const data = await S3.send(new ListBucketsCommand({}));
  return data.Buckets;
}
export async function listObjects(bucketName: string) {
  const data = await S3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
    })
  );
  return data.Contents;
}
export async function generateUploadForm(fileName: string, contentType: string) {
      if (!imageContentTypes.includes(contentType)) {
        throw new Error("Invalid content type");
      }
      return await createPresignedPost(S3, {
        Bucket: "tmp",
        Key: nanoId()+"_"+fileName,
        Expires: 10 * 60, // URL valid for 10 minutes
        Conditions: [
          ["starts-with", "$Content-Type", contentType],
          ["content-length-range", 0, 31457280], // Max 30MB
        ],
      });
    }
// generateUploadUrl("tmp", "cat.png", "image/png").then(console.log);
export async function createDownloadUrl(key: string): Promise<string> {
  const url = await getSignedUrl(
    S3,
    new GetObjectCommand({ Bucket: "tmp", Key: key }),
    { expiresIn: 600 } // 600 giây = 10 phút
  );
  return url;
}