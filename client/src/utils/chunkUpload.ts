import { uploadApi } from '@/api/upload';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 计算文件 hash
 * 用 文件名 + 大小 + lastModified 生成 SHA-256
 * 同一个文件（未改名、未修改、未被重新保存）会得到相同 hash，实现秒传
 */
export async function computeFileHash(file: File): Promise<string> {
  const str = `${file.name}-${file.size}-${file.lastModified}`;
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface ChunkUploadResult {
  url: string;
  fromCache: boolean; // 是否秒传
}

/**
 * 分片上传
 * @param file 视频文件
 * @param onProgress 进度回调 0-100
 */
export async function uploadVideoByChunks(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ChunkUploadResult> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileHash = await computeFileHash(file);

  // 1. 初始化
  const init = await uploadApi.init({
    file_hash: fileHash,
    file_name: file.name,
    file_size: file.size,
    total_chunks: totalChunks,
  });

  // 秒传：直接返回
  if (init.uploaded && init.url) {
    onProgress?.(100);
    return { url: init.url, fromCache: true };
  }

  // 2. 断点续传：跳过已上传的分片
  const uploadedSet = new Set(init.uploaded_chunks || []);
  let done = uploadedSet.size;
  onProgress?.(Math.floor((done / totalChunks) * 100));

  for (let i = 0; i < totalChunks; i++) {
    if (uploadedSet.has(i)) continue;

    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadApi.chunk(chunk, {
      file_hash: fileHash,
      chunk_index: i,
      total_chunks: totalChunks,
    });

    done++;
    onProgress?.(Math.floor((done / totalChunks) * 100));
  }

  // 3. 合并
  const result = await uploadApi.complete({
    file_hash: fileHash,
    file_name: file.name,
    file_size: file.size,
    total_chunks: totalChunks,
  });

  return { url: result.url, fromCache: false };
}
