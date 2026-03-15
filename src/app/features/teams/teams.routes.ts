import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const teamRoutes: Routes = [
  {
    path: 'teams',
    loadComponent: () => import('../user/components/dashboard-layout/dashboard-layout.component')
      .then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/teams-list/teams-list.component')
          .then(m => m.TeamsListComponent),
        title: 'My Teams - UnravelDocs'
      },
      {
        path: 'create',
        loadComponent: () => import('./pages/create-team/create-team.component')
          .then(m => m.CreateTeamComponent),
        title: 'Create Team - UnravelDocs'
      },
      {
        path: 'join/:token',
        loadComponent: () => import('./pages/join-team/join-team.component')
          .then(m => m.JoinTeamComponent),
        title: 'Join Team - UnravelDocs'
      },
      {
        path: ':teamId',
        loadComponent: () => import('./pages/team-dashboard/team-dashboard.component')
          .then(m => m.TeamDashboardComponent),
        title: 'Team Dashboard - UnravelDocs'
      },
      {
        path: ':teamId/members',
        loadComponent: () => import('./pages/team-members/team-members.component')
          .then(m => m.TeamMembersComponent),
        title: 'Team Members - UnravelDocs'
      },
      {
        path: ':teamId/invitations',
        loadComponent: () => import('./pages/team-invitations/team-invitations.component')
          .then(m => m.TeamInvitationsComponent),
        title: 'Team Invitations - UnravelDocs'
      },
      {
        path: ':teamId/settings',
        loadComponent: () => import('./pages/team-settings/team-settings.component')
          .then(m => m.TeamSettingsComponent),
        title: 'Team Settings - UnravelDocs'
      }
    ]
  }
];

