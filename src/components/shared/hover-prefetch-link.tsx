"use client";

import Link from "next/link";
import { useState, type ComponentPropsWithoutRef } from "react";

type HoverPrefetchLinkProps = ComponentPropsWithoutRef<typeof Link>;

/**
 * 仅在用户悬停、聚焦或触摸链接时触发 Next.js 路由预取，
 * 避免首屏与页脚数十个链接同时在后台并发预取阻塞连接池与引起浏览器持续转圈。
 */
export function HoverPrefetchLink({
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: HoverPrefetchLinkProps) {
  const [active, setActive] = useState(false);
  const resolvedPrefetch = prefetch !== undefined ? prefetch : active ? null : false;

  return (
    <Link
      {...props}
      prefetch={resolvedPrefetch}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        setActive(true);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        onTouchStart?.(e);
      }}
    />
  );
}
