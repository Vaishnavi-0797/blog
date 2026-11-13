import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

// Shows an image, or a neat placeholder when there is none or it fails to load.
export default function PostImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (!src || failed) {
    return (
      <div className={`img-placeholder ${className}`} role="img" aria-label={alt || 'No image'}>
        <ImageOff size={28} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
