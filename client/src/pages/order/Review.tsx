import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Rate, Input, Button, Space, message, Spin, Empty, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { orderApi } from '@/api/orders';
import { reviewApi } from '@/api/reviews';
import { uploadApi } from '@/api/upload';
import { uploadVideoByChunks } from '@/utils/chunkUpload';
import type { Order } from '@/types/order';

const { TextArea } = Input;

interface ItemFormState {
  rating: number;
  content: string;
  images: string[];
  video_url: string | null;
  uploadingImage: boolean;
  uploadingVideo: boolean;
  videoProgress: number;
}

export default function OrderReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [forms, setForms] = useState<Record<number, ItemFormState>>({});

  useEffect(() => {
    if (!id) return;
    orderApi
      .detail(Number(id))
      .then((o) => {
        setOrder(o);
        // 初始化每一项的表单状态
        const init: Record<number, ItemFormState> = {};
        o.items.forEach((it) => {
          init[it.id] = {
            rating: 5,
            content: '',
            images: [],
            video_url: null,
            uploadingImage: false,
            uploadingVideo: false,
            videoProgress: 0,
          };
        });
        setForms(init);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const updateForm = (itemId: number, patch: Partial<ItemFormState>) => {
    setForms((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  };

  const handleUploadImage = async (itemId: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片不能超过 5MB');
      return;
    }
    updateForm(itemId, { uploadingImage: true });
    try {
      const result = await uploadApi.image(file);
      setForms((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          images: [...prev[itemId].images, result.url],
          uploadingImage: false,
        },
      }));
    } catch {
      updateForm(itemId, { uploadingImage: false });
    }
  };

  const handleUploadVideo = async (itemId: number, file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      message.error('视频不能超过 50MB');
      return;
    }
    updateForm(itemId, { uploadingVideo: true });
    try {
      const result = await uploadVideoByChunks(file, (percent) => {
        updateForm(itemId, { videoProgress: percent });
      });
      updateForm(itemId, { video_url: result.url, uploadingVideo: false, videoProgress: 100 });
      message.success('视频上传成功');
    } catch {
      updateForm(itemId, { uploadingVideo: false });
    }
  };

  const removeImage = (itemId: number, url: string) => {
    setForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        images: prev[itemId].images.filter((u) => u != url),
      },
    }));
  };

  const removeVideo = (itemId: number) => {
    updateForm(itemId, { video_url: null });
  };

  const handleSubmit = async (itemId: number) => {
    const form = forms[itemId];
    if (!form) return;
    if (form.rating < 1) {
      message.warning('请先评分');
      return;
    }
    try {
      await reviewApi.create({
        order_item_id: itemId,
        rating: form.rating,
        content: form.content.trim() || undefined,
        images: form.images.length > 0 ? form.images : undefined,
        video_url: form.video_url || undefined,
      });
      message.success('评价成功');
      navigate(`/orders/${id}`);
    } catch {
      // 已统一提示
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return <Empty description="订单不存在" />;

  if (order.status !== 'completed') {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Empty description="订单还未完成，不能评价" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <h2>评价订单</h2>

      {order.items.map((it) => {
        const form = forms[it.id];
        if (!form) return null;

        return (
          <Card key={it.id} title={it.product_name} style={{ marginBottom: 16 }}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <span style={{ marginRight: 12 }}>评分：</span>
                <Rate value={form.rating} onChange={(v) => updateForm(it.id, { rating: v })} />
              </div>

              <TextArea
                rows={3}
                placeholder="说说你的使用体验吧（选填）"
                maxLength={200}
                showCount
                value={form.content}
                onChange={(e) => updateForm(it.id, { content: e.target.value })}
              />

              <div>
                <div style={{ marginBottom: 8 }}>图片（最多3张，每张 ≤5MB）：</div>
                <Space wrap>
                  {form.images.map((url) => (
                    <div key={url} style={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt=""
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <CloseCircleOutlined
                        onClick={() => removeImage(it.id, url)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          color: '#ff4d4f',
                          background: '#fff',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                      />
                    </div>
                  ))}
                  {form.images.length < 3 && (
                    <label
                      style={{
                        width: 72,
                        height: 72,
                        border: '1px dashed #d9d9d9',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#999',
                      }}
                    >
                      {form.uploadingImage ? <Spin size="small" /> : <PlusOutlined />}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadImage(it.id, f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </Space>
              </div>

              <div>
                <div style={{ marginBottom: 8 }}>视频（选填，≤50MB）：</div>
                {form.video_url ? (
                  <div style={{ position: 'relative', width: 200 }}>
                    <video
                      src={form.video_url}
                      controls
                      style={{ width: '100%', borderRadius: 4 }}
                    />
                    <Tag
                      color="red"
                      onClick={() => removeVideo(it.id)}
                      style={{ cursor: 'pointer', marginTop: 8 }}
                    >
                      删除视频
                    </Tag>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      border: '1px dashed #d9d9d9',
                      borderRadius: 4,
                      cursor: form.uploadingVideo ? 'not-allowed' : 'pointer',
                      color: '#666',
                    }}
                  >
                    {form.uploadingVideo
                      ? '上传中${form.videoProgress ?? 0}%'
                      : '选择视频（分片上传）'}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadVideo(it.id, f);
                        e.target.value = '';
                      }}
                      disabled={form.uploadingVideo}
                    />
                  </label>
                )}
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Button type="primary" onClick={() => handleSubmit(it.id)}>
                提交评价
              </Button>
            </Space>
          </Card>
        );
      })}
    </div>
  );
}
