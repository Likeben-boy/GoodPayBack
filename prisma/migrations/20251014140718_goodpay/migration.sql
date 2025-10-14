/*
  Warnings:

  - You are about to drop the column `is_delete` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `is_delete` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `addresses` DROP COLUMN `is_delete`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `is_delete`;
