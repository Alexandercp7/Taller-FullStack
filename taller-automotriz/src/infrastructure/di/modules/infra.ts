import { getPrismaClient } from '../../persistence/prisma/prisma.client';
import { env } from '../../config/env';
import { PrismaUnitOfWork } from '../../persistence/prisma/prisma-unit-of-work';
import { InProcessDomainEventDispatcher } from '../../events/in-process-domain-event-dispatcher';
import { Argon2HasherAdapter } from '../../external/argon2-hasher.adapter';
import { JWTTokenProviderAdapter } from '../../external/jwt-token-provider.adapter';
import { InMemoryCacheAdapter } from '../../external/in-memory-cache.adapter';
import { S3FileStorageAdapter } from '../../external/s3-file-storage.adapter';
import { PDFKitGeneratorAdapter } from '../../external/pdfkit-generator.adapter';
import { NHTSAVinDecoderAdapter } from '../../external/nhtsa-vin-decoder.adapter';

export function buildInfra() {
  const prisma = getPrismaClient();
  const hasher = new Argon2HasherAdapter();
  const tokenProvider = new JWTTokenProviderAdapter(env.JWT_SECRET);
  const cache = new InMemoryCacheAdapter();
  const dispatcher = new InProcessDomainEventDispatcher();
  const unitOfWork = new PrismaUnitOfWork(prisma, dispatcher);
  const fileStorage = new S3FileStorageAdapter();
  const pdfGenerator = new PDFKitGeneratorAdapter();
  const vinDecoder = new NHTSAVinDecoderAdapter(cache);

  return { prisma, hasher, tokenProvider, cache, dispatcher, unitOfWork, fileStorage, pdfGenerator, vinDecoder };
}

export type Infra = ReturnType<typeof buildInfra>;
