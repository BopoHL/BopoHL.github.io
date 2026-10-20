"use client";

import { useEffect, useState, type RefObject } from "react";

const DEFAULT_ASPECT = 16 / 9;

const round = (value: number) => Math.round(value * 100) / 100;

export const useElementAspect = (element: RefObject<HTMLElement | null>) => {
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspect(round(width / height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [element]);

  return aspect;
};
