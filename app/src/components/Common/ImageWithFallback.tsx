import React, { useEffect, useState } from "react";

const fallbackImage = "%PUBLIC_URL%/img-placeholder.png";

export const ImageWithFallback = ({
  alt,
  src,
  ...props
}: {
  alt: string;
  src: string;
  fallback?: string;
  height?: string;
  width?: string;
}) => {
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
  }, [src]);

  return (
    <img
      alt={alt}
      onError={(e) => setError(e.toString())}
      src={error ? fallbackImage : src}
      {...props}
    />
  );
};
