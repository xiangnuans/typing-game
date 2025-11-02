import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const { root, rootMargin = '0px', threshold = 0, once = false } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);

        if (once && entry.isIntersecting) {
          observerRef.current?.disconnect();
        }
      },
      { root, rootMargin, threshold }
    );

    // Observe target if it exists
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observerRef.current.observe(currentTarget);
    }

    // Clean up on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [root, rootMargin, threshold, once]);

  const ref = (element: Element | null) => {
    if (targetRef.current === element) return;

    if (targetRef.current) {
      observerRef.current?.unobserve(targetRef.current);
    }

    targetRef.current = element;

    if (element) {
      observerRef.current?.observe(element);
    }
  };

  return { ref, isIntersecting, entry };
};