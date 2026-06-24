import { WorkOrder } from '../../src/domain/entities/work-order.entity';
import { Client } from '../../src/domain/entities/client.entity';
import { Vehicle } from '../../src/domain/entities/vehicle.entity';
import { InventoryItem } from '../../src/domain/entities/inventory-item.entity';
import { User } from '../../src/domain/entities/user.entity';
import { UserRole } from '../../src/domain/enums/user-role.enum';
import { OrderStatus } from '../../src/domain/enums/order-status.enum';
import { OrderType } from '../../src/domain/enums/order-type.enum';
import { Priority } from '../../src/domain/enums/priority.enum';
import { ClientTag } from '../../src/domain/enums/client-tag.enum';
import { InventoryType } from '../../src/domain/enums/inventory-type.enum';
import { VehicleType } from '../../src/domain/enums/vehicle-type.enum';
import { Money } from '../../src/domain/value-objects/money.vo';

let seq = 1;
const id = () => `test-${seq++}`;

export function createTestOrder(overrides: Partial<{
  id: string;
  status: OrderStatus;
  phase: any;
  closedAt: Date | null;
}> = {}): WorkOrder {
  return new WorkOrder(
    overrides.id ?? id(),
    `WO-${String(seq).padStart(4, '0')}`,
    overrides.status ?? OrderStatus.SCHEDULED,
    overrides.phase ?? null,
    Priority.MEDIUM,
    OrderType.NORMAL,
    `client-${id()}`,
    `vehicle-${id()}`,
    `tech-${id()}`,
    `user-${id()}`,
    'Falla en motor',
    null,
    null,
    `portal-token-${id()}`,
    new Date(),
    overrides.closedAt ?? null,
    false,
    [],
    [],
  );
}

export function createTestClient(overrides: Partial<{
  id: string;
  tag: ClientTag;
}> = {}): Client {
  return new Client(
    overrides.id ?? id(),
    'Juan Pérez',
    `555${String(seq).padStart(7, '0')}`,
    null,
    overrides.tag ?? ClientTag.NEW,
    null,
    new Date(),
  );
}

export function createTestItem(overrides: Partial<{
  id: string;
  stock: number;
  minStock: number;
  name: string;
}> = {}): InventoryItem {
  return new InventoryItem(
    overrides.id ?? id(),
    overrides.name ?? 'Filtro de aceite',
    null,
    null,
    InventoryType.SALE_PART,
    overrides.stock ?? 10,
    overrides.minStock ?? 2,
    Money.fromAmount(50),
    Money.fromAmount(120),
    null,
    null,
    true,
  );
}

export function createTestVehicle(overrides: Partial<{
  id: string;
  clientId: string;
  vin: string | null;
  plates: string;
}> = {}): Vehicle {
  return new Vehicle(
    overrides.id ?? id(),
    overrides.clientId ?? `client-${id()}`,
    overrides.plates ?? `PLT-${seq}`,
    overrides.vin ?? null,
    'Nissan',
    'Sentra',
    2020,
    'Rojo',
    VehicleType.CAR,
    50000,
  );
}

export function createTestUser(overrides: Partial<{
  id: string;
  role: UserRole;
}> = {}): User {
  return new User(
    overrides.id ?? id(),
    'Admin Test',
    `admin-${id()}@test.com`,
    '$hashed$password',
    overrides.role ?? UserRole.ADMIN,
    [],
    true,
  );
}
