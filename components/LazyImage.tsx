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
      img.src = dataSrc;
      if (dataSrcSet) {
        img.srcset = dataSrcSet;
      }
    }
  }, [priority, dataSrc, dataSrcSet]);

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

  return (
    <div className="relative inline-block overflow-hidden">
      {/* 占位图或加载中的图片 */}
      <img
        ref={imgRef}
        src={imageUrl}
        srcSet={status === 'success' ? dataSrcSet : undefined}
        alt={alt}
        className={`transition-opacity duration-500 ease-in-out ${className} ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
        data-src={dataSrc}
        data-srcset={dataSrcSet}
        {...rest}
      />

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