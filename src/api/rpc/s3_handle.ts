import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
 import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
// createPresignedPost
const S3 = new S3Client({
  region: "auto", // Required by SDK but not used by R2
  endpoint: `https://u.pipic.fun`,
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
  forcePathStyle: true,
});
export const imageContentTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
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
      Bucket: "bucket-lethdat",
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
export async function generateUploadForm(fileName: string, contentType: string) {
      if (!imageContentTypes.includes(contentType)) {
        throw new Error("Invalid content type");
      }
      return await createPresignedPost(S3, {
        Bucket: "bucket-lethdat",
        Key: nanoId()+"_"+fileName,
        Expires: 10 * 60, // URL valid for 10 minutes
        Conditions: [
          ["starts-with", "$Content-Type", contentType],
          ["content-length-range", 0, 31457280], // Max 30MB
        ],
      });
    }
// generateUploadUrl("bucket-lethdat", "cat.png", "image/png").then(console.log);
export async function createDownloadUrl(key: string): Promise<string> {
  const url = await getSignedUrl(
    S3,
    new GetObjectCommand({ Bucket: "bucket-lethdat", Key: key }),
    { expiresIn: 600 } // 600 giây = 10 phút
  );
  return url;
}