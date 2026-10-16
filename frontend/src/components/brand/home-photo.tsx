/** The HD photo, once it is added to public/images. */
const HD_PHOTO = '/images/home-hd.jpg';
/** The original photo, used until the HD one is there. */
const FALLBACK_PHOTO = '/images/splash-savanna.jpg';

/**
 * Full-screen photo behind the home, login, help and client pages. Uses
 * public/images/home-hd.jpg when it exists and quietly falls back to the
 * original photo otherwise, so the picture can be swapped by dropping in one
 * file. A new file name also means phones fetch it fresh, not a cached copy.
 */
export function HomePhoto({ className }: { className: string }) {
  return (
    <img
      src={HD_PHOTO}
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
