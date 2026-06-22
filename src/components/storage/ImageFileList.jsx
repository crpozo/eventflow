import React from "react";

// Public assets are served through CloudFront (same base used by the landing),
// so a stored key resolves to a viewable URL without a per-image getUrl() call.
const CLOUDFRONT = "https://dnuc5lxyun5b.cloudfront.net/public/";

// Resolve a thumbnail URL for a StorageManager file entry:
//  - files being uploaded this session carry a local blob -> object URL
//  - already-saved files only carry a `key` -> resolve via CloudFront
const resolveUrl = ({ file, key }) => {
  if (file) {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      /* fall through to key-based URL */
    }
  }
  if (!key) return "";
  return /^https?:\/\//i.test(key) ? key : `${CLOUDFRONT}${key}`;
};

/**
 * Drop-in replacement for Amplify StorageManager's `FileList` (passed via the
 * `components` prop). The stock FileList only builds a thumbnail from the local
 * blob (`URL.createObjectURL`), so files loaded from S3 as `defaultFiles` had no
 * blob and showed a generic file icon. This renders a real image thumbnail for
 * those too (resolved from CloudFront by key) and de-dupes by key so the same
 * image never appears twice.
 *
 * Receives FileListProps from StorageManager; we use files + the remove/cancel
 * callbacks and ignore the rest (pause/resume/maxFiles UI is not needed here).
 */
export function ImageFileList({ files, isResumable, onCancelUpload, onDeleteUpload }) {
  if (!files || files.length < 1) return null;

  // Collapse duplicate keys to a single tile, and drop empty keys (e.g. a
  // single-file uploader whose defaultFiles is [{ key: undefined }]).
  const seen = new Set();
  const unique = files.filter((f) => {
    if (!f.key || seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  });

  if (unique.length < 1) return null;

  const removeFile = ({ id, status, uploadTask }) => {
    if (
      isResumable &&
      (status === "uploading" || status === "paused") &&
      uploadTask
    ) {
      onCancelUpload({ id, uploadTask });
    } else {
      onDeleteUpload({ id });
    }
  };

  return (
    <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {unique.map((storageFile) => {
        const { id, status, error } = storageFile;
        const url = resolveUrl(storageFile);
        const uploading =
          status === "uploading" || status === "queued" || status === "added";
        return (
          <div
            key={id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-navy-700 dark:bg-navy-900"
          >
            {url ? (
              <img
                src={url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                …
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-gray-700">
                Subiendo…
              </div>
            )}

            {error && (
              <div
                className="absolute inset-x-0 bottom-0 truncate bg-red-600/90 px-1 py-0.5 text-[10px] text-white"
                title={error}
              >
                Error
              </div>
            )}

            <button
              type="button"
              onClick={() => removeFile(storageFile)}
              aria-label="Eliminar imagen"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-lg leading-none text-white transition hover:bg-black/80"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ImageFileList;
