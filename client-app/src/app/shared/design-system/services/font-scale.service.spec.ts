import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { FontScaleService, FontScale } from './font-scale.service';

describe('FontScaleService', () => {
  let service: FontScaleService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FontScaleService]
    });
    service = TestBed.inject(FontScaleService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up attributes and styles after each test
    document.documentElement.removeAttribute('data-scale');
    document.documentElement.style.removeProperty('--ds-font-size-base');
    document.documentElement.style.removeProperty('--ds-line-height-base');
    document.documentElement.style.removeProperty('--ds-spacing-unit');
    document.documentElement.style.removeProperty('--ds-table-row-height');
    document.documentElement.style.removeProperty('--ds-input-height');
  });

  describe('applyScale - small', () => {
    it('should set data-scale attribute to small', () => {
      service.applyScale('small');

      expect(document.documentElement.getAttribute('data-scale')).toBe('small');
    });

    it('should set correct CSS custom properties for small scale', () => {
      service.applyScale('small');

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--ds-font-size-base')).toBe('0.85rem');
      expect(root.style.getPropertyValue('--ds-line-height-base')).toBe('1.4');
      expect(root.style.getPropertyValue('--ds-spacing-unit')).toBe('0.2rem');
      expect(root.style.getPropertyValue('--ds-table-row-height')).toBe('2rem');
      expect(root.style.getPropertyValue('--ds-input-height')).toBe('2rem');
    });
  });

  describe('applyScale - regular', () => {
    it('should remove data-scale attribute for regular (baseline) scale', () => {
      // First apply 'small' so the attribute exists
      service.applyScale('small');
      expect(document.documentElement.getAttribute('data-scale')).toBe('small');

      // Now apply regular
      service.applyScale('regular');
      expect(document.documentElement.getAttribute('data-scale')).toBeNull();
    });

    it('should set correct CSS custom properties for regular scale', () => {
      service.applyScale('regular');

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--ds-font-size-base')).toBe('1rem');
      expect(root.style.getPropertyValue('--ds-line-height-base')).toBe('1.5');
      expect(root.style.getPropertyValue('--ds-spacing-unit')).toBe('0.25rem');
      expect(root.style.getPropertyValue('--ds-table-row-height')).toBe('2.5rem');
      expect(root.style.getPropertyValue('--ds-input-height')).toBe('2.5rem');
    });
  });

  describe('applyScale - large', () => {
    it('should set data-scale attribute to large', () => {
      service.applyScale('large');

      expect(document.documentElement.getAttribute('data-scale')).toBe('large');
    });

    it('should set correct CSS custom properties for large scale', () => {
      service.applyScale('large');

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--ds-font-size-base')).toBe('1.2rem');
      expect(root.style.getPropertyValue('--ds-line-height-base')).toBe('1.6');
      expect(root.style.getPropertyValue('--ds-spacing-unit')).toBe('0.3rem');
      expect(root.style.getPropertyValue('--ds-table-row-height')).toBe('3rem');
      expect(root.style.getPropertyValue('--ds-input-height')).toBe('3rem');
    });
  });

  describe('applyScale - invalid value', () => {
    it('should fall back to regular when an invalid scale is provided', () => {
      service.applyScale('extra-large' as FontScale);

      expect(service.getScale()).toBe('regular');
      expect(document.documentElement.getAttribute('data-scale')).toBeNull();
    });
  });

  describe('getScale', () => {
    it('should return regular as the initial default scale', () => {
      expect(service.getScale()).toBe('regular');
    });

    it('should return the currently applied scale', () => {
      service.applyScale('large');

      expect(service.getScale()).toBe('large');
    });

    it('should return small after applying small', () => {
      service.applyScale('small');

      expect(service.getScale()).toBe('small');
    });
  });

  describe('getDefaultScale', () => {
    it('should return regular', () => {
      expect(service.getDefaultScale()).toBe('regular');
    });
  });

  describe('applyDefault', () => {
    it('should reset to regular scale', () => {
      service.applyScale('large');
      service.applyDefault();

      expect(service.getScale()).toBe('regular');
      expect(document.documentElement.getAttribute('data-scale')).toBeNull();
    });
  });
});
