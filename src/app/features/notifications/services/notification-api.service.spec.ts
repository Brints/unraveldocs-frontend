import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationApiService } from './notification-api.service';
import { environment } from '../../../../environments/environment';
import {
  Device,
  PaginatedNotifications,
  NotificationPreferences,
  RegisterDeviceRequest,
  UpdatePreferencesRequest,
} from '../models/notification.model';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationApiService]
    });

    service = TestBed.inject(NotificationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Device Management', () => {
    it('should register a device', () => {
      const request: RegisterDeviceRequest = {
        deviceToken: 'test-token-123',
        deviceType: 'WEB',
        deviceName: 'Chrome on Windows'
      };

      const mockDevice: Device = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        deviceToken: 'test****123',
        deviceType: 'WEB',
        deviceName: 'Chrome on Windows',
        isActive: true,
        createdAt: '2026-01-08T12:00:00Z',
        lastUsedAt: null
      };

      service.registerDevice(request).subscribe(device => {
        expect(device).toEqual(mockDevice);
      });

      const req = httpMock.expectOne(`${apiUrl}/device`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockDevice);
    });

    it('should unregister a device', () => {
      const tokenId = '550e8400-e29b-41d4-a716-446655440000';

      service.unregisterDevice(tokenId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/device/${tokenId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should get registered devices', () => {
      const mockDevices: Device[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          deviceToken: 'test****123',
          deviceType: 'WEB',
          deviceName: 'Chrome on Windows',
          isActive: true,
          createdAt: '2026-01-08T12:00:00Z',
          lastUsedAt: '2026-01-08T14:30:00Z'
        }
      ];

      service.getDevices().subscribe(devices => {
        expect(devices).toEqual(mockDevices);
      });

      const req = httpMock.expectOne(`${apiUrl}/devices`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDevices);
    });
  });

  describe('Notifications', () => {
    it('should get notifications with pagination', () => {
      const mockResponse: PaginatedNotifications = {
        content: [
          {
            id: '660e8400-e29b-41d4-a716-446655440000',
            type: 'DOCUMENT_UPLOAD_SUCCESS',
            typeDisplayName: 'Document Upload Success',
            category: 'document',
            title: 'Document Uploaded',
            message: 'Your document has been uploaded successfully.',
            data: { documentId: 'abc123' },
            isRead: false,
            createdAt: '2026-01-08T12:00:00Z',
            readAt: null
          }
        ],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { sorted: true, direction: 'DESC' }
        },
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        numberOfElements: 1
      };

      service.getNotifications(0, 20).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get unread notifications', () => {
      const mockResponse: PaginatedNotifications = {
        content: [],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { sorted: true, direction: 'DESC' }
        },
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        numberOfElements: 0
      };

      service.getUnreadNotifications(0, 20).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/unread?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get unread count', () => {
      service.getUnreadCount().subscribe(response => {
        expect(response.count).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/unread-count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });
    });

    it('should mark notification as read', () => {
      const notificationId = '660e8400-e29b-41d4-a716-446655440000';

      service.markAsRead(notificationId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${notificationId}/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });

    it('should mark all notifications as read', () => {
      service.markAllAsRead().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/read-all`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });

    it('should delete notification', () => {
      const notificationId = '660e8400-e29b-41d4-a716-446655440000';

      service.deleteNotification(notificationId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${notificationId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should get notifications by type', () => {
      const mockResponse: PaginatedNotifications = {
        content: [],
        pageable: {
          pageNumber: 0,
          pageSize: 10,
          sort: { sorted: true, direction: 'DESC' }
        },
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        numberOfElements: 0
      };

      service.getNotificationsByType('PAYMENT_SUCCESS', 0, 10).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/by-type/PAYMENT_SUCCESS?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Preferences', () => {
    it('should get notification preferences', () => {
      const mockPreferences: NotificationPreferences = {
        id: '770e8400-e29b-41d4-a716-446655440000',
        pushEnabled: true,
        emailEnabled: true,
        documentNotifications: true,
        ocrNotifications: true,
        paymentNotifications: true,
        storageNotifications: true,
        subscriptionNotifications: true,
        teamNotifications: true,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-08T12:00:00Z'
      };

      service.getPreferences().subscribe(preferences => {
        expect(preferences).toEqual(mockPreferences);
      });

      const req = httpMock.expectOne(`${apiUrl}/preferences`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferences);
    });

    it('should update notification preferences', () => {
      const request: UpdatePreferencesRequest = {
        pushEnabled: true,
        emailEnabled: false,
        documentNotifications: true,
        ocrNotifications: false,
        paymentNotifications: true,
        storageNotifications: true,
        subscriptionNotifications: true,
        teamNotifications: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00:00',
        quietHoursEnd: '07:00:00'
      };

      const mockResponse: NotificationPreferences = {
        id: '770e8400-e29b-41d4-a716-446655440000',
        pushEnabled: true,
        emailEnabled: false,
        documentNotifications: true,
        ocrNotifications: false,
        paymentNotifications: true,
        storageNotifications: true,
        subscriptionNotifications: true,
        teamNotifications: true,
        quietHoursEnabled: true,
        quietHoursStart: '22:00:00',
        quietHoursEnd: '07:00:00',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-08T12:30:00Z'
      };

      service.updatePreferences(request).subscribe(preferences => {
        expect(preferences).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/preferences`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
});

