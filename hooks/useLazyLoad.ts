import { useEffect, useRef, useState } from 'react';

// IntersectionObserver polyfill
if (!('IntersectionObserver' in window)) {
  import('intersection-observer').then(() => {
    console.log('IntersectionObserver polyfill loaded');
  }).catch(error => {
    console.error('Failed to load IntersectionObserver polyfill:', error);
  });
}

interface UseLazyLoadOptions {
  root?: Element;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  initialLoad?: boolean;
}

export const useLazyLoad = (
  options: UseLazyLoadOptions = {}
) => {
  const { 
    root, 
    rootMargin = '0px', 
    threshold = 0, 
    once = true,
    initialLoad = false
  } = options;
  
  const [isVisible, setIsVisible] = useState(initialLoad);
  const targetRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 如果已经设置为可见，并且是一次性的，就不需要再观察了
    if (isVisible && once) {
      return;
    }

    // 如果浏览器不支持IntersectionObserver，直接设置为可见
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // 创建IntersectionObserver实例
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && observerRef.current) {
            observerRef.current.unobserve(entry.target);
            observerRef.current.disconnect();
          }
        }
      },
      { root, rootMargin, threshold }
    );

    // 观察目标元素
    if (targetRef.current) {
      observerRef.current.observe(targetRef.current);
    }

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [root, rootMargin, threshold, once, isVisible]);

  // 处理元素引用的函数
  const ref = (element: Element | null) => {
    if (targetRef.current === element) {
      return;
    }

    // 停止观察之前的元素
    if (targetRef.current && observerRef.current) {
      observerRef.current.unobserve(targetRef.current);
    }

    // 更新目标元素
    targetRef.current = element;

    // 开始观察新的元素
    if (element && observerRef.current && !isVisible) {
      observerRef.current.observe(element);
    }
  };

  return { ref, isVisible };
};