import { useEffect, useState } from "react";
import fallbackImage from "../../resources/img-placeholder.png";
import styled from "@emotion/styled";

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
  const [, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
  }, [src]);

  return (
    <ImgStyled
      alt={alt}
      onError={(e) => setError(e.toString())}
      src={fallbackImage}
      onLoad={(e) => {
        if (src) {
          (e.target as HTMLImageElement).src = src;
        }
      }}
      {...props}
    />
  );
};

const ImgStyled = styled.img`
  height: auto;
  max-width: 100%;
`;
