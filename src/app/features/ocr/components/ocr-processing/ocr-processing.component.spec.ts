import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { OcrProcessingComponent } from './ocr-processing.component';
import { OcrStateService } from '../../services/ocr-state.service';
import { OcrJob, OcrStatus } from '../../models/ocr.model';
import { signal } from '@angular/core';

describe('OcrProcessingComponent', () => {
  let component: OcrProcessingComponent;
  let fixture: ComponentFixture<OcrProcessingComponent>;
  let ocrStateService: jasmine.SpyObj<OcrStateService>;

  const mockJobs: OcrJob[] = [
    {
      id: 'ocr-1',
      collectionId: 'col-1',
      documentId: 'doc-1',
      fileName: 'test.pdf',
      status: 'COMPLETED' as OcrStatus,
      progress: 100,
      extractedText: 'Sample text',
      confidence: 0.95,
      language: 'en',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ocr-2',
      collectionId: 'col-2',
      documentId: 'doc-2',
      fileName: 'processing.pdf',
      status: 'PROCESSING' as OcrStatus,
      progress: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ocr-3',
      collectionId: 'col-3',
      documentId: 'doc-3',
      fileName: 'failed.pdf',
      status: 'FAILED' as OcrStatus,
      progress: 0,
      error: 'Processing failed',
      createdAt: new Date().toISOString()
    }
  ];

  const mockStats = {
    totalProcessed: 100,
    totalPending: 5,
    totalFailed: 2,
    averageConfidence: 94,
    pagesProcessedToday: 10,
    pagesRemaining: 490,
    monthlyLimit: 500
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('OcrStateService', [
      'loadJobs',
      'extractText',
      'uploadAndExtract',
      'selectJob',
      'retryJob',
      'removeJob',
      'downloadText',
      'downloadDocx',
      'downloadJson',
      'copyToClipboard',
      'clearCompleted',
      'clearFailed',
      'clearError',
      'updateFilter',
      'clearFilter'
    ], {
      jobs: signal(mockJobs),
      filteredJobs: signal(mockJobs),
      selectedJob: signal<OcrJob | null>(null),
      stats: signal(mockStats),
      isLoading: signal(false),
      isProcessing: signal(false),
      uploadProgress: signal(0),
      error: signal<string | null>(null),
      successMessage: signal<string | null>(null),
      processingJobs: signal(mockJobs.filter(j => j.status === 'PROCESSING')),
      completedJobs: signal(mockJobs.filter(j => j.status === 'COMPLETED')),
      failedJobs: signal(mockJobs.filter(j => j.status === 'FAILED')),
      pendingJobs: signal([])
    });

    await TestBed.configureTestingModule({
      imports: [
        OcrProcessingComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: OcrStateService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OcrProcessingComponent);
    component = fixture.componentInstance;
    ocrStateService = TestBed.inject(OcrStateService) as jasmine.SpyObj<OcrStateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs on init', () => {
    fixture.detectChanges();
    expect(ocrStateService.loadJobs).toHaveBeenCalled();
  });

  describe('Tab Management', () => {
    it('should start with "all" tab active', () => {
      expect(component.activeTab()).toBe('all');
    });

    it('should change active tab', () => {
      component.setActiveTab('completed');
      expect(component.activeTab()).toBe('completed');
    });

    it('should clear filter when "all" tab is selected', () => {
      component.setActiveTab('all');
      expect(ocrStateService.clearFilter).toHaveBeenCalled();
    });

    it('should update filter when status tab is selected', () => {
      component.setActiveTab('completed');
      expect(ocrStateService.updateFilter).toHaveBeenCalledWith({ status: 'COMPLETED' });
    });
  });

  describe('File Handling', () => {
    it('should handle file selection', () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [mockFile], value: '' } } as unknown as Event;

      component.onFileSelect(event);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.showUploadModal()).toBeTrue();
    });

    it('should filter invalid file types', () => {
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

      // Manually call handleFiles through onFileSelect
      const event = { target: { files: [validFile, invalidFile], value: '' } } as unknown as Event;
      component.onFileSelect(event);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.selectedFiles()[0].name).toBe('test.pdf');
    });

    it('should remove file from selection', () => {
      const file1 = new File(['test'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['test'], 'test2.pdf', { type: 'application/pdf' });

      const event = { target: { files: [file1, file2], value: '' } } as unknown as Event;
      component.onFileSelect(event);

      expect(component.selectedFiles().length).toBe(2);

      component.removeFile(0);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.selectedFiles()[0].name).toBe('test2.pdf');
    });
  });

  describe('Job Actions', () => {
    it('should view result for completed job', () => {
      const job = mockJobs[0];

      component.viewResult(job);

      expect(ocrStateService.selectJob).toHaveBeenCalledWith(job);
      expect(component.showResultModal()).toBeTrue();
    });

    it('should retry failed job', () => {
      const job = mockJobs[2];

      component.retryJob(job);

      expect(ocrStateService.retryJob).toHaveBeenCalledWith(job);
    });

    it('should remove job', () => {
      const job = mockJobs[0];

      component.removeJob(job);

      expect(ocrStateService.removeJob).toHaveBeenCalledWith(job.id);
    });

    it('should download text', () => {
      const job = mockJobs[0];

      component.downloadText(job);

      expect(ocrStateService.downloadText).toHaveBeenCalledWith(job);
    });

    it('should download docx', () => {
      const job = mockJobs[0];

      component.downloadDocx(job);

      expect(ocrStateService.downloadDocx).toHaveBeenCalledWith(job);
    });

    it('should copy text to clipboard', () => {
      const text = 'Test text';

      component.copyText(text);

      expect(ocrStateService.copyToClipboard).toHaveBeenCalledWith(text);
    });
  });

  describe('Bulk Actions', () => {
    it('should clear completed jobs', () => {
      component.clearCompleted();
      expect(ocrStateService.clearCompleted).toHaveBeenCalled();
    });

    it('should clear failed jobs', () => {
      component.clearFailed();
      expect(ocrStateService.clearFailed).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should format file size correctly', () => {
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(undefined)).toBe('—');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-12-15T10:30:00');
      const formatted = component.formatDate(date.toISOString());
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('15');
    });

    it('should return correct status icon path', () => {
      expect(component.getStatusIcon('COMPLETED')).toContain('M9 12l2 2');
      expect(component.getStatusIcon('PROCESSING')).toContain('M4 4v5h');
      expect(component.getStatusIcon('FAILED')).toContain('M10 14l2-2');
    });

    it('should return correct status color class', () => {
      expect(component.getStatusColor('COMPLETED')).toContain('green');
      expect(component.getStatusColor('PROCESSING')).toContain('blue');
      expect(component.getStatusColor('FAILED')).toContain('red');
    });

    it('should format confidence correctly', () => {
      expect(component.formatConfidence(0.95)).toBe('95%');
      expect(component.formatConfidence(0.5)).toBe('50%');
      expect(component.formatConfidence(undefined)).toBe('—');
    });

    it('should calculate usage percentage', () => {
      const percentage = component.getUsagePercentage();
      expect(percentage).toBe(2); // (500-490)/500 * 100 = 2%
    });
  });

  describe('Modal Management', () => {
    it('should open upload modal', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file], value: '' } } as unknown as Event;

      component.onFileSelect(event);

      expect(component.showUploadModal()).toBeTrue();
    });

    it('should close upload modal and clear files', () => {
      component.selectedFiles.set([new File(['test'], 'test.pdf', { type: 'application/pdf' })]);
      component.showUploadModal.set(true);

      component.closeUploadModal();

      expect(component.showUploadModal()).toBeFalse();
      expect(component.selectedFiles().length).toBe(0);
    });

    it('should close result modal', () => {
      component.showResultModal.set(true);

      component.closeResultModal();

      expect(component.showResultModal()).toBeFalse();
      expect(ocrStateService.selectJob).toHaveBeenCalledWith(null);
    });
  });

  describe('Drag and Drop', () => {
    it('should set drag over state on dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');

      component.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver()).toBeTrue();
    });

    it('should clear drag over state on dragleave', () => {
      component.isDragOver.set(true);
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');

      component.onDragLeave(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver()).toBeFalse();
    });
  });
});

