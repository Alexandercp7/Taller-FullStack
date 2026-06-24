import { InMemoryKpiService } from '../in-memory-kpi.service';
import { InMemoryPriceService } from '../in-memory-price.service';
import { InMemoryActivityService } from '../in-memory-activity.service';

export function buildInMemoryServices() {
  return {
    kpiService: new InMemoryKpiService(),
    priceService: new InMemoryPriceService(),
    activityService: new InMemoryActivityService(),
  };
}
