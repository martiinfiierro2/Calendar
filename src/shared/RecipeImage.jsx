import { useState } from 'react';

const PLACEHOLDER = '/recipe-placeholder.svg';

export default function RecipeImage({ src, alt, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const image = !src || failedSrc === src ? PLACEHOLDER : src;
  return <img {...props} src={image} alt={alt} onError={() => {
    if (image !== PLACEHOLDER) setFailedSrc(src);
  }} />;
}
