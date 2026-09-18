import { cn } from '@/lib/cn';
import type { Product } from '@/data/catalog';

/**
 * Renders catalogue imagery consistently wherever a product appears.
 *
 * Generated artwork is a cut-out and sits directly on the dark surface.
 * Photography arrives as an opaque rectangle on a studio-white ground, which
 * would read as a broken tile against the dark card — so it gets a rounded
 * plate of its own, which is how the rest of the design treats light content.
 *
 * Plain `<img>` rather than `next/image`: the catalogue mixes SVG (which the
 * optimiser passes through anyway) with session-scoped API URLs.
 */
export function ProductImage({
  product,
  className,
  imageClassName,
  alt,
  loading,
  title,
}: {
  product: Pick<Product, 'image' | 'media' | 'name'>;
  /** Sizing for the frame. */
  className?: string;
  /** Padding/fit overrides for the image itself. */
  imageClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  title?: string;
}) {
  const isPhoto = product.media === 'photo';

  return (
    <span
      className={cn(
        'relative block overflow-hidden',
        isPhoto && 'rounded-lg bg-bone-50',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- mixed SVG and photo sources */}
      <img
        src={product.image}
        alt={alt ?? product.name}
        title={title}
        loading={loading}
        decoding="async"
        className={cn('size-full', isPhoto ? 'object-cover' : 'object-contain', imageClassName)}
      />
    </span>
  );
}
