import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// 内存缓存，存储已经加载成功的图片URL
const imageCache = new Map<string, boolean>();

interface LazySourceProps extends Omit<React.SourceHTMLAttributes<HTMLSourceElement>, 'srcSet'> {
  dataSrcSet: string;
}

interface LazyPictureProps extends React.HTMLAttributes<HTMLPictureElement> {
  sources: LazySourceProps[];
  fallbackDataSrc: string;
  fallbackDataSrcSet?: string;
  placeholder?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  retryDelay?: number;
  maxRetries?: number;
  alt: string;
}

const LazyPicture: React.FC<LazyPictureProps> = ({
  sources,
  fallbackDataSrc,
  fallbackDataSrcSet,
  placeholder = <div className="bg-gray-200 w-full h-full rounded" />,
  loading = <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded"><div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-8 w-8 animate-spin"></div></div>,
  error = <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded text-red-500">Error loading image</div>,
  retryDelay = 1000,
  maxRetries = 3,
  alt,
  ...props
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const pictureRef = useRef<HTMLPictureElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { ref: observerRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  const loadImageController = useRef<AbortController | null>(null);

  // 加载图片的函数
  const loadImage = useCallback(async () => {
    // 如果图片已经在缓存中，直接设置为成功状态
    if (imageCache.has(fallbackDataSrc)) {
      setStatus('success');
      return;
    }

    // 如果重试次数超过最大值，设置为错误状态
    if (retryCount >= maxRetries) {
      setStatus('error');
      return;
    }

    // 设置为加载状态
    setStatus('loading');

    // 创建AbortController来取消请求
    const controller = new AbortController();
    loadImageController.current = controller;

    try {
      // 创建picture元素和img元素来测试加载
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.alt = alt;

      // 添加所有source元素
      sources.forEach(source => {
        const srcElement = document.createElement('source');
        srcElement.srcset = source.dataSrcSet;
        if (source.type) srcElement.type = source.type;
        if (source.media) srcElement.media = source.media;
        picture.appendChild(srcElement);
      });

      picture.appendChild(img);

      // 加载图片
      const promise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = fallbackDataSrc;
        if (fallbackDataSrcSet) {
          img.srcset = fallbackDataSrcSet;
        }
      });

      // 等待图片加载完成
      await promise;

      // 将图片URL添加到缓存
      imageCache.set(fallbackDataSrc, true);

      // 设置为成功状态
      setStatus('success');
    } catch (err) {
      // 设置为错误状态
      setStatus('error');

      // 增加重试次数
      setRetryCount(prev => prev + 1);

      // 延迟重试
      setTimeout(() => {
        loadImage();
      }, retryDelay * Math.pow(2, retryCount));
    } finally {
      // 清除AbortController
      loadImageController.current = null;
    }
  }, [sources, fallbackDataSrc, fallbackDataSrcSet, retryCount, maxRetries, retryDelay, alt]);

  // 当元素进入视口时，加载图片
  useEffect(() => {
    if (isIntersecting && status === 'idle') {
      loadImage();
    }
  }, [isIntersecting, status, loadImage]);

  // 组件卸载时，取消所有正在进行的图片加载请求
  useEffect(() => {
    return () => {
      if (loadImageController.current) {
        loadImageController.current.abort();
      }
    };
  }, []);

  // 渲染不同状态的内容
  switch (status) {
    case 'idle':
    case 'loading':
      return (
        <div className="relative" ref={(el) => {
          observerRef(el);
          if (el?.firstChild?.firstChild) {
            pictureRef.current = el.firstChild as HTMLPictureElement;
            imgRef.current = pictureRef.current.querySelector('img');
          }
        }}>
          {status === 'idle' ? placeholder : loading}
          <picture className="absolute inset-0 w-full h-full">
            {sources.map((source, index) => (
              <source
                key={index}
                data-srcset={source.dataSrcSet}
                type={source.type}
                media={source.media}
                {...source}
              />
            ))}
            <img
              data-src={fallbackDataSrc}
              data-srcset={fallbackDataSrcSet}
              alt={alt}
              className="w-full h-full object-cover rounded opacity-0 transition-opacity duration-300"
              onLoad={() => {
                if (imgRef.current) {
                  imgRef.current.style.opacity = '1';
                }
              }}
            />
          </picture>
        </div>
      );
    case 'success':
      return (
        <picture ref={observerRef} {...props}>
          {sources.map((source, index) => (
            <source
              key={index}
              srcSet={source.dataSrcSet}
              type={source.type}
              media={source.media}
              {...source}
            />
          ))}
          <img
            src={fallbackDataSrc}
            srcSet={fallbackDataSrcSet}
            alt={alt}
            className="w-full h-full object-cover rounded"
          />
        </picture>
      );
    case 'error':
      return <div className="relative" ref={observerRef}>{error}</div>;
  }
};

export default LazyPicture;