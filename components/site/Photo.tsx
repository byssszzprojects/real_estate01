import manifest from "@/lib/image-manifest.json";

export type ImageName = keyof typeof manifest;

type PhotoProps = {
  name: ImageName;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Responsive image with exact intrinsic dimensions from the asset manifest.
 * 640 / 1024 derivatives sit in front of the untouched original.
 */
export function Photo({
  name,
  alt,
  sizes = "100vw",
  className = "",
  priority = false,
}: PhotoProps) {
  const meta = manifest[name];
  const widths = [
    ...[640, 1024].filter((width) => width < meta.width),
    meta.width,
  ];

  const srcSet = widths
    .map((width) =>
      width === meta.width
        ? `/images/${name}.webp ${width}w`
        : `/images/responsive/${name}-${width}.webp ${width}w`,
    )
    .join(", ");

  const fallback = widths.includes(1024)
    ? `/images/responsive/${name}-1024.webp`
    : `/images/${name}.webp`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={meta.width}
      height={meta.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}
