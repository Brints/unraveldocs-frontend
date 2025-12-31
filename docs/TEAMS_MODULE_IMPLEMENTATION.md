# Teams Module Implementation

## Overview

The Teams module provides comprehensive team subscription management for UnravelDocs, allowing users to create teams, manage members, handle subscriptions, and collaborate on document processing.

## Features

### Team Management
- Create teams with Premium or Enterprise subscriptions
- 10-day free trial for all new teams
- OTP verification for team creation security
- View and manage all teams you own or belong to

### Subscription Tiers

| Feature | Team Premium | Team Enterprise |
|---------|--------------|-----------------|
| Price (Monthly) | $29 | $79 |
| Price (Yearly) | $290 | $790 |
| Max Members | 10 | 15 |
| Document Limit | 200/month | Unlimited |
| Admin Promotion | ❌ | ✅ |
| Email Invitations | ❌ | ✅ |

### Member Management
- Add existing UnravelDocs users by email
- Remove individual or batch members
- Promote members to Admin (Enterprise only)
- Demote admins to Member (Enterprise only)
- View all team members with roles

### Enterprise Features
- **Email Invitations**: Send invitations to users who don't have an account
- **Admin Roles**: Promote trusted members to admins
- **Unlimited Documents**: No monthly document processing limits

## Architecture

### File Structure

```
src/app/features/teams/
├── models/
│   └── team.model.ts          # TypeScript interfaces and types
├── services/
│   ├── team-api.service.ts    # HTTP client for team API
│   ├── team-api.service.spec.ts
│   └── team-state.service.ts  # Reactive state management
├── pages/
│   ├── teams-list/            # View all teams
│   ├── create-team/           # Multi-step team creation wizard
│   ├── team-dashboard/        # Team overview and stats
│   ├── team-members/          # Member management
│   ├── team-invitations/      # Email invitations (Enterprise)
│   ├── team-settings/         # Team settings and subscription
│   └── join-team/             # Accept invitation
└── teams.routes.ts            # Route definitions
```

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/teams` | TeamsListComponent | List all user's teams |
| `/teams/create` | CreateTeamComponent | Multi-step creation wizard |
| `/teams/join/:token` | JoinTeamComponent | Accept invitation |
| `/teams/:teamId` | TeamDashboardComponent | Team overview |
| `/teams/:teamId/members` | TeamMembersComponent | Manage members |
| `/teams/:teamId/invitations` | TeamInvitationsComponent | Email invitations |
| `/teams/:teamId/settings` | TeamSettingsComponent | Team & subscription settings |

## Components

### TeamsListComponent
Displays all teams the user owns or belongs to, with subscription tiers info.

**Features:**
- Separate sections for owned vs joined teams
- Team cards with status badges
- Quick access to team dashboards
- Subscription tier comparison

### CreateTeamComponent
Multi-step wizard for creating a new team.

**Steps:**
1. **Team Details**: Name and description
2. **Subscription**: Choose Premium or Enterprise, billing cycle
3. **Payment**: Select payment gateway (Stripe/Paystack)
4. **Verify**: Enter OTP sent to email

### TeamDashboardComponent
Overview of a specific team with key metrics.

**Features:**
- Team stats (members, documents, billing)
- Quick action cards
- Member preview list
- Trial/cancelled status banners

### TeamMembersComponent
Complete member management interface.

**Features:**
- Search and filter members
- Bulk selection and removal
- Role management (promote/demote)
- Add member modal

### TeamInvitationsComponent
Enterprise-only email invitation management.

**Features:**
- Send new invitations
- View pending invitations
- Cancel invitations
- Upgrade prompt for Premium teams

### TeamSettingsComponent
Team details and subscription management.

**Features:**
- Edit team name/description
- View subscription details
- Upgrade to Enterprise
- Cancel subscription
- Close team permanently

## State Management

The `TeamStateService` uses Angular Signals for reactive state:

```typescript
// State signals
readonly teams = signal<TeamSummary[]>([]);
readonly currentTeam = signal<Team | null>(null);
readonly members = signal<TeamMember[]>([]);
readonly invitations = signal<TeamInvitation[]>([]);

// Computed properties
readonly hasTeams = computed(() => this._teams().length > 0);
readonly ownedTeams = computed(() => this._teams().filter(t => t.isOwner));
readonly isEnterprise = computed(() => this._currentTeam()?.subscriptionType === 'ENTERPRISE');
```

## API Integration

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/teams/initiate` | Start team creation (sends OTP) |
| POST | `/teams/verify` | Verify OTP and create team |
| GET | `/teams/my` | Get all user's teams |
| GET | `/teams/:id` | Get team details |
| GET | `/teams/:id/members` | Get team members |
| POST | `/teams/:id/members` | Add member |
| DELETE | `/teams/:id/members/:memberId` | Remove member |
| POST | `/teams/:id/members/:memberId/promote` | Promote to admin |
| POST | `/teams/:id/invitations` | Send invitation |
| POST | `/teams/invitations/:token/accept` | Accept invitation |
| POST | `/teams/:id/cancel` | Cancel subscription |
| POST | `/teams/:id/reactivate` | Reactivate team |
| DELETE | `/teams/:id` | Close team |

## Styling

Components use scoped CSS with a consistent design system:
- **Colors**: Indigo (`#6366f1`) for primary, Purple (`#a855f7`) for Enterprise
- **Status badges**: Green (active), Yellow (trial), Gray (cancelled), Red (expired)
- **Role badges**: Purple (owner), Indigo (admin), Gray (member)
- **Cards**: White background with subtle borders and hover effects

## Testing

Unit tests cover:
- API service methods
- State management operations
- Component rendering and interactions

Run tests:
```bash
pnpm test -- --include=**/teams/**
```

## Usage Examples

### Creating a Team

```typescript
// In component
teamState.updateWizardState({
  name: 'My Team',
  subscriptionType: 'PREMIUM',
  billingCycle: 'MONTHLY',
  paymentGateway: 'stripe'
});

teamState.initiateTeamCreation();

// After OTP is entered
teamState.updateWizardState({ otp: '123456' });
teamState.verifyAndCreateTeam();
```

### Adding a Member

```typescript
teamState.addMember(teamId, 'colleague@company.com');
```

### Promoting to Admin

```typescript
// Only works for Enterprise teams
teamState.promoteMember(teamId, memberId);
```

## Error Handling

All operations set error messages that are displayed in UI:

```typescript
@if (error()) {
  <div class="alert alert-error">{{ error() }}</div>
}
```

## Security

- All endpoints require authentication
- Team creation requires OTP verification
- Only owners can modify team settings
- Only owners can promote/demote members
- Member email addresses are masked for non-owners

## Future Enhancements

- [ ] Team activity log
- [ ] Document sharing within team
- [ ] Team billing history
- [ ] Role-based permissions
- [ ] Team analytics dashboard

