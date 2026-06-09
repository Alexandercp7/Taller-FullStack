import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideCamera } from '@ng-icons/lucide';

export interface PhotoUploadDialogContext {
  currentPhoto?: string;
  onSave: (photoUrl: string) => void;
  onDelete: () => void;
}

@Component({
  selector: 'spartan-photo-upload-dialog',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideTrash2, lucideCamera })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './photo-upload-dialog.html',
  styleUrl: './photo-upload-dialog.css',
})
export class PhotoUploadDialogComponent {
  private readonly _dialogRef = inject(BrnDialogRef<unknown>);
  private readonly _context = injectBrnDialogContext<PhotoUploadDialogContext>();

  protected readonly currentPhoto = signal(this._context.currentPhoto || '');

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.currentPhoto.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  protected save(): void {
    if (this.currentPhoto()) {
      this._context.onSave(this.currentPhoto());
      this._dialogRef.close();
    }
  }

  protected delete(): void {
    this.currentPhoto.set('');
    this._context.onDelete();
    this._dialogRef.close();
  }

  protected cancel(): void {
    this._dialogRef.close();
  }
}
