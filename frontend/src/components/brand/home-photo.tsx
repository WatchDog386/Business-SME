/** The HD photo, once it is added to public/images. */
const HD_PHOTO = '/images/home-hd.jpg';
/** The original photo, used until the HD one is there. */
const FALLBACK_PHOTO = '/images/splash-savanna.jpg';

/** The home and login photo, served by Unsplash in the size each screen needs. */
const FEATURED = 'https://images.unsplash.com/photo-1611144727915-ef30a08aaeb3';
const featuredAt = (width: number) => `${FEATURED}?q=80&w=${width}&auto=format&fit=crop&ixlib=rb-4.1.0`;

/**
 * Full-screen photo behind the home, login, help and client pages.
 *
 * - `featured` (home and login): the chosen Unsplash photo, in the width each
 *   phone needs for a sharp picture. Loaded with CORS so the status bar can
 *   take its colour.
 * - Otherwise: public/images/home-hd.jpg when it exists, else the original.
 *
 * Any photo that fails to load falls back to the original one.
 */
export function HomePhoto({ className, featured = false }: { className: string; featured?: boolean }) {
  return (
    <img
      src={featured ? featuredAt(686) : HD_PHOTO}
      srcSet={featured ? [686, 1080, 1440].map((w) => `${featuredAt(w)} ${w}w`).join(', ') : undefined}
      sizes={featured ? '100vw' : undefined}
      crossOrigin={featured ? 'anonymous' : undefined}
      alt=""
      aria-hidden
      decoding="async"
      className={className}
      onError={(e) => {
        // A missing file comes back as the app page, which fails to load as an image
        const img = e.currentTarget;
        if (img.src.endsWith(FALLBACK_PHOTO)) return;
        img.removeAttribute('srcset');
        img.removeAttribute('crossorigin');
        img.src = FALLBACK_PHOTO;
      }}
    />
  );
}
