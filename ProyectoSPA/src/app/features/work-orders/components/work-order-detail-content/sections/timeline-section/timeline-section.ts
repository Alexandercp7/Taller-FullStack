import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { WorkOrdersService } from '../../../../services';

@Component({
	selector: 'spartan-wo-timeline-section',
	imports: [CommonModule, HlmCardImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './timeline-section.html',
	styleUrl: './timeline-section.css',
})
export class WorkOrderTimelineSectionComponent {
	private readonly _route = inject(ActivatedRoute);
	private readonly _service = inject(WorkOrdersService);
	private readonly _params = toSignal(this._route.paramMap, { initialValue: this._route.snapshot.paramMap });

	protected readonly orderId = computed(() => this._params().get('id') ?? '');
	protected readonly order = computed(() => this._service.getById(this.orderId()));
}
