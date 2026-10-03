import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface Props {
  option: echarts.EChartsOption;
  height?: number | string;
}

export default function Echart({ option, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // 初始化
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    chartRef.current.setOption(option, true);

    // 响应式：容器变化时重绘
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [option]);

  // 组件卸载时销毁
  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height }}></div>;
}
