import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IScoreHistoryEntity } from '../../../core/domain/entities/score-history.entity';

export interface PendingScoreRequestViewModel extends IScoreHistoryEntity {
  readonly unitName: string;
  readonly requestedByName: string;
}

@Component({
  selector: 'app-pending-score-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-score-requests.component.html',
})
export class PendingScoreRequestsComponent {
  @Input({ required: true })
  items: readonly PendingScoreRequestViewModel[] = [];

  @Output() readonly approveRequested = new EventEmitter<string>();
  @Output() readonly rejectRequested = new EventEmitter<string>();
}
