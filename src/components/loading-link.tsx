"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingLink({ href, children, className }: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Reset loading state when the page changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(href);
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <a 
        href={href} 
        onClick={handleClick} 
        className={className}
      >
        {children}
      </a>
    </>
  );
}
