import request from '@/utils/request';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request
      .post<{ data: UploadResult }>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  video: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request
      .post<{ data: UploadResult }>('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 视频上传可能慢，给 2 分钟
      })
      .then((r) => r.data.data);
  },
};
