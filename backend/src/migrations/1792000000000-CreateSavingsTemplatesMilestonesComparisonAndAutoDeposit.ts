import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateSavingsTemplatesMilestonesComparisonAndAutoDeposit1792000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'savings_goal_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          {
            name: 'suggestedAmount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'suggestedDurationMonths',
            type: 'int',
            isNullable: false,
          },
          { name: 'icon', type: 'varchar', length: '120', isNullable: false },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true, isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'savings_goal_templates',
      new TableIndex({
        name: 'IDX_SAVINGS_GOAL_TEMPLATES_NAME_UNIQUE',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'savings_goal_template_usage',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'templateId', type: 'uuid', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'goalId', type: 'uuid', isNullable: false },
          { name: 'customizations', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'savings_goal_template_usage',
      new TableIndex({ name: 'IDX_SAVINGS_TEMPLATE_USAGE_TEMPLATE', columnNames: ['templateId'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'savings_goal_milestones',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'goalId', type: 'uuid', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false },
          {
            name: 'type',
            type: 'enum',
            enum: ['AUTO', 'CUSTOM'],
            default: "'AUTO'",
          },
          { name: 'percentage', type: 'int', isNullable: true },
          { name: 'title', type: 'varchar', length: '140', isNullable: true },
          {
            name: 'targetAmount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'achievedAmount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: true,
          },
          { name: 'bonusPoints', type: 'int', default: 0, isNullable: false },
          { name: 'shareCode', type: 'varchar', length: '120', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'savings_goal_milestones',
      new TableIndex({
        name: 'IDX_SAVINGS_GOAL_MILESTONES_GOAL_PERCENTAGE',
        columnNames: ['goalId', 'percentage'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'savings_product_performance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'productId', type: 'uuid', isNullable: false },
          {
            name: 'apy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'tvl',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'fees',
            type: 'decimal',
            precision: 6,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'recordedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'savings_product_performance',
      new TableIndex({
        name: 'IDX_SAVINGS_PRODUCT_PERFORMANCE_PRODUCT_DATE',
        columnNames: ['productId', 'recordedAt'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'savings_auto_deposit_schedules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'productId', type: 'uuid', isNullable: false },
          {
            name: 'amount',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'enum',
            enum: ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
            default: "'ACTIVE'",
          },
          { name: 'nextRunAt', type: 'timestamp', isNullable: false },
          { name: 'lastRunAt', type: 'timestamp', isNullable: true },
          { name: 'pausedAt', type: 'timestamp', isNullable: true },
          { name: 'retryCount', type: 'int', default: 0, isNullable: false },
          { name: 'maxRetries', type: 'int', default: 5, isNullable: false },
          { name: 'lastFailureAt', type: 'timestamp', isNullable: true },
          { name: 'lastFailureReason', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'savings_auto_deposit_schedules',
      new TableIndex({
        name: 'IDX_SAVINGS_AUTO_DEPOSIT_STATUS_NEXT_RUN',
        columnNames: ['status', 'nextRunAt'],
      }),
    );

    await queryRunner.query(`
      INSERT INTO savings_goal_templates (name, "suggestedAmount", "suggestedDurationMonths", icon, metadata, "isActive")
      VALUES
      ('Emergency Fund', 1000, 6, 'shield', '{"category":"safety"}', true),
      ('Vacation', 2500, 12, 'plane', '{"category":"lifestyle"}', true),
      ('Car', 12000, 24, 'car', '{"category":"transport"}', true),
      ('House', 40000, 48, 'home', '{"category":"housing"}', true),
      ('Education', 15000, 36, 'book', '{"category":"education"}', true)
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('savings_auto_deposit_schedules', true);
    await queryRunner.dropTable('savings_product_performance', true);
    await queryRunner.dropTable('savings_goal_milestones', true);
    await queryRunner.dropTable('savings_goal_template_usage', true);
    await queryRunner.dropTable('savings_goal_templates', true);
  }
}
