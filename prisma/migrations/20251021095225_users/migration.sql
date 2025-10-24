/*
  Warnings:

  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_ip` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `TinyInt`.
  - You are about to drop the `addresses` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `addresses` DROP FOREIGN KEY `addresses_ibfk_1`;

-- DropIndex
DROP INDEX `email` ON `users`;

-- DropIndex
DROP INDEX `idx_email` ON `users`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `email`,
    DROP COLUMN `last_login_at`,
    DROP COLUMN `last_login_ip`,
    DROP COLUMN `nickname`,
    MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `status` TINYINT NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE `addresses`;

-- CreateTable
CREATE TABLE `coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coupon_name` VARCHAR(100) NOT NULL,
    `coupon_type` ENUM('discount', 'full_reduce') NOT NULL,
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `min_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `max_discount` DECIMAL(10, 2) NULL,
    `total_count` INTEGER NOT NULL DEFAULT 0,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `valid_from` DATETIME(0) NOT NULL,
    `valid_until` DATETIME(0) NOT NULL,
    `status` ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `idx_coupon_type`(`coupon_type`),
    INDEX `idx_deleted_at`(`deleted_at`),
    INDEX `idx_status`(`status`),
    INDEX `idx_valid_period`(`valid_from`, `valid_until`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `delivery_user_id` INTEGER NULL,
    `delivery_status` ENUM('assigned', 'picked_up', 'delivering', 'delivered') NOT NULL DEFAULT 'assigned',
    `assigned_at` DATETIME(0) NULL,
    `picked_up_at` DATETIME(0) NULL,
    `delivered_at` DATETIME(0) NULL,
    `delivery_distance` DECIMAL(8, 2) NULL,
    `delivery_duration` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_order_id`(`order_id`),
    INDEX `idx_delivery_status`(`delivery_status`),
    INDEX `idx_delivery_user_id`(`delivery_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_sort_order`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dishes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `image` VARCHAR(255) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `sales_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `idx_category_id`(`category_id`),
    INDEX `idx_deleted_at`(`deleted_at`),
    INDEX `idx_price`(`price`),
    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_sales_count`(`sales_count`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `dish_id` INTEGER NOT NULL,
    `dish_name` VARCHAR(100) NOT NULL,
    `dish_image` VARCHAR(255) NULL,
    `dish_price` DECIMAL(8, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `selected_spec` VARCHAR(100) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_dish_id`(`dish_id`),
    INDEX `idx_order_id`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `rating` TINYINT NOT NULL,
    `content` TEXT NULL,
    `images` JSON NULL,
    `reply_content` TEXT NULL,
    `reply_time` DATETIME(0) NULL,
    `status` ENUM('published', 'hidden', 'deleted') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `uk_order_id`(`order_id`),
    INDEX `idx_deleted_at`(`deleted_at`),
    INDEX `idx_rating`(`rating`),
    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_status`(`status`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `old_status` VARCHAR(20) NULL,
    `new_status` VARCHAR(20) NOT NULL,
    `operator_id` INTEGER NULL,
    `operator_type` ENUM('user', 'merchant', 'delivery', 'system') NULL DEFAULT 'system',
    `remark` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_order_id`(`order_id`),
    INDEX `operator_id`(`operator_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(32) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `address_id` INTEGER NOT NULL,
    `contact_name` VARCHAR(50) NOT NULL,
    `contact_phone` VARCHAR(20) NOT NULL,
    `delivery_address` VARCHAR(255) NOT NULL,
    `order_status` ENUM('created', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled') NOT NULL DEFAULT 'created',
    `payment_status` ENUM('pending', 'processing', 'success', 'failed', 'refunding', 'refunded') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('wechat', 'alipay', 'balance', 'apple') NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `coupon_id` INTEGER NULL,
    `order_note` TEXT NULL,
    `delivery_time` VARCHAR(100) NULL,
    `estimated_delivery_time` DATETIME(0) NULL,
    `actual_delivery_time` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `paid_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `cancelled_at` DATETIME(0) NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `order_number`(`order_number`),
    INDEX `address_id`(`address_id`),
    INDEX `coupon_id`(`coupon_id`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_deleted_at`(`deleted_at`),
    INDEX `idx_order_number`(`order_number`),
    INDEX `idx_order_status`(`order_status`),
    INDEX `idx_payment_status`(`payment_status`),
    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `payment_method` ENUM('wechat', 'alipay', 'balance', 'apple') NOT NULL,
    `payment_amount` DECIMAL(10, 2) NOT NULL,
    `transaction_id` VARCHAR(100) NULL,
    `payment_status` ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending',
    `payment_time` DATETIME(0) NULL,
    `failure_reason` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_order_id`(`order_id`),
    INDEX `idx_payment_status`(`payment_status`),
    INDEX `idx_transaction_id`(`transaction_id`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refund_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `payment_record_id` INTEGER NOT NULL,
    `refund_amount` DECIMAL(10, 2) NOT NULL,
    `refund_reason` VARCHAR(255) NOT NULL,
    `refund_type` ENUM('full', 'partial') NOT NULL DEFAULT 'full',
    `refund_status` ENUM('pending', 'approved', 'rejected', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `refund_method` ENUM('original', 'balance') NULL DEFAULT 'original',
    `refund_transaction_id` VARCHAR(100) NULL,
    `processor_id` INTEGER NULL,
    `processor_type` ENUM('user', 'merchant', 'system') NULL DEFAULT 'system',
    `process_remark` VARCHAR(255) NULL,
    `processed_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_order_id`(`order_id`),
    INDEX `idx_refund_status`(`refund_status`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `payment_record_id`(`payment_record_id`),
    INDEX `processor_id`(`processor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_tag_master` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tag_name` VARCHAR(50) NOT NULL,
    `tag_type` ENUM('cuisine', 'feature', 'price_range', 'service') NULL DEFAULT 'cuisine',
    `color` VARCHAR(7) NULL DEFAULT '#ff6b6b',
    `icon` VARCHAR(100) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `tag_name`(`tag_name`),
    INDEX `idx_sort_order`(`sort_order`),
    INDEX `idx_status`(`status`),
    INDEX `idx_tag_type`(`tag_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_tag_relations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NULL,

    INDEX `created_by`(`created_by`),
    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_tag_id`(`tag_id`),
    UNIQUE INDEX `uk_restaurant_tag`(`restaurant_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_tag_stats` (
    `tag_id` INTEGER NOT NULL,
    `usage_count` INTEGER NOT NULL DEFAULT 0,
    `last_used_at` DATETIME(0) NULL,

    PRIMARY KEY (`tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    `distance` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `delivery_fee` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `delivery_time` INTEGER NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    INDEX `idx_deleted_at`(`deleted_at`),
    INDEX `idx_distance`(`distance`),
    INDEX `idx_rating`(`rating`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_cart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `dish_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(8, 2) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `dish_id`(`dish_id`),
    INDEX `idx_restaurant_id`(`restaurant_id`),
    INDEX `idx_user_id`(`user_id`),
    UNIQUE INDEX `uk_user_restaurant_dish`(`user_id`, `restaurant_id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `contact_name` VARCHAR(50) NOT NULL,
    `contact_phone` VARCHAR(20) NOT NULL,
    `province` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `district` VARCHAR(50) NOT NULL,
    `detail_address` VARCHAR(255) NOT NULL,
    `is_default` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_is_default`(`is_default`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_coupons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `coupon_id` INTEGER NOT NULL,
    `order_id` INTEGER NULL,
    `status` ENUM('unused', 'used', 'expired') NOT NULL DEFAULT 'unused',
    `received_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `used_at` DATETIME(0) NULL,
    `expired_at` DATETIME(0) NOT NULL,

    INDEX `idx_coupon_id`(`coupon_id`),
    INDEX `idx_expired_at`(`expired_at`),
    INDEX `idx_status`(`status`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `order_id`(`order_id`),
    UNIQUE INDEX `uk_user_coupon`(`user_id`, `coupon_id`, `received_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_deleted_at` ON `users`(`deleted_at`);

-- CreateIndex
CREATE INDEX `idx_status` ON `users`(`status`);

-- AddForeignKey
ALTER TABLE `delivery_info` ADD CONSTRAINT `delivery_info_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `delivery_info` ADD CONSTRAINT `delivery_info_ibfk_2` FOREIGN KEY (`delivery_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dish_categories` ADD CONSTRAINT `dish_categories_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dishes` ADD CONSTRAINT `dishes_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `dishes` ADD CONSTRAINT `dishes_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `dish_categories`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_reviews` ADD CONSTRAINT `order_reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_reviews` ADD CONSTRAINT `order_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_reviews` ADD CONSTRAINT `order_reviews_ibfk_3` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_status_logs` ADD CONSTRAINT `order_status_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_status_logs` ADD CONSTRAINT `order_status_logs_ibfk_2` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`address_id`) REFERENCES `user_addresses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_records` ADD CONSTRAINT `payment_records_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_records` ADD CONSTRAINT `payment_records_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refund_records` ADD CONSTRAINT `refund_records_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refund_records` ADD CONSTRAINT `refund_records_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refund_records` ADD CONSTRAINT `refund_records_ibfk_3` FOREIGN KEY (`payment_record_id`) REFERENCES `payment_records`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refund_records` ADD CONSTRAINT `refund_records_ibfk_4` FOREIGN KEY (`processor_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `restaurant_tag_relations` ADD CONSTRAINT `restaurant_tag_relations_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `restaurant_tag_relations` ADD CONSTRAINT `restaurant_tag_relations_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `restaurant_tag_master`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `restaurant_tag_relations` ADD CONSTRAINT `restaurant_tag_relations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `restaurant_tag_stats` ADD CONSTRAINT `restaurant_tag_stats_ibfk_1` FOREIGN KEY (`tag_id`) REFERENCES `restaurant_tag_master`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shopping_cart` ADD CONSTRAINT `shopping_cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shopping_cart` ADD CONSTRAINT `shopping_cart_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shopping_cart` ADD CONSTRAINT `shopping_cart_ibfk_3` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_addresses` ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_coupons` ADD CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_coupons` ADD CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_coupons` ADD CONSTRAINT `user_coupons_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
