import { Component, Input, Output, EventEmitter, signal, computed, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Select date';
  @Input() required = false;
  @Input() disabled = false;
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() helpText = '';

  @Output() dateSelected = new EventEmitter<Date | null>();

  // State
  isOpen = signal(false);
  selectedDate = signal<Date | null>(null);
  displayValue = signal('');

  // Current view state
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());

  // Touch tracking
  touched = false;

  // ControlValueAccessor
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Computed
  monthName = computed(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[this.currentMonth()];
  });

  calendarDays = computed(() => {
    return this.generateCalendarDays(this.currentYear(), this.currentMonth());
  });

  // ControlValueAccessor implementation
  writeValue(value: Date | null): void {
    if (value) {
      this.selectedDate.set(value);
      this.displayValue.set(this.formatDate(value));
      this.currentMonth.set(value.getMonth());
      this.currentYear.set(value.getFullYear());
    } else {
      this.selectedDate.set(null);
      this.displayValue.set('');
    }
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Methods
  toggleCalendar(): void {
    if (this.disabled) return;
    this.isOpen.update(v => !v);
    if (!this.touched) {
      this.markAsTouched();
    }
  }

  closeCalendar(): void {
    this.isOpen.set(false);
  }

  selectDate(date: Date): void {
    if (this.isDateDisabled(date)) return;

    this.selectedDate.set(date);
    this.displayValue.set(this.formatDate(date));
    this.onChange(date);
    this.dateSelected.emit(date);
    this.closeCalendar();
    this.markAsTouched();
  }

  clearDate(): void {
    this.selectedDate.set(null);
    this.displayValue.set('');
    this.onChange(null);
    this.dateSelected.emit(null);
    this.markAsTouched();
  }

  previousMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  previousYear(): void {
    this.currentYear.update(y => y - 1);
  }

  nextYear(): void {
    this.currentYear.update(y => y + 1);
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
  }

  private markAsTouched(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: this.isDateDisabled(date)
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      const selected = this.selectedDate();
      const isSelected = selected ?
        date.getTime() === selected.getTime() : false;

      const isToday = date.getTime() === today.getTime();

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isDisabled: this.isDateDisabled(date)
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: this.isDateDisabled(date)
      });
    }

    return days;
  }

  private isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) return true;
    if (this.maxDate && date > this.maxDate) return true;
    return false;
  }

  isCurrentMonthAndYear(): boolean {
    const today = new Date();
    return this.currentMonth() === today.getMonth() &&
           this.currentYear() === today.getFullYear();
  }
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

