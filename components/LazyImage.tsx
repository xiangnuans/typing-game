'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useLazyLoad } from '../hooks/useLazyLoad';

// LazyImage组件属性类型
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  dataSrc: string;
  dataSrcSet?: string;
  placeholder?: string;
  errorImage?: string;
  retryCount?: number;
  retryDelay?: number;
  preloadDistance?: number;
  showProgress?: boolean;
  priority?: boolean;
  pictureSources?: Array<{
    srcSet: string;
    media?: string;
    type?: string;
  }>;
}

// LazyImage组件引用类型
export interface LazyImageRef {
  retryLoad: () => void;
}

const LazyImage = forwardRef<LazyImageRef, LazyImageProps>((
  {
    dataSrc,
    dataSrcSet,
    placeholder,
    errorImage,
    retryCount,
    retryDelay,
    preloadDistance,
    showProgress = false,
    priority = false,
    alt,
    className,
    pictureSources = [],
    ...rest
  },
  ref
) => {
  // 使用useLazyLoad自定义Hook
  const {
    imgRef,
    imageUrl,
    status,
    loadProgress,
    retryLoad,
  } = useLazyLoad({
    placeholder,
    errorImage,
    retryCount,
    retryDelay,
    preloadDistance,
  });

  // 暴露ref方法
  useImperativeHandle(ref, () => ({
    retryLoad,
  }), [retryLoad]);

  // 处理图片加载优先级
  React.useEffect(() => {
    if (priority && dataSrc) {
      // 优先加载图片
      const img = new Image();
      
      // 处理picture元素中的source元素
      if (pictureSources.length > 0) {
        const picture = document.createElement('picture');
        
        // 添加所有source元素
        pictureSources.forEach((source) => {
          const sourceElement = document.createElement('source');
          sourceElement.srcset = source.srcSet;
          if (source.media) {
            sourceElement.media = source.media;
          }
          if (source.type) {
            sourceElement.type = source.type;
          }
          picture.appendChild(sourceElement);
        });
        
        // 添加img元素
        picture.appendChild(img);
        
        // 将picture元素添加到DOM中以便浏览器开始加载
        document.body.appendChild(picture);
        
        // 加载完成后移除临时元素
        const handleLoadOrError = () => {
          document.body.removeChild(picture);
        };
        
        img.addEventListener('load', handleLoadOrError);
        img.addEventListener('error', handleLoadOrError);
      } else {
        // 普通img元素
        img.src = dataSrc;
        if (dataSrcSet) {
          img.srcset = dataSrcSet;
        }
      }
    }
  }, [priority, dataSrc, dataSrcSet, pictureSources]);

  // 渲染加载进度条
  const renderProgressBar = () => {
    if (showProgress && status === 'loading') {
      return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-100"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      );
    }
    return null;
  };

  // 渲染错误提示和重试按钮
  const renderErrorState = () => {
    if (status === 'error') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
          <svg
            className="w-16 h-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-700 mb-4 text-center">Failed to load image</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={retryLoad}
          >
            Retry
          </button>
        </div>
      );
    }
    return null;
  };

  // 渲染picture元素
  const renderPictureElement = () => {
    if (pictureSources.length > 0) {
      return (
        <picture>
          {pictureSources.map((source, index) => (
            <source
              key={index}
              srcSet={status === 'success' ? source.srcSet : undefined}
              media={source.media}
              type={source.type}
              data-srcset={status !== 'success' ? source.srcSet : undefined}
            />
          ))}
          {/* 占位图或加载中的图片 */}
          <img
            ref={imgRef}
            src={imageUrl}
            srcSet={status === 'success' ? dataSrcSet : undefined}
            alt={alt}
            className={`transition-opacity duration-500 ease-in-out ${className} ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
            data-src={dataSrc}
            data-srcset={status !== 'success' ? dataSrcSet : undefined}
            {...rest}
          />
        </picture>
      );
    }
    // 默认渲染img元素
    return (
      <img
        ref={imgRef}
        src={imageUrl}
        srcSet={status === 'success' ? dataSrcSet : undefined}
        alt={alt}
        className={`transition-opacity duration-500 ease-in-out ${className} ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
        data-src={dataSrc}
        data-srcset={status !== 'success' ? dataSrcSet : undefined}
        {...rest}
      />
    );
  };

  return (
    <div className="relative inline-block overflow-hidden">
      {renderPictureElement()}

      {/* 加载状态显示 */}
      {status !== 'success' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Loading...</p>
            </div>
          )}
        </div>
      )}

      {/* 加载进度条 */}
      {renderProgressBar()}

      {/* 错误状态显示 */}
      {renderErrorState()}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;