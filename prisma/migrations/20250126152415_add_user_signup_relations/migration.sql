-- AlterTable
ALTER TABLE `user_signups` ADD COLUMN `assignedToBatchId` VARCHAR(191) NULL,
    ADD COLUMN `completedById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `user_signups` ADD CONSTRAINT `user_signups_assignedToBatchId_fkey` FOREIGN KEY (`assignedToBatchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_signups` ADD CONSTRAINT `user_signups_completedById_fkey` FOREIGN KEY (`completedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
