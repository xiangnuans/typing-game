'use client';

import React, { useState, useEffect, useRef } from 'react';
import LazyImage from '../../components/LazyImage';
import Navbar from '../../components/Navbar';

const LazyImageDemoPage: React.FC = () => {
  // 生成不同尺寸的图片URL
  const generateImageUrls = () => {
    const baseUrl = 'https://picsum.photos';
    const sizes = [
      { width: 800, height: 600 },
      { width: 600, height: 800 },
      { width: 1200, height: 800 },
      { width: 800, height: 1200 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 1600, height: 900 },
      { width: 900, height: 1600 },
      { width: 1920, height: 1080 },
      { width: 1080, height: 1920 },
      { width: 2048, height: 1536 },
      { width: 1536, height: 2048 },
      { width: 800, height: 800 },
      { width: 1000, height: 1000 },
      { width: 1200, height: 1200 },
      { width: 600, height: 600 },
      { width: 400, height: 600 },
      { width: 600, height: 400 },
      { width: 400, height: 400 },
      { width: 1200, height: 600 },
    ];

    return sizes.map((size, index) => ({
      id: index + 1,
      url: `${baseUrl}/${size.width}/${size.height}?random=${index + 1}`,
      srcSet: `${baseUrl}/${size.width}/${size.height}?random=${index + 1} ${size.width}w, ${baseUrl}/${size.width * 2}/${size.height * 2}?random=${index + 1} ${size.width * 2}w`,
      alt: `Random image ${index + 1}`,
      width: size.width,
      height: size.height,
    }));
  };

  const [images, setImages] = useState<any[]>([]);
  const [dynamicImages, setDynamicImages] = useState<any[]>([]);
  const [showDynamicImages, setShowDynamicImages] = useState(false);
  const [errorImageUrl, setErrorImageUrl] = useState<string>('');

  // 初始化图片列表
  useEffect(() => {
    setImages(generateImageUrls());
  }, []);

  // 模拟动态添加图片
  const addDynamicImages = () => {
    const dynamicSizes = [
      { width: 500, height: 700 },
      { width: 700, height: 500 },
      { width: 900, height: 500 },
    ];

    const newDynamicImages = dynamicSizes.map((size, index) => ({
      id: `dynamic-${index + 1}`,
      url: `https://picsum.photos/${size.width}/${size.height}?random=dynamic-${index + 1}`,
      srcSet: `https://picsum.photos/${size.width}/${size.height}?random=dynamic-${index + 1} ${size.width}w, https://picsum.photos/${size.width * 2}/${size.height * 2}?random=dynamic-${index + 1} ${size.width * 2}w`,
      alt: `Dynamic random image ${index + 1}`,
      width: size.width,
      height: size.height,
    }));

    setDynamicImages([...dynamicImages, ...newDynamicImages]);
    setShowDynamicImages(true);
  };

  // 模拟图片加载失败
  const triggerError = () => {
    setErrorImageUrl('https://example.com/nonexistent-image.jpg');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="page-content container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Lazy Image Loading Demo</h1>
        <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          This page demonstrates the lazy loading functionality of the LazyImage component. Scroll down to see how images load as they enter the viewport.
        </p>

        {/* 演示各种功能和边界情况 */}
        <div className="mb-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Component Features Demo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* 基本懒加载 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Lazy Loading</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc="https://picsum.photos/600/400?random=basic"
                  alt="Basic lazy load image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 带进度条的懒加载 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">With Loading Progress</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc="https://picsum.photos/800/600?random=progress"
                  alt="Lazy load with progress"
                  className="w-full h-full object-cover"
                  showProgress={true}
                />
              </div>
            </div>

            {/* 优先加载 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Priority Loading</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc="https://picsum.photos/700/500?random=priority"
                  alt="Priority lazy load image"
                  className="w-full h-full object-cover"
                  priority={true}
                />
              </div>
            </div>

            {/* 自定义占位符 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Custom Placeholder</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc="https://picsum.photos/500/700?random=placeholder"
                  alt="Lazy load with custom placeholder"
                  className="w-full h-full object-cover"
                  placeholder="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%236b7280'>Custom Placeholder</text></svg>"
                />
              </div>
            </div>

            {/* 响应式图片 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Responsive Images</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc="https://picsum.photos/600/400?random=responsive"
                  dataSrcSet="https://picsum.photos/400/300?random=responsive 400w, https://picsum.photos/600/400?random=responsive 600w, https://picsum.photos/800/600?random=responsive 800w"
                  alt="Responsive lazy load image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 加载失败情况 */}
            <div className="bg-gray-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Handling</h3>
              <div className="relative h-48">
                <LazyImage
                  dataSrc={errorImageUrl || 'https://example.com/nonexistent-image.jpg'}
                  alt="Lazy load with error handling"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                onClick={triggerError}
              >
                Trigger Error
              </button>
            </div>
          </div>

          {/* 动态添加图片演示 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dynamic Images</h3>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-4"
              onClick={addDynamicImages}
            >
              Add Dynamic Images
            </button>
            {showDynamicImages && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {dynamicImages.map((image) => (
                  <div key={image.id} className="bg-gray-50 rounded-lg shadow-sm p-4">
                    <div className="relative h-48">
                      <LazyImage
                        dataSrc={image.url}
                        dataSrcSet={image.srcSet}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 大量图片演示 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Large Number of Images</h2>
          <p className="text-lg text-gray-600 mb-8">
            This section demonstrates the performance of the LazyImage component with a large number of images (20 images).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Image {image.id}</h2>
                  <p className="text-sm text-gray-500 mb-4">{image.width}x{image.height}</p>
                </div>
                <div className="relative">
                  <LazyImage
                    dataSrc={image.url}
                    dataSrcSet={image.srcSet}
                    alt={image.alt}
                    className="w-full h-auto"
                    placeholder={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${image.width}' height='${image.height}' viewBox='0 0 ${image.width} ${image.height}'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%239ca3af'>Loading...</text></svg>`}
                    errorImage={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${image.width}' height='${image.height}' viewBox='0 0 ${image.width} ${image.height}'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23ef4444'>Error loading image</text></svg>`}
                    showProgress={true}
                    priority={image.id <= 3} // 优先加载前3张图片
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Component Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>IntersectionObserver API for efficient lazy loading</li>
            <li>Custom placeholder images</li>
            <li>Smooth fade-in animation when images load</li>
            <li>Error handling with retry button</li>
            <li>Loading progress bar for large images</li>
            <li>Response images support with srcset</li>
            <li>Priority loading for important images</li>
            <li>Preloading of images before they enter the viewport</li>
            <li>Browser compatibility with fallback to scroll event</li>
            <li>Image caching to avoid duplicate loads</li>
            <li>Support for dynamic added images</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default LazyImageDemoPage;