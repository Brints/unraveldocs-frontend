import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OcrApiService } from './ocr-api.service';
import { environment } from '../../../../environments/environment';

describe('OcrApiService', () => {
  let service: OcrApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OcrApiService]
    });

    service = TestBed.inject(OcrApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('extractText', () => {
    it('should extract text from a document', () => {
      const collectionId = 'col-123';
      const documentId = 'doc-456';
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'Text extraction completed successfully',
        data: {
          documentId: 'doc-456',
          extractedText: 'Sample extracted text',
          confidence: 0.95,
          language: 'en'
        }
      };

      service.extractText(collectionId, documentId).subscribe(result => {
        expect(result.documentId).toBe('doc-456');
        expect(result.extractedText).toBe('Sample extracted text');
        expect(result.confidence).toBe(0.95);
        expect(result.language).toBe('en');
      });

      const req = httpMock.expectOne(`${apiUrl}/collections/${collectionId}/document/${documentId}/extract`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getOcrResults', () => {
    it('should get OCR results for a collection', () => {
      const collectionId = 'col-123';
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'OCR results retrieved successfully',
        data: {
          collectionId: 'col-123',
          results: [
            {
              documentId: 'doc-1',
              fileName: 'test.pdf',
              extractedText: 'Test text',
              status: 'COMPLETED'
            }
          ]
        }
      };

      service.getOcrResults(collectionId).subscribe(result => {
        expect(result.collectionId).toBe('col-123');
        expect(result.results.length).toBe(1);
        expect(result.results[0].status).toBe('COMPLETED');
      });

      const req = httpMock.expectOne(`${apiUrl}/collections/${collectionId}/document/results`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getOcrData', () => {
    it('should get OCR data for a specific document', () => {
      const collectionId = 'col-123';
      const documentId = 'doc-456';
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'OCR data retrieved successfully',
        data: {
          documentId: 'doc-456',
          fileName: 'document.pdf',
          extractedText: 'The extracted text...',
          confidence: 0.95
        }
      };

      service.getOcrData(collectionId, documentId).subscribe(result => {
        expect(result.documentId).toBe('doc-456');
        expect(result.fileName).toBe('document.pdf');
        expect(result.confidence).toBe(0.95);
      });

      const req = httpMock.expectOne(`${apiUrl}/collections/${collectionId}/document/${documentId}/ocr-data`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('downloadAsDocx', () => {
    it('should download document as DOCX', () => {
      const collectionId = 'col-123';
      const documentId = 'doc-456';
      const mockBlob = new Blob(['test content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      service.downloadAsDocx(collectionId, documentId).subscribe(result => {
        expect(result).toBeTruthy();
        expect(result instanceof Blob).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/collections/${collectionId}/documents/${documentId}/download/docx`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('downloadAsText', () => {
    it('should create a download for text content', () => {
      const text = 'Sample text content';
      const fileName = 'test-file';

      // Mock URL.createObjectURL and document.createElement
      const mockUrl = 'blob:test-url';
      const mockLink = { href: '', download: '', click: jasmine.createSpy('click') };

      spyOn(URL, 'createObjectURL').and.returnValue(mockUrl);
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue(mockLink as unknown as HTMLAnchorElement);

      service.downloadAsText(text, fileName);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe(`${fileName}.txt`);
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
});

