import { ClientTag } from '../enums/client-tag.enum';

export interface ClientTagContext {
  totalOrders: number;
  hasPendingDebt: boolean;
}

export class ClientTagger {
  static determineTag(context: ClientTagContext): ClientTag {
    if (context.hasPendingDebt) return ClientTag.WITH_DEBT;
    if (context.totalOrders >= 3) return ClientTag.FREQUENT;
    return ClientTag.NEW;
  }
}
