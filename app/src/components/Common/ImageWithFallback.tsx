import { useEffect, useState } from "react";
import fallbackImage from "../../assets/img-placeholder.png";

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
      src={fallbackImage}
      onLoad={(e: {target: any}) => {
        if (src) {
          e.target.src = src
        }
      }}
      {...props}
    />
  );
};
