import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamApiService } from './team-api.service';
import { environment } from '../../../../environments/environment';
import {
  Team,
  TeamSummary,
  TeamMember,
  InitiateTeamRequest
} from '../models/team.model';

describe('TeamApiService', () => {
  let service: TeamApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/teams`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamApiService]
    });

    service = TestBed.inject(TeamApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Team CRUD Operations', () => {
    it('should initiate team creation', () => {
      const request: InitiateTeamRequest = {
        name: 'Test Team',
        subscriptionType: 'PREMIUM',
        billingCycle: 'MONTHLY',
        paymentGateway: 'stripe'
      };

      service.initiateTeamCreation(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/initiate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ statusCode: 200, status: 'success', message: 'OTP sent', data: null });
    });

    it('should verify OTP and create team', () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Test Team',
        teamCode: 'TST123',
        subscriptionType: 'PREMIUM',
        billingCycle: 'MONTHLY',
        subscriptionStatus: 'TRIALING',
        subscriptionPrice: 29,
        currency: 'USD',
        isActive: true,
        isVerified: true,
        isClosed: false,
        autoRenew: true,
        createdAt: new Date().toISOString(),
        currentMemberCount: 1,
        maxMembers: 10,
        monthlyDocumentLimit: 200,
        isOwner: true
      };

      service.verifyAndCreateTeam({ otp: '123456' }).subscribe(team => {
        expect(team).toEqual(mockTeam);
      });

      const req = httpMock.expectOne(`${apiUrl}/verify`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 201, status: 'success', message: 'Team created', data: mockTeam });
    });

    it('should get team by ID', () => {
      const mockTeam: Team = {
        id: 'team-1',
        name: 'Test Team',
        teamCode: 'TST123',
        subscriptionType: 'PREMIUM',
        billingCycle: 'MONTHLY',
        subscriptionStatus: 'ACTIVE',
        subscriptionPrice: 29,
        currency: 'USD',
        isActive: true,
        isVerified: true,
        isClosed: false,
        autoRenew: true,
        createdAt: new Date().toISOString(),
        currentMemberCount: 5,
        maxMembers: 10,
        monthlyDocumentLimit: 200,
        isOwner: true
      };

      service.getTeam('team-1').subscribe(team => {
        expect(team).toEqual(mockTeam);
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, status: 'success', message: 'Team retrieved', data: mockTeam });
    });

    it('should get my teams', () => {
      const mockTeams: TeamSummary[] = [
        {
          id: 'team-1',
          name: 'Team 1',
          teamCode: 'TM1',
          subscriptionType: 'PREMIUM',
          subscriptionStatus: 'ACTIVE',
          currentMemberCount: 5,
          maxMembers: 10,
          isOwner: true
        }
      ];

      service.getMyTeams().subscribe(teams => {
        expect(teams.length).toBe(1);
        expect(teams[0].name).toBe('Team 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/my`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, status: 'success', data: mockTeams });
    });
  });

  describe('Member Management', () => {
    it('should get team members', () => {
      const mockMembers: TeamMember[] = [
        {
          id: 'member-1',
          odId: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'OWNER',
          joinedAt: new Date().toISOString()
        }
      ];

      service.getTeamMembers('team-1').subscribe(members => {
        expect(members.length).toBe(1);
        expect(members[0].firstName).toBe('John');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/members`);
      expect(req.request.method).toBe('GET');
      req.flush({ statusCode: 200, status: 'success', data: mockMembers });
    });

    it('should add member', () => {
      const mockMember: TeamMember = {
        id: 'member-2',
        odId: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'MEMBER',
        joinedAt: new Date().toISOString()
      };

      service.addMember('team-1', { email: 'jane@example.com' }).subscribe(member => {
        expect(member.email).toBe('jane@example.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/members`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 201, status: 'success', data: mockMember });
    });

    it('should remove member', () => {
      service.removeMember('team-1', 'member-1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/team-1/members/member-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ statusCode: 200, status: 'success', data: null });
    });

    it('should promote member to admin', () => {
      const mockMember: TeamMember = {
        id: 'member-1',
        odId: 'user-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'ADMIN',
        joinedAt: new Date().toISOString()
      };

      service.promoteMemberToAdmin('team-1', 'member-1').subscribe(member => {
        expect(member.role).toBe('ADMIN');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/members/member-1/promote`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, status: 'success', data: mockMember });
    });
  });

  describe('Subscription Management', () => {
    it('should cancel subscription', () => {
      const mockTeam: Partial<Team> = {
        id: 'team-1',
        subscriptionStatus: 'CANCELLED',
        autoRenew: false
      };

      service.cancelSubscription('team-1').subscribe(team => {
        expect(team.subscriptionStatus).toBe('CANCELLED');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, status: 'success', data: mockTeam });
    });

    it('should reactivate team', () => {
      const mockTeam: Partial<Team> = {
        id: 'team-1',
        subscriptionStatus: 'ACTIVE',
        isActive: true
      };

      service.reactivateTeam('team-1').subscribe(team => {
        expect(team.subscriptionStatus).toBe('ACTIVE');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/reactivate`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, status: 'success', data: mockTeam });
    });

    it('should close team', () => {
      service.closeTeam('team-1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/team-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ statusCode: 200, status: 'success', data: null });
    });
  });

  describe('Invitations', () => {
    it('should send invitation', () => {
      service.sendInvitation('team-1', { email: 'new@example.com' }).subscribe(url => {
        expect(url).toContain('accept');
      });

      const req = httpMock.expectOne(`${apiUrl}/team-1/invitations`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 201, status: 'success', data: 'https://api.example.com/teams/invitations/token/accept' });
    });

    it('should accept invitation', () => {
      const mockMember: TeamMember = {
        id: 'member-1',
        odId: 'user-1',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        role: 'MEMBER',
        joinedAt: new Date().toISOString()
      };

      service.acceptInvitation('token123').subscribe(member => {
        expect(member.role).toBe('MEMBER');
      });

      const req = httpMock.expectOne(`${apiUrl}/invitations/token123/accept`);
      expect(req.request.method).toBe('POST');
      req.flush({ statusCode: 200, status: 'success', data: mockMember });
    });
  });
});

