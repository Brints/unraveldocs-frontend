import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-storage-usage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storage-usage.component.html',
  styleUrls: ['./storage-usage.component.css']
})
export class StorageUsageComponent implements OnInit {
  private readonly userState = inject(UserStateService);

  // State from service
  readonly storageInfo = this.userState.storageInfo;
  readonly isLoading = this.userState.isLoading;
  readonly error = this.userState.error;

  // Computed properties
  readonly storagePercentage = computed(() => {
    const info = this.storageInfo();
    if (!info || info.storageLimit === 0 || info.unlimited) return 0;
    return Math.min(info.percentageUsed, 100);
  });

  readonly documentsPercentage = computed(() => {
    const info = this.storageInfo();
    if (!info || info.documentUploadLimit === 0 || info.documentsUnlimited) return 0;
    return Math.min(Math.round((info.documentsUploaded / info.documentUploadLimit) * 100), 100);
  });

  readonly ocrPercentage = computed(() => {
    const info = this.storageInfo();
    if (!info || info.ocrPageLimit === 0 || info.ocrUnlimited) return 0;
    return Math.min(Math.round((info.ocrPagesUsed / info.ocrPageLimit) * 100), 100);
  });

  readonly quotaResetFormatted = computed(() => {
    const info = this.storageInfo();
    if (!info?.quotaResetDate) return null;

    const resetDate = new Date(info.quotaResetDate);
    return resetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  readonly daysUntilReset = computed(() => {
    const info = this.storageInfo();
    if (!info?.quotaResetDate) return null;

    const now = new Date();
    const resetDate = new Date(info.quotaResetDate);
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  });

  ngOnInit(): void {
    this.userState.loadStorageInfo();
  }

  refreshData(): void {
    this.userState.loadStorageInfo();
  }

  getProgressBarClass(percentage: number, isExceeded: boolean): string {
    if (isExceeded) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-indigo-500';
  }

  getStatusBadgeClass(isExceeded: boolean): string {
    if (isExceeded) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-green-100 text-green-700 border-green-200';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
