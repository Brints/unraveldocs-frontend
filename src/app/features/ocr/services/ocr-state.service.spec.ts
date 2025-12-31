import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OcrStateService } from './ocr-state.service';
import { OcrApiService } from './ocr-api.service';
import { OcrJob, OcrStatus } from '../models/ocr.model';
import { of, throwError } from 'rxjs';

describe('OcrStateService', () => {
  let service: OcrStateService;
  let apiService: jasmine.SpyObj<OcrApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('OcrApiService', [
      'extractText',
      'uploadAndExtractAll',
      'getOcrResults',
      'getOcrData',
      'downloadAsDocx',
      'downloadAsText',
      'downloadAsJson'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OcrStateService,
        { provide: OcrApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(OcrStateService);
    apiService = TestBed.inject(OcrApiService) as jasmine.SpyObj<OcrApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty jobs', () => {
      expect(service.jobs().length).toBe(0);
    });

    it('should not be loading initially', () => {
      expect(service.isLoading()).toBeFalse();
    });

    it('should not be processing initially', () => {
      expect(service.isProcessing()).toBeFalse();
    });

    it('should have no error initially', () => {
      expect(service.error()).toBeNull();
    });
  });

  describe('loadJobs', () => {
    it('should load mock jobs', fakeAsync(() => {
      service.loadJobs();

      expect(service.isLoading()).toBeTrue();

      tick(1000); // Wait for setTimeout

      expect(service.isLoading()).toBeFalse();
      expect(service.jobs().length).toBeGreaterThan(0);
      expect(service.stats()).not.toBeNull();
    }));
  });

  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      service.loadJobs();
      tick(1000);
    }));

    it('should filter processing jobs', () => {
      const processing = service.processingJobs();
      expect(processing.every(j => j.status === 'PROCESSING')).toBeTrue();
    });

    it('should filter completed jobs', () => {
      const completed = service.completedJobs();
      expect(completed.every(j => j.status === 'COMPLETED')).toBeTrue();
    });

    it('should filter failed jobs', () => {
      const failed = service.failedJobs();
      expect(failed.every(j => j.status === 'FAILED')).toBeTrue();
    });

    it('should calculate total jobs', () => {
      expect(service.totalJobs()).toBe(service.jobs().length);
    });

    it('should calculate average confidence', () => {
      const confidence = service.averageConfidence();
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('extractText', () => {
    it('should add a job and update on success', fakeAsync(() => {
      const mockResult = {
        documentId: 'doc-123',
        extractedText: 'Extracted text content',
        confidence: 0.95,
        language: 'en'
      };
      apiService.extractText.and.returnValue(of(mockResult));

      service.extractText('col-123', 'doc-123', 'test.pdf');

      expect(service.isProcessing()).toBeTrue();
      expect(service.jobs().length).toBe(1);
      expect(service.jobs()[0].status).toBe('PROCESSING');

      tick(3000); // Wait for progress simulation

      const completedJob = service.jobs().find(j => j.documentId === 'doc-123');
      expect(completedJob?.status).toBe('COMPLETED');
      expect(completedJob?.extractedText).toBe('Extracted text content');
      expect(service.successMessage()).toBeTruthy();
    }));

    it('should handle extraction errors', fakeAsync(() => {
      apiService.extractText.and.returnValue(throwError(() => new Error('Extraction failed')));

      service.extractText('col-123', 'doc-123', 'test.pdf');

      tick(3000);

      const failedJob = service.jobs()[0];
      expect(failedJob?.status).toBe('FAILED');
      expect(service.error()).toBeTruthy();
    }));
  });

  describe('removeJob', () => {
    beforeEach(fakeAsync(() => {
      service.loadJobs();
      tick(1000);
    }));

    it('should remove a job by ID', () => {
      const initialCount = service.jobs().length;
      const jobToRemove = service.jobs()[0];

      service.removeJob(jobToRemove.id);

      expect(service.jobs().length).toBe(initialCount - 1);
      expect(service.jobs().find(j => j.id === jobToRemove.id)).toBeUndefined();
    });

    it('should clear selected job if removed', () => {
      const job = service.jobs()[0];
      service.selectJob(job);
      expect(service.selectedJob()).toBe(job);

      service.removeJob(job.id);

      expect(service.selectedJob()).toBeNull();
    });
  });

  describe('clearCompleted', () => {
    beforeEach(fakeAsync(() => {
      service.loadJobs();
      tick(1000);
    }));

    it('should remove all completed jobs', () => {
      const initialCompletedCount = service.completedJobs().length;
      expect(initialCompletedCount).toBeGreaterThan(0);

      service.clearCompleted();

      expect(service.completedJobs().length).toBe(0);
    });
  });

  describe('clearFailed', () => {
    beforeEach(fakeAsync(() => {
      service.loadJobs();
      tick(1000);
    }));

    it('should remove all failed jobs', () => {
      const initialFailedCount = service.failedJobs().length;
      expect(initialFailedCount).toBeGreaterThan(0);

      service.clearFailed();

      expect(service.failedJobs().length).toBe(0);
    });
  });

  describe('Filter', () => {
    beforeEach(fakeAsync(() => {
      service.loadJobs();
      tick(1000);
    }));

    it('should filter jobs by status', () => {
      service.setFilter({ status: 'COMPLETED' });

      const filtered = service.filteredJobs();
      expect(filtered.every(j => j.status === 'COMPLETED')).toBeTrue();
    });

    it('should filter jobs by search query', () => {
      service.setFilter({ searchQuery: 'invoice' });

      const filtered = service.filteredJobs();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(j =>
        j.fileName.toLowerCase().includes('invoice') ||
        j.extractedText?.toLowerCase().includes('invoice')
      )).toBeTrue();
    });

    it('should clear filter', () => {
      service.setFilter({ status: 'COMPLETED' });
      expect(service.filter().status).toBe('COMPLETED');

      service.clearFilter();

      expect(service.filter()).toEqual({});
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard and show success message', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      const result = await service.copyToClipboard('Test text');

      expect(result).toBeTrue();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test text');
      expect(service.successMessage()).toBeTruthy();
    });

    it('should handle clipboard errors', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('Failed')));

      const result = await service.copyToClipboard('Test text');

      expect(result).toBeFalse();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('getLanguageName', () => {
    it('should return language name for known codes', () => {
      expect(service.getLanguageName('en')).toBe('English');
      expect(service.getLanguageName('es')).toBe('Spanish');
      expect(service.getLanguageName('fr')).toBe('French');
    });

    it('should return Unknown for unknown codes', () => {
      expect(service.getLanguageName('xyz')).toBe('Unknown');
    });
  });
});

