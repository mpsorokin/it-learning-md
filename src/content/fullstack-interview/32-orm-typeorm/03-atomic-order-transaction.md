# Atomic Order Transaction

## Interview questions

### Сделать атомарную transaction:
<!-- question-id: 32-orm-typeorm-task01 -->

create order
→ reserve inventory
→ charge balance
→ save audit event

#### Ответ

**Допущения:** PostgreSQL и текущий TypeORM DataSource API; баланс пользователя — внутренний wallet в той же БД, остаток товара хранится по одному SKU, цена фиксируется в целых minor units. Ниже number используется только при ограничении величин безопасным диапазоном JavaScript; для PostgreSQL bigint, который TypeORM обычно отдает строкой, используйте BigInt/decimal library и не выполняйте денежную арифметику с float. Все use cases захватывают locks в одном порядке: product, затем wallet.

Ключевое требование — все четыре изменения идут через один transactional EntityManager. Исключение в callback должно покинуть его, чтобы TypeORM откатил и заказ, и остаток, и баланс, и audit event. `userId` ниже поступает из проверенного principal, а не из request body. Fingerprint запроса вычисляет доверенный use case после валидации и нормализации; клиент не может передать собственный hash.

    import { createHash } from 'node:crypto';

    type PurchaseInput = {
      userId: number; // из аутентифицированного principal
      productId: number;
      quantity: number;
      idempotencyKey: string;
    };

    async function purchase(input: PurchaseInput): Promise<Order> {
      if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
        throw new BadRequestException('quantity must be a positive integer');
      }
      const command = { productId: input.productId, quantity: input.quantity };
      const requestHash = createHash('sha256')
        .update(JSON.stringify(command), 'utf8')
        .digest('hex');

      return dataSource.transaction(async (manager) => {
        // Unique key is (user_id, idempotency_key). A conflicting insert waits
        // for the first transaction; its committed result is read below.
        const claimed = (await manager.query(
          "INSERT INTO idempotency_request (user_id, idempotency_key, request_hash, status) " +
            "VALUES ($1, $2, $3, 'in_progress') " +
            "ON CONFLICT (user_id, idempotency_key) DO NOTHING RETURNING id",
          [input.userId, input.idempotencyKey, requestHash],
        )) as Array<{ id: number }>;

        if (claimed.length === 0) {
          const prior = await manager.findOne(IdempotencyRequest, {
            where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
          });
          if (!prior || prior.requestHash !== requestHash || !prior.orderId) {
            throw new ConflictException('idempotency key conflicts with another request');
          }
          const priorOrder = await manager.findOne(Order, {
            where: { id: prior.orderId },
          });
          if (!priorOrder) throw new Error('idempotency record has no order');
          return priorOrder;
        }

        const product = await manager.getRepository(Product)
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :productId', { productId: input.productId })
          .getOne();
        if (!product || product.available < input.quantity) {
          throw new ConflictException('insufficient inventory');
        }

        const wallet = await manager.getRepository(Wallet)
          .createQueryBuilder('wallet')
          .setLock('pessimistic_write')
          .where('wallet.userId = :userId', { userId: input.userId })
          .getOne();
        if (!wallet) throw new NotFoundException('wallet not found');

        const totalMinor = product.priceMinor * input.quantity;
        if (!Number.isSafeInteger(totalMinor)) {
          throw new BadRequestException('amount is outside supported range');
        }
        if (wallet.balanceMinor < totalMinor) {
          throw new ConflictException('insufficient balance');
        }

        const previousBalanceMinor = wallet.balanceMinor;
        product.available -= input.quantity;
        wallet.balanceMinor -= totalMinor;
        await manager.save(Product, product);
        await manager.save(Wallet, wallet);

        const savedOrder = await manager.save(Order, manager.create(Order, {
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          productId: product.id,
          quantity: input.quantity,
          unitPriceMinor: product.priceMinor,
          totalMinor,
          status: 'paid',
        }));
        await manager.update(IdempotencyRequest, { id: claimed[0].id }, {
          orderId: savedOrder.id, status: 'completed',
        });
        await manager.save(AuditEvent, manager.create(AuditEvent, {
          actorUserId: input.userId,
          action: 'order.purchased',
          resourceId: savedOrder.id,
          amountMinor: totalMinor,
          balanceBeforeMinor: previousBalanceMinor,
          balanceAfterMinor: wallet.balanceMinor,
        }));
        return savedOrder;
      });
    }

Fingerprint строится из канонического набора всех значимых клиентских полей команды (здесь productId и quantity; при наличии доставки/варианта товара они тоже входят), но не из изменяемых серверных данных вроде текущей цены. Уникальность схемы — `(user_id, idempotency_key)`; CHECK ограничивают quantity, inventory и balance, FK связывают пользователя, товар и заказ. Тот же ключ с тем же fingerprint возвращает прежний заказ; другой fingerprint даёт conflict. Claim и запись `completed` находятся в той же транзакции, поэтому rollback снимает claim. Raw INSERT должен совпадать с миграциями.

Row locks защищают последний товар и баланс при конкуренции; все пути блокируют product, затем wallet, а сетевые вызовы не входят в транзакцию. Если оплата у внешнего provider, атомарности с PostgreSQL нет: создаю pending order/reservation, ledger и outbox, после commit worker вызывает provider, а webhook продвигает идемпотентную state machine. Deadlock/serialization retry повторяет весь callback с лимитом попыток и тем же ключом. Модели, миграции и exception classes предполагаются определенными приложением.

