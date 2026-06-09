import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { Contact } from '../../models/contact.model';

export interface ContactDetailDialogContext {
  contact: Contact;
}

@Component({
  selector: 'spartan-contact-detail-dialog',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmBadgeImports],
  templateUrl: './contact-detail-dialog.html',
  styleUrl: './contact-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDetailDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef<unknown>);
  protected readonly context = injectBrnDialogContext<ContactDetailDialogContext>();
  protected readonly contact = this.context.contact;

  protected close(): void {
    this.dialogRef.close(false);
  }
}
