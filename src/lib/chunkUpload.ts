import { client } from "@/api/rpcclient"
import { Semaphore } from "./Semaphore"

type PresignedPart = {
  partNumber: number
  url: string
}

type UploadedPart = {
  PartNumber: number
  ETag: string
}

export async function uploadMultipartWithAbort(
  file: File,
  maxConcurrency = 4): Promise<void> {
  const sem = new Semaphore(maxConcurrency)
  const uploadedParts: UploadedPart[] = []
  let aborted = false
  // gọi API lấy presigned URLs
  const { uploadId, presignedUrls, totalParts, chunkSize, key } = await client.chunkedUpload({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    })
  const abortUpload = async () => {
    if (aborted) return
    aborted = true

    await client.abortChunk({ key, uploadId })
  }
  // chia file thành các chunk
  const tasks: Promise<void>[] = []

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1
    const { url } = presignedUrls[i]

    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    tasks.push(
      (async () => {
        await sem.acquire()

        if (aborted) {
          sem.release()
          return
        }

        try {
          const res = await fetch(url, {
            method: "PUT",
            body: chunk,
          })

          if (!res.ok) {
            throw new Error(`Upload failed at part ${partNumber}`)
          }

          uploadedParts[i] = {
            PartNumber: partNumber,
            ETag: res.headers.get("ETag")!,
          }
        } catch (err) {
          await abortUpload()
          throw err
        } finally {
          sem.release()
        }
      })()
    )
  }

  // ❗ chỉ cần 1 part throw → Promise.all reject
  await Promise.all(tasks)

  // =============================
  // TỚI ĐÂY LÀ UPLOAD OK TOÀN BỘ
  // =============================

  // sort bắt buộc
  const sortedParts = uploadedParts
    .filter(Boolean)
    .sort((a, b) => a.PartNumber - b.PartNumber)

  // gọi API complete
  // const completeRes = await fetch("/api/s3/multipart/complete", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     uploadId,
  //     key,
  //     parts: sortedParts,
  //   }),
  // })
  const completeRes = await client.completeChunk({
    key,
    uploadId,
    parts: sortedParts,
  })

  if (!completeRes.success) {
    // complete fail → abort cho sạch
    await abortUpload()
    throw new Error("Complete multipart upload failed")
  }
}
