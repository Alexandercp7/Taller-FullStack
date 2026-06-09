import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSend, lucideTrash2 } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { ActivitiesService } from '../../services/activities.service';
import { Activity, Comment } from '../../models/activity.model';

export interface ActivityDetailDialogContext {
  activity: Activity;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

@Component({
  selector: 'spartan-activity-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmBadgeImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideSend, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-detail-dialog.html',
  styleUrl: './activity-detail-dialog.css',
})
export class ActivityDetailDialogComponent {
  private readonly _dialogRef = inject(BrnDialogRef<unknown>);
  private readonly _context = injectBrnDialogContext<ActivityDetailDialogContext>();
  private readonly activitiesService = inject(ActivitiesService);

  protected readonly activity = signal(this._context.activity);
  protected readonly newComment = signal('');
  protected readonly currentUser = 'Admin';

  protected tagStyle(etiqueta: string): string {
    switch (etiqueta) {
      case 'Administrativa':
        return 'tag-administrative';
      case 'Técnica':
        return 'tag-technical';
      case 'Comercial':
        return 'tag-commercial';
      case 'Compras':
        return 'tag-purchasing';
      case 'Mantenimiento':
        return 'tag-maintenance';
      default:
        return 'tag-default';
    }
  }

  protected priorityClass(prioridad: string): string {
    switch (prioridad) {
      case 'Alta':
        return 'priority-high';
      case 'Media':
        return 'priority-medium';
      case 'Baja':
        return 'priority-low';
      default:
        return '';
    }
  }

  protected onAddComment(): void {
    if (!this.newComment().trim()) return;

    const comment = this.activitiesService.generateCommentWithId(
      this.newComment(),
      this.currentUser
    );

    this.activitiesService.addComment(this.activity().id, comment);
    this._context.onCommentAdded?.(comment);

    this.activity.set({
      ...this.activity(),
      comentarios: [...this.activity().comentarios, comment]
    });

    this.newComment.set('');
  }

  protected onDeleteComment(commentId: string): void {
    this.activitiesService.deleteComment(this.activity().id, commentId);
    this._context.onCommentDeleted?.(commentId);

    this.activity.set({
      ...this.activity(),
      comentarios: this.activity().comentarios.filter(c => c.id !== commentId)
    });
  }

  protected formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected close(): void {
    this._dialogRef.close();
  }
}
