import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamStateService } from '../../services/team-state.service';
import { TeamMember, TeamMemberRole } from '../../models/team.model';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './team-members.component.html',
  styleUrls: ['./team-members.component.css']
})
export class TeamMembersComponent implements OnInit {
  protected readonly teamState = inject(TeamStateService);
  private readonly route = inject(ActivatedRoute);

  readonly team = this.teamState.currentTeam;
  readonly members = this.teamState.members;
  readonly isLoading = this.teamState.isLoadingMembers;
  readonly isProcessing = this.teamState.isProcessing;
  readonly error = this.teamState.error;
  readonly successMessage = this.teamState.successMessage;
  readonly isOwner = this.teamState.currentTeamIsOwner;
  readonly isEnterprise = this.teamState.currentTeamIsEnterprise;
  readonly canAddMembers = this.teamState.canAddMembers;
  readonly remainingSlots = this.teamState.remainingSlots;

  // Local state
  showAddModal = signal(false);
  showRemoveModal = signal(false);
  memberToRemove = signal<TeamMember | null>(null);
  newMemberEmail = '';
  searchQuery = '';
  selectedMembers = signal<string[]>([]);

  private teamId = '';

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    if (this.teamId) {
      if (!this.team()) {
        this.teamState.loadTeam(this.teamId);
      }
      this.teamState.loadTeamMembers(this.teamId);
    }
  }

  get filteredMembers(): TeamMember[] {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.members();
    return this.members().filter(m =>
      m.firstName.toLowerCase().includes(query) ||
      m.lastName.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query)
    );
  }

  openAddModal(): void {
    this.newMemberEmail = '';
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.newMemberEmail = '';
  }

  addMember(): void {
    if (!this.newMemberEmail.trim()) return;
    this.teamState.addMember(this.teamId, this.newMemberEmail.trim());
    this.closeAddModal();
  }

  confirmRemove(member: TeamMember): void {
    this.memberToRemove.set(member);
    this.showRemoveModal.set(true);
  }

  closeRemoveModal(): void {
    this.showRemoveModal.set(false);
    this.memberToRemove.set(null);
  }

  removeMember(): void {
    const member = this.memberToRemove();
    if (member) {
      this.teamState.removeMember(this.teamId, member.id);
      this.closeRemoveModal();
    }
  }

  toggleSelectMember(memberId: string): void {
    this.selectedMembers.update(selected => {
      if (selected.includes(memberId)) {
        return selected.filter(id => id !== memberId);
      }
      return [...selected, memberId];
    });
  }

  isSelected(memberId: string): boolean {
    return this.selectedMembers().includes(memberId);
  }

  removeSelected(): void {
    const selected = this.selectedMembers();
    if (selected.length > 0) {
      this.teamState.batchRemoveMembers(this.teamId, selected);
      this.selectedMembers.set([]);
    }
  }

  promoteMember(member: TeamMember): void {
    this.teamState.promoteMember(this.teamId, member.id);
  }

  demoteMember(member: TeamMember): void {
    this.teamState.demoteMember(this.teamId, member.id);
  }

  canModifyMember(member: TeamMember): boolean {
    return member.role !== 'OWNER' && this.isOwner();
  }

  canPromote(member: TeamMember): boolean {
    return member.role === 'MEMBER' && this.isOwner() && this.isEnterprise();
  }

  canDemote(member: TeamMember): boolean {
    return member.role === 'ADMIN' && this.isOwner() && this.isEnterprise();
  }

  getRoleClass(role: TeamMemberRole): string {
    switch (role) {
      case 'OWNER': return 'role-owner';
      case 'ADMIN': return 'role-admin';
      default: return 'role-member';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

