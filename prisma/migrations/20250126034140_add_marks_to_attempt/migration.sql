/*
  Warnings:

  - The values [NOT_STARTED] on the enum `student_quiz_attempts_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOT_STARTED] on the enum `student_quiz_attempts_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `student_quiz_attempts` ADD COLUMN `obtainedMarks` DOUBLE NULL,
    ADD COLUMN `totalMarks` DOUBLE NULL,
    MODIFY `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL;

-- AlterTable
ALTER TABLE `tasks` MODIFY `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL;
