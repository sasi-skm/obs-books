// Maps a stored display image URL to its thumbnail sibling produced by the
// upload pipeline (<base>.webp -> <base>-thumb.webp). For any URL that is not
// a processed .webp (legacy .jpg/.png, missing url), returns the input
// unchanged so callers still get a working image.
export function thumbSrc(url?: string | null): string {
  if (!url) return ''
  return url.endsWith('.webp') ? url.replace(/\.webp$/, '-thumb.webp') : url
}
