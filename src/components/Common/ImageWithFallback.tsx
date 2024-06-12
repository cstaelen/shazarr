import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

import fallbackImage from "../../resources/img-placeholder.png";

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
  const ImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setError(undefined);
    if (ImgRef.current) {
      ImgRef.current.src = fallbackImage;
    }
  }, [src]);

  return (
    <ImgStyled
      className="loading"
      alt={alt}
      ref={ImgRef}
      onError={(e) => setError(e.toString())}
      src={fallbackImage}
      onLoad={(e) => {
        if (src && src !== (e.target as HTMLImageElement).src) {
          (e.target as HTMLImageElement).src = src;
          (e.target as HTMLImageElement).classList.remove("loading");
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
