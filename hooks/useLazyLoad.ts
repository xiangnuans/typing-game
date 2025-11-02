import { useState, useEffect, useRef, useCallback } from 'react';

// 导入IntersectionObserver polyfill，仅在浏览器环境中运行
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  import('intersection-observer');
}

// 图片加载状态类型
type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

// 懒加载配置类型
interface LazyLoadConfig {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
  errorImage?: string;
  retryCount?: number;
  retryDelay?: number;
  preloadDistance?: number;
}

// 默认配置
const defaultConfig: LazyLoadConfig = {
  root: null,
  rootMargin: '100px 0px', // 提前100px开始加载
  threshold: 0.1,
  placeholder: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%239ca3af">Loading...</text></svg>',
  errorImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23ef4444">Error loading image</text></svg>',
  retryCount: 3,
  retryDelay: 1000,
  preloadDistance: 100,
};

// 节流函数
const throttle = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      func(...args);
      lastCall = now;
    }
  }) as T;
};

// 图片缓存 - 使用WeakMap来自动处理内存回收
const imageCache = new WeakMap<HTMLImageElement, string>();

export const useLazyLoad = (config: Partial<LazyLoadConfig> = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const {
    root,
    rootMargin,
    threshold,
    placeholder,
    errorImage,
    retryCount,
    retryDelay,
    preloadDistance,
  } = mergedConfig;

  const [status, setStatus] = useState<LoadStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string>(placeholder ?? '');
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const retryAttemptsRef = useRef<number>(0);

  // 加载图片
  const loadImage = useCallback(() => {
    if (!imgRef.current) return;
    
    const url = imgRef.current.dataset.src || '';
    if (!url) return;
    
    // 检查缓存
    if (imageCache.get(imgRef.current) === url) {
      setStatus('success');
      setImageUrl(url);
      setLoadProgress(100);
      return;
    }

    setStatus('loading');
    setLoadProgress(0);

    // 处理picture元素中的source元素
    const parentElement = imgRef.current.parentElement;
    if (parentElement && parentElement.tagName === 'PICTURE') {
      const sourceElements = parentElement.querySelectorAll('source');
      sourceElements.forEach((source) => {
        const sourceSrcSet = source.dataset.srcset;
        if (sourceSrcSet) {
          source.srcset = sourceSrcSet;
        }
      });
    }

    const img = new Image();
    img.src = url;
    
    // 设置srcset如果存在
    const srcSet = imgRef.current.dataset.srcset;
    if (srcSet) {
      img.srcset = srcSet;
    }

    // 监听加载进度
    img.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setLoadProgress(progress);
      }
    });

    // 加载成功
    img.addEventListener('load', () => {
      // 将图片引用和URL存入缓存
      if (imgRef.current) {
        imageCache.set(imgRef.current, url);
      }
      setStatus('success');
      setImageUrl(url);
      setLoadProgress(100);
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    });

    // 加载失败
    img.addEventListener('error', () => {
      if (retryAttemptsRef.current < (retryCount ?? 0)) {
        retryAttemptsRef.current += 1;
        const delay = (retryDelay ?? 1000) * Math.pow(2, retryAttemptsRef.current - 1); // 指数退避
        setTimeout(() => loadImage(), delay);
      } else {
        setStatus('error');
        setImageUrl(errorImage ?? '');
        setLoadProgress(0);
      }
    });
  }, [errorImage, retryCount, retryDelay]);

  // 重试加载
  const retryLoad = useCallback(() => {
    retryAttemptsRef.current = 0;
    loadImage();
  }, [loadImage]);

  // 检查元素是否已经在视口中
  const checkIfInViewport = useCallback(() => {
    if (!imgRef.current) return false;
    
    const rect = imgRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top <= viewportHeight + (preloadDistance ?? 0) &&
      rect.bottom >= -(preloadDistance ?? 0) &&
      rect.left <= viewportWidth + (preloadDistance ?? 0) &&
      rect.right >= -(preloadDistance ?? 0)
    );
  }, [preloadDistance]);

  // 初始化IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as Window;
    
    // 首先检查元素是否已经在视口中
    if (checkIfInViewport()) {
      loadImage();
      return;
    }
    
    if (!('IntersectionObserver' in win)) {
      // 浏览器不支持IntersectionObserver，降级到scroll事件
      const handleScroll = throttle(() => {
        if (checkIfInViewport()) {
          loadImage();
          win.removeEventListener('scroll', handleScroll);
        }
      }, 200);

      win.addEventListener('scroll', handleScroll);

      return () => {
        win.removeEventListener('scroll', handleScroll);
      };
    }

    // 创建IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
          }
        });
      },
      {
        root,
        rootMargin: `${preloadDistance ?? 0}px 0px`,
        threshold,
      }
    );

    // 开始观察目标元素
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        // 清理所有观察的元素
        observerRef.current.disconnect();
      }
    };
  }, [root, rootMargin, threshold, preloadDistance, loadImage, checkIfInViewport]);

  return {
    imgRef,
    imageUrl,
    status,
    loadProgress,
    retryLoad,
  };
};