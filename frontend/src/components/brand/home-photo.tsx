/** The sunrise photo behind the home and login pages. */
const FEATURED_PHOTO = '/images/home-sunrise.jpg';
/** The HD photo for the other pages, once it is added to public/images. */
const HD_PHOTO = '/images/home-hd.jpg';
/** The original photo, used until the HD one is there. */
const FALLBACK_PHOTO = '/images/splash-savanna.jpg';

/**
 * Full-screen photo behind the home, login, help and client pages.
 *
 * - `featured` (home and login): the sunrise photo.
 * - Otherwise: public/images/home-hd.jpg when it exists, else the original.
 *
 * Any photo that fails to load falls back to the original one.
 */
export function HomePhoto({ className, featured = false }: { className: string; featured?: boolean }) {
  return (
    <img
      src={featured ? FEATURED_PHOTO : HD_PHOTO}
      alt=""
      aria-hidden
      decoding="async"
      className={className}
      onError={(e) => {
        // A missing file comes back as the app page, which fails to load as an image
        if (!e.currentTarget.src.endsWith(FALLBACK_PHOTO)) e.currentTarget.src = FALLBACK_PHOTO;
      }}
    />
  );
}
