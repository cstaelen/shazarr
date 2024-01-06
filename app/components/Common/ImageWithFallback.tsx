import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

const fallbackImage = "/img-placeholder.png";

export const ImageWithFallback = ({
  alt,
  src,
  ...props
}: ImageProps & { fallback?: string }) => {
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
  }, [src]);

  return (
    <Image
      alt={alt}
      onError={(e) => setError(e.toString())}
      src={error ? fallbackImage : src}
      {...props}
    />
  );
};
