import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { FileUploadComponent, IFileEntry } from './file-upload.component';

/**
 * Property 21: File validation (extension and size)
 *
 * For any file selected for upload: if its extension is not in the configured
 * `accept` list OR its size exceeds the configured `maxSize`, the file SHALL be
 * rejected with a per-file error message indicating the specific validation failure.
 * In a multi-file batch, only invalid files SHALL be rejected while valid files are retained.
 *
 * **Validates: Requirements 8.6, 8.7**
 */

/** Arbitrary for generating file extensions (with leading dot) */
const extensionArb = fc.constantFrom('.pdf', '.docx', '.jpg', '.png', '.gif', '.xlsx', '.csv', '.txt', '.zip', '.mp4');

/** Arbitrary for generating a non-empty accept list (comma-separated extensions) */
const acceptListArb = fc.uniqueArray(extensionArb, { minLength: 1, maxLength: 5 }).map(
  (exts) => exts.join(',')
);

/** Arbitrary for generating a max file size in MB (1 to 100) */
const maxSizeArb = fc.integer({ min: 1, max: 100 });



/** Helper to create a mock File object with given name and size */
function createMockFile(name: string, sizeBytes: number, type: string = 'application/octet-stream'): File {
  // Create a file-like object matching the File interface
  const blob = new Blob(['x'.repeat(Math.min(sizeBytes, 100))], { type });
  const file = new File([blob], name, { type });
  // Override size property since Blob content may not match desired size
  Object.defineProperty(file, 'size', { value: sizeBytes, writable: false });
  return file;
}

describe('File Validation Property (Extension and Size)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();
  });

  it('files with invalid extensions SHALL be rejected with an extension error message', () => {
    fc.assert(
      fc.property(
        acceptListArb,
        maxSizeArb,
        extensionArb,
        (acceptList: string, maxSize: number, fileExt: string) => {
          const allowedExtensions = acceptList.split(',').map(e => e.trim().toLowerCase());

          // Only test when the file extension is NOT in the accept list
          if (allowedExtensions.includes(fileExt.toLowerCase())) return;

          const fixture = TestBed.createComponent(FileUploadComponent);
          const component = fixture.componentInstance;

          component.multiple = true;
          component.maxFiles = 10;
          component.accept = acceptList;
          component.maxSize = maxSize;
          fixture.detectChanges();

          // Create a file with a valid size but invalid extension
          const validSizeBytes = (maxSize - 1) * 1024 * 1024; // under limit
          const fileName = `testfile${fileExt}`;
          const file = createMockFile(fileName, validSizeBytes);

          // Process the file through the component
          (component as unknown as { processFiles(files: File[]): void }).processFiles([file]);

          const entries: IFileEntry[] = component.fileEntries();
          expect(entries.length).toBe(1);

          const entry = entries[0];
          expect(entry.status).toBe('error');
          expect(entry.error).not.toBeNull();
          expect(entry.error!.toLowerCase()).toContain('not allowed');

          fixture.destroy();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('files exceeding maxSize SHALL be rejected with a size error message', () => {
    fc.assert(
      fc.property(
        maxSizeArb,
        fc.integer({ min: 1, max: 100 }),
        (maxSize: number, extraMB: number) => {
          const fixture = TestBed.createComponent(FileUploadComponent);
          const component = fixture.componentInstance;

          component.multiple = true;
          component.maxFiles = 10;
          component.accept = ''; // no extension restriction
          component.maxSize = maxSize;
          fixture.detectChanges();

          // Create a file that exceeds the max size
          const oversizeBytes = (maxSize + extraMB) * 1024 * 1024 + 1;
          const file = createMockFile('document.pdf', oversizeBytes);

          (component as unknown as { processFiles(files: File[]): void }).processFiles([file]);

          const entries: IFileEntry[] = component.fileEntries();
          expect(entries.length).toBe(1);

          const entry = entries[0];
          expect(entry.status).toBe('error');
          expect(entry.error).not.toBeNull();
          expect(entry.error!.toLowerCase()).toContain('exceeds');

          fixture.destroy();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('files with valid extension and valid size SHALL be accepted without error', () => {
    fc.assert(
      fc.property(
        acceptListArb,
        maxSizeArb,
        (acceptList: string, maxSize: number) => {
          const allowedExtensions = acceptList.split(',').map(e => e.trim().toLowerCase());
          const chosenExt = allowedExtensions[0]; // pick first allowed extension

          const fixture = TestBed.createComponent(FileUploadComponent);
          const component = fixture.componentInstance;

          component.multiple = true;
          component.maxFiles = 10;
          component.accept = acceptList;
          component.maxSize = maxSize;
          fixture.detectChanges();

          // Create a file with valid extension and valid size
          const validSizeBytes = Math.floor(maxSize * 1024 * 1024 * 0.5); // 50% of max
          const file = createMockFile(`validfile${chosenExt}`, validSizeBytes);

          (component as unknown as { processFiles(files: File[]): void }).processFiles([file]);

          const entries: IFileEntry[] = component.fileEntries();
          expect(entries.length).toBe(1);

          const entry = entries[0];
          expect(entry.status).toBe('pending');
          expect(entry.error).toBeNull();

          fixture.destroy();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('in a multi-file batch, only invalid files SHALL be rejected while valid files are retained', () => {
    fc.assert(
      fc.property(
        acceptListArb,
        maxSizeArb,
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 4 }),
        (acceptList: string, maxSize: number, validCount: number, invalidCount: number) => {
          const allowedExtensions = acceptList.split(',').map(e => e.trim().toLowerCase());
          const chosenValidExt = allowedExtensions[0];

          // Pick an extension NOT in the allowed list for invalid files
          const allExts = ['.pdf', '.docx', '.jpg', '.png', '.gif', '.xlsx', '.csv', '.txt', '.zip', '.mp4'];
          const invalidExts = allExts.filter(e => !allowedExtensions.includes(e));
          if (invalidExts.length === 0) return; // skip if all extensions are allowed

          const invalidExt = invalidExts[0];

          const fixture = TestBed.createComponent(FileUploadComponent);
          const component = fixture.componentInstance;

          component.multiple = true;
          component.maxFiles = 10;
          component.accept = acceptList;
          component.maxSize = maxSize;
          fixture.detectChanges();

          const validSizeBytes = Math.floor(maxSize * 1024 * 1024 * 0.5);
          const files: File[] = [];

          // Create valid files
          for (let i = 0; i < validCount; i++) {
            files.push(createMockFile(`valid${i}${chosenValidExt}`, validSizeBytes));
          }

          // Create invalid files (wrong extension)
          for (let i = 0; i < invalidCount; i++) {
            files.push(createMockFile(`invalid${i}${invalidExt}`, validSizeBytes));
          }

          const emittedFiles: File[] = [];
          component.filesSelected.subscribe((f: File[]) => emittedFiles.push(...f));

          (component as unknown as { processFiles(files: File[]): void }).processFiles(files);

          const entries: IFileEntry[] = component.fileEntries();

          // Total entries should include both valid and invalid
          expect(entries.length).toBe(validCount + invalidCount);

          // Valid files should be pending
          const validEntries = entries.filter(e => e.status === 'pending');
          expect(validEntries.length).toBe(validCount);

          // Invalid files should have errors
          const invalidEntries = entries.filter(e => e.status === 'error');
          expect(invalidEntries.length).toBe(invalidCount);

          // Only valid files should have been emitted via filesSelected
          expect(emittedFiles.length).toBe(validCount);

          fixture.destroy();
        }
      ),
      { numRuns: 50 }
    );
  });
});
