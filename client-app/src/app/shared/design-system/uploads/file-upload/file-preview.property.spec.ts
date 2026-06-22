/**
 * Property 22: File preview type differentiation
 *
 * For any selected file, if it has an image MIME type (JPEG, PNG, GIF, WebP),
 * a 64×64 thumbnail preview SHALL be rendered; for all other file types,
 * a file type icon SHALL be displayed instead.
 *
 * **Validates: Requirements 8.3**
 */
import * as fc from 'fast-check';
import { IMAGE_MIME_TYPES_SET } from './file-upload.component';

/**
 * We test the pure logic that determines whether a file gets a thumbnail preview
 * or a file type icon. The component uses IMAGE_MIME_TYPES (a Set) to check
 * `file.type`, setting `isImage = IMAGE_MIME_TYPES.has(file.type)` and
 * `thumbnailUrl = isImage ? URL.createObjectURL(file) : null`.
 *
 * The property under test:
 * - Image MIME types (image/jpeg, image/png, image/gif, image/webp) → isImage=true, thumbnailUrl is non-null
 * - All other MIME types → isImage=false, thumbnailUrl is null
 */

/** Known image MIME types that should produce thumbnail previews */
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Non-image MIME types that should produce file type icons */
const NON_IMAGE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
  'text/csv',
  'video/mp4',
  'audio/mpeg',
  'application/json',
  'application/xml',
  'application/octet-stream',
  '',
];

/**
 * Replicates the component's logic for determining if a file is an image.
 * This mirrors: `const isImage = IMAGE_MIME_TYPES.has(file.type);`
 */
function computeIsImage(mimeType: string): boolean {
  return IMAGE_MIME_TYPES_SET.has(mimeType);
}

/**
 * Replicates the component's logic for determining if a thumbnailUrl should be created.
 * This mirrors: `const thumbnailUrl = isImage ? URL.createObjectURL(file) : null;`
 */
function computeThumbnailUrl(isImage: boolean): string | null {
  // We don't call URL.createObjectURL in tests, but we verify the logic:
  // if isImage is true, a non-null URL would be generated; otherwise null.
  return isImage ? 'blob:mock-url' : null;
}

describe('Property 22: File preview type differentiation', () => {

  it('should mark files with image MIME types as images with a non-null thumbnailUrl', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...IMAGE_MIME_TYPES),
        (mimeType: string) => {
          const isImage = computeIsImage(mimeType);
          const thumbnailUrl = computeThumbnailUrl(isImage);

          expect(isImage).withContext(
            `File with MIME type "${mimeType}" should be identified as an image`
          ).toBeTrue();

          expect(thumbnailUrl).withContext(
            `File with MIME type "${mimeType}" should have a non-null thumbnailUrl for 64×64 thumbnail preview`
          ).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mark files with non-image MIME types as non-images with a null thumbnailUrl', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NON_IMAGE_MIME_TYPES),
        (mimeType: string) => {
          const isImage = computeIsImage(mimeType);
          const thumbnailUrl = computeThumbnailUrl(isImage);

          expect(isImage).withContext(
            `File with MIME type "${mimeType}" should NOT be identified as an image`
          ).toBeFalse();

          expect(thumbnailUrl).withContext(
            `File with MIME type "${mimeType}" should have a null thumbnailUrl (file icon displayed instead)`
          ).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only classify exactly the 4 known image MIME types as images (no others)', () => {
    // Generate arbitrary MIME-like strings and verify only the 4 known types match
    const arbitraryMimeType = fc.oneof(
      // Known image types
      fc.constantFrom(...IMAGE_MIME_TYPES),
      // Known non-image types
      fc.constantFrom(...NON_IMAGE_MIME_TYPES),
      // Random MIME-like strings (type/subtype pattern)
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 15 }),
        fc.string({ minLength: 1, maxLength: 20 })
      ).map(([type, subtype]) => `${type}/${subtype}`),
      // Edge cases: image/ prefix but not in the set
      fc.constantFrom(
        'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
        'image/heic', 'image/heif', 'image/avif'
      )
    );

    fc.assert(
      fc.property(
        arbitraryMimeType,
        (mimeType: string) => {
          const isImage = computeIsImage(mimeType);
          const shouldBeImage = IMAGE_MIME_TYPES.includes(mimeType);

          expect(isImage).withContext(
            `MIME type "${mimeType}": isImage=${isImage}, expected=${shouldBeImage}`
          ).toBe(shouldBeImage);

          if (isImage) {
            // Should render 64×64 thumbnail
            const thumbnailUrl = computeThumbnailUrl(isImage);
            expect(thumbnailUrl).withContext(
              `Image MIME type "${mimeType}" must have non-null thumbnailUrl`
            ).not.toBeNull();
          } else {
            // Should render file type icon
            const thumbnailUrl = computeThumbnailUrl(isImage);
            expect(thumbnailUrl).withContext(
              `Non-image MIME type "${mimeType}" must have null thumbnailUrl (icon shown instead)`
            ).toBeNull();
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  it('should be case-sensitive: uppercase or mixed-case image MIME types should NOT produce thumbnails', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...IMAGE_MIME_TYPES),
        fc.constantFrom('upper', 'mixed') as fc.Arbitrary<'upper' | 'mixed'>,
        (mimeType: string, caseType: 'upper' | 'mixed') => {
          const modified = caseType === 'upper'
            ? mimeType.toUpperCase()
            : mimeType.charAt(0).toUpperCase() + mimeType.slice(1);

          // The Set uses exact string matching, so case variants should not be images
          const isImage = computeIsImage(modified);

          expect(isImage).withContext(
            `Case-modified MIME type "${modified}" (from "${mimeType}") should NOT be recognized as image (case-sensitive matching)`
          ).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });
});
