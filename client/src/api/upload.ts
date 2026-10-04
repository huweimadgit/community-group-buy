import request from '@/utils/request';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface InitResult {
  uploaded: boolean;
  url?: string;
  uploaded_chunks: number[];
  total_chunks: number;
}

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post<{ data: UploadResult }>('/upload/image', formData).then((r) => r.data.data);
  },

  video: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request
      .post<{ data: UploadResult }>('/upload/video', formData, {
        timeout: 120000, // 视频上传可能慢，给 2 分钟
      })
      .then((r) => r.data.data);
  },

  // ============ L2 分片 ============

  init: (params: {
    file_hash: string;
    file_name: string;
    file_size: number;
    total_chunks: number;
  }) => request.post<{ data: InitResult }>('/upload/video/init', params).then((r) => r.data.data),

  chunk: (file: Blob, params: { file_hash: string; chunk_index: number; total_chunks: number }) => {
    const fd = new FormData();
    // 文本字段先 append
    fd.append('file_hash', params.file_hash);
    fd.append('chunk_index', String(params.chunk_index));
    fd.append('total_chunks', String(params.total_chunks));
    // file 最后 append
    fd.append('file', file);
    return request.post('/upload/video/chunk', fd, { timeout: 120000 });
  },

  complete: (params: {
    file_hash: string;
    file_name: string;
    file_size: number;
    total_chunks: number;
  }) =>
    request
      .post<{ data: { url: string; filename: string; size: number } }>(
        '/upload/video/complete',
        params,
      )
      .then((r) => r.data.data),
};
