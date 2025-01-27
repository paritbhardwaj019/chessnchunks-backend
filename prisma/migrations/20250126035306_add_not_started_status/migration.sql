-- AlterTable
ALTER TABLE `student_quiz_attempts` MODIFY `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL;

-- AlterTable
ALTER TABLE `tasks` MODIFY `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL;
