import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe that safely renders server-side highlighted HTML (containing `<mark>` elements)
 * by bypassing Angular's default HTML sanitization.
 *
 * The server is trusted to produce safe highlighted HTML. This pipe uses
 * `DomSanitizer.bypassSecurityTrustHtml()` to render the pre-sanitized content.
 *
 * Falls back to an empty string when the input is null, undefined, or empty.
 *
 * @example
 * ```html
 * <span [innerHTML]="result.highlightedTitle | searchHighlight"></span>
 * ```
 */
@Pipe({
  name: 'searchHighlight',
  standalone: true
})
export class SearchHighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value || value.trim().length === 0) {
      return '';
    }

    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
