-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `assignedToUserId` VARCHAR(191) NULL,
    `assignedToBatchId` VARCHAR(191) NULL,
    `assignedToAcademyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tasks_taskId_key`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `assignedToAcademyId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `subRole` ENUM('HEAD_COACH', 'SENIOR_COACH', 'JUNIOR_COACH', 'PUZZLE_MASTER', 'PUZZLE_MASTER_SCHOLAR') NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `adminRole` ENUM('MASTER_ADMIN', 'ACADEMY_ADMIN') NULL,
    `stripeCustomerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `phoneNumber` VARCHAR(191) NULL,
    `addressLine1` VARCHAR(191) NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `parentName` VARCHAR(191) NULL,
    `parentEmail` VARCHAR(191) NULL,
    `chessComId` VARCHAR(191) NULL,
    `lichessId` VARCHAR(191) NULL,
    `uscfId` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `cicId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NULL,

    UNIQUE INDEX `profiles_chessComId_key`(`chessComId`),
    UNIQUE INDEX `profiles_cicId_key`(`cicId`),
    UNIQUE INDEX `profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `signupId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `signUpFee` DOUBLE NULL,
    `domain` VARCHAR(191) NULL,

    UNIQUE INDEX `academies_signupId_key`(`signupId`),
    UNIQUE INDEX `academies_domain_key`(`domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` VARCHAR(191) NOT NULL,
    `batchCode` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `studentCapacity` INTEGER NOT NULL,
    `warningCutoff` INTEGER NOT NULL,
    `currentClass` VARCHAR(191) NOT NULL,
    `startLevel` VARCHAR(191) NOT NULL,
    `currentLevel` VARCHAR(191) NOT NULL,
    `batchDay` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `warningMailSent` BOOLEAN NOT NULL DEFAULT false,
    `waitlistCount` INTEGER NOT NULL DEFAULT 0,
    `academyId` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `modifiedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `batches_batchCode_key`(`batchCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitations` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('CREATE_ACADEMY', 'BATCH_STUDENT', 'BATCH_COACH', 'USER_INVITATION') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `data` JSON NULL,
    `expiresAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `academySignupId` VARCHAR(191) NULL,
    `userSignupId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invitations_email_key`(`email`),
    UNIQUE INDEX `invitations_academySignupId_key`(`academySignupId`),
    UNIQUE INDEX `invitations_userSignupId_key`(`userSignupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codes` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `type` ENUM('FORGOT_PASSWORD', 'LOGIN_WITHOUT_PASSWORD', 'ADMIN_SETUP', 'MFA_LOGIN') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NULL,
    `customer` VARCHAR(191) NULL,
    `items` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isReplyAllowed` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `batchId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `eventId` VARCHAR(191) NULL,
    `academyId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friend_requests` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isBroadcast` BOOLEAN NOT NULL DEFAULT false,
    `batchId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_messages` (
    `id` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentweeklygoals` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `weeklyGoalId` VARCHAR(191) NOT NULL,
    `puzzlesTarget` INTEGER NULL DEFAULT 0,
    `puzzlesSolved` INTEGER NULL DEFAULT 0,
    `puzzlesPassed` INTEGER NULL DEFAULT 0,
    `isCustom` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weeklygoals` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `monthlyGoalId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `targets` (
    `id` VARCHAR(191) NOT NULL,
    `noOfGames` INTEGER NOT NULL,
    `minReviews` INTEGER NOT NULL,
    `midReviews` INTEGER NOT NULL,
    `maxReviews` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthlygoals` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `seasonalGoalId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seasonalgoals` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER') NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `permissions_resource_action_key`(`resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verifications` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `type` ENUM('FORGOT_PASSWORD', 'LOGIN_WITHOUT_PASSWORD', 'ADMIN_SETUP', 'MFA_LOGIN') NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_verifications_email_otp_idx`(`email`, `otp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_batch_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NULL,
    `reason` VARCHAR(191) NULL,
    `oldClass` VARCHAR(191) NULL,
    `newClass` VARCHAR(191) NULL,
    `oldLevel` VARCHAR(191) NULL,
    `newLevel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_codes` (
    `id` VARCHAR(191) NOT NULL,
    `module` ENUM('BATCH', 'PLAN', 'USER_SIGNUP', 'USER', 'ACADEMY_PROGRAM', 'QUIZ', 'QUIZ_QUESTION', 'TASK') NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_codes_module_prefix_key`(`module`, `prefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maxUsers` INTEGER NOT NULL,
    `academyPrice` DOUBLE NOT NULL,
    `subscriberPrice` DOUBLE NOT NULL,
    `features` JSON NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `planId` VARCHAR(191) NOT NULL,
    `academyStripePlanId` VARCHAR(191) NOT NULL,
    `subscriberStripePlanId` VARCHAR(191) NOT NULL,
    `discountAllowed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plans_academyStripePlanId_key`(`academyStripePlanId`),
    UNIQUE INDEX `plans_subscriberStripePlanId_key`(`subscriberStripePlanId`),
    INDEX `plans_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academy_programs` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('P0', 'P1', 'P2', 'P3') NOT NULL,
    `seasonPrice` DOUBLE NOT NULL,
    `monthlyPrice` DOUBLE NOT NULL,
    `yearlyDiscountPercentage` DOUBLE NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSignUpFee` BOOLEAN NOT NULL DEFAULT false,
    `creditPoints` INTEGER NULL DEFAULT 0,
    `condition` ENUM('FULL_ATTENDANCE', 'TOURNAMENT_WIN', 'PARTICIPATION', 'PERFORMANCE_IMPROVEMENT') NULL,
    `discountRules` JSON NULL,
    `discountAmount` DOUBLE NULL,
    `latePaymentFees` DOUBLE NULL,
    `dueDate` DATETIME(3) NULL,
    `stripeProgramId` VARCHAR(191) NULL,
    `stripeMonthlyPriceId` VARCHAR(191) NULL,
    `stripeSeasonalPriceId` VARCHAR(191) NULL,
    `stripeYearlyPriceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academy_programs_programId_key`(`programId`),
    UNIQUE INDEX `academy_programs_stripeProgramId_key`(`stripeProgramId`),
    UNIQUE INDEX `academy_programs_stripeMonthlyPriceId_key`(`stripeMonthlyPriceId`),
    UNIQUE INDEX `academy_programs_stripeSeasonalPriceId_key`(`stripeSeasonalPriceId`),
    UNIQUE INDEX `academy_programs_stripeYearlyPriceId_key`(`stripeYearlyPriceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_program_credits` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `pointsEarned` INTEGER NOT NULL DEFAULT 0,
    `attendance` DOUBLE NULL,
    `isRedeemed` BOOLEAN NOT NULL DEFAULT false,
    `redeemedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `appliedCredit` DOUBLE NULL,
    `appliedDiscount` DOUBLE NULL,
    `finalPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academy_signups` (
    `id` VARCHAR(191) NOT NULL,
    `academyName` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `selectedPlanId` VARCHAR(191) NULL,
    `requestedDomain` VARCHAR(191) NULL,
    `finalDomain` VARCHAR(191) NULL,
    `status` ENUM('INQUIRY', 'DOMAIN_SELECTION', 'PAYMENT_PENDING', 'DOMAIN_VERIFICATION', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'INQUIRY',
    `statusNote` VARCHAR(191) NULL,
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paymentAmount` DOUBLE NULL,
    `paymentDate` DATETIME(3) NULL,
    `discountPercentage` DOUBLE NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academy_signups_email_key`(`email`),
    UNIQUE INDEX `academy_signups_requestedDomain_key`(`requestedDomain`),
    UNIQUE INDEX `academy_signups_finalDomain_key`(`finalDomain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `autoRenew` BOOLEAN NOT NULL DEFAULT false,
    `lastBillingDate` DATETIME(3) NULL,
    `nextBillingDate` DATETIME(3) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `academyPlanId` VARCHAR(191) NOT NULL,
    `stripeSubscriptionId` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasedplans` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_signups` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `userRole` ENUM('SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER') NOT NULL,
    `signupStage` ENUM('INQUIRY', 'PRE_ACTIVATION', 'PAYMENT', 'POST_ACTIVATION') NOT NULL DEFAULT 'INQUIRY',
    `signupStatus` ENUM('INQUIRY', 'RESERVED', 'WAITING', 'CONFIRMED') NOT NULL DEFAULT 'INQUIRY',
    `signupId` VARCHAR(191) NOT NULL,
    `middleName` VARCHAR(191) NULL,
    `coachType` ENUM('HEAD_COACH', 'SENIOR_COACH', 'JUNIOR_COACH', 'PUZZLE_MASTER', 'PUZZLE_MASTER_SCHOLAR') NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `parentName` VARCHAR(191) NULL,
    `parentEmail` VARCHAR(191) NULL,
    `addressLine1` VARCHAR(191) NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `chessComId` VARCHAR(191) NULL,
    `lichessId` VARCHAR(191) NULL,
    `uscfId` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `cicId` VARCHAR(191) NULL,
    `batchInterestId` VARCHAR(191) NULL,
    `reservationTime` DATETIME(3) NULL,
    `reservationExpiry` DATETIME(3) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `mfaVerified` BOOLEAN NOT NULL DEFAULT false,
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paymentAmount` DOUBLE NULL,
    `paymentDate` DATETIME(3) NULL,
    `academyId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_signups_email_key`(`email`),
    UNIQUE INDEX `user_signups_signupId_key`(`signupId`),
    UNIQUE INDEX `user_signups_chessComId_key`(`chessComId`),
    UNIQUE INDEX `user_signups_cicId_key`(`cicId`),
    UNIQUE INDEX `user_signups_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizs` (
    `id` VARCHAR(191) NOT NULL,
    `quizCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `timeLimit` INTEGER NULL,
    `passingScore` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `taskId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quizs_quizCode_key`(`quizCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_questions` (
    `id` VARCHAR(191) NOT NULL,
    `questionCode` VARCHAR(191) NOT NULL,
    `questionText` VARCHAR(191) NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILL_IN_THE_BLANKS') NOT NULL,
    `marks` DOUBLE NOT NULL,
    `orderIndex` INTEGER NOT NULL,
    `options` JSON NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `wordLimit` INTEGER NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quiz_questions_questionCode_key`(`questionCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_quiz_attempts` (
    `id` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `score` DOUBLE NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `quizId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_quiz_answers` (
    `id` VARCHAR(191) NOT NULL,
    `answerText` TEXT NOT NULL,
    `isCorrect` BOOLEAN NULL,
    `marksObtained` DOUBLE NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academy_navigations` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `parentId` VARCHAR(191) NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academy_navigations_academyId_slug_key`(`academyId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pages` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isHome` BOOLEAN NOT NULL DEFAULT false,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` VARCHAR(191) NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pages_academyId_slug_key`(`academyId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_components` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PAGE_HEADER', 'LEVEL_CARD', 'CHESS_BATCH', 'CONTACT_SECTION', 'TEXT_BLOCK', 'IMAGE_BLOCK', 'HERO_SECTION', 'PROGRAM_LIST', 'TESTIMONIAL', 'COACH_PROFILE', 'NEWS_SECTION', 'ACHIEVEMENT_SHOWCASE', 'SEPARATOR', 'SECTION_HEADER', 'TIMELINE_SECTION', 'COACH_GRID', 'ACHIEVEMENTS_GRID') NOT NULL,
    `props` JSON NOT NULL,
    `order` INTEGER NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailVerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `newEmail` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `EmailVerificationToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SignupOTP` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SignupOTP_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserFriends` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_UserFriends_AB_unique`(`A`, `B`),
    INDEX `_UserFriends_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AcademyAdmins` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AcademyAdmins_AB_unique`(`A`, `B`),
    INDEX `_AcademyAdmins_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BatchCoaches` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_BatchCoaches_AB_unique`(`A`, `B`),
    INDEX `_BatchCoaches_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BatchStudents` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_BatchStudents_AB_unique`(`A`, `B`),
    INDEX `_BatchStudents_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ChannelMembers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ChannelMembers_AB_unique`(`A`, `B`),
    INDEX `_ChannelMembers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToBatchId_fkey` FOREIGN KEY (`assignedToBatchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToAcademyId_fkey` FOREIGN KEY (`assignedToAcademyId`) REFERENCES `academies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_assignedToAcademyId_fkey` FOREIGN KEY (`assignedToAcademyId`) REFERENCES `academies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academies` ADD CONSTRAINT `academies_signupId_fkey` FOREIGN KEY (`signupId`) REFERENCES `academy_signups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academies` ADD CONSTRAINT `academies_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_modifiedBy_fkey` FOREIGN KEY (`modifiedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_academySignupId_fkey` FOREIGN KEY (`academySignupId`) REFERENCES `academy_signups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_userSignupId_fkey` FOREIGN KEY (`userSignupId`) REFERENCES `user_signups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channels` ADD CONSTRAINT `channels_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_messages` ADD CONSTRAINT `channel_messages_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_messages` ADD CONSTRAINT `channel_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentweeklygoals` ADD CONSTRAINT `studentweeklygoals_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentweeklygoals` ADD CONSTRAINT `studentweeklygoals_weeklyGoalId_fkey` FOREIGN KEY (`weeklyGoalId`) REFERENCES `weeklygoals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weeklygoals` ADD CONSTRAINT `weeklygoals_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `targets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weeklygoals` ADD CONSTRAINT `weeklygoals_monthlyGoalId_fkey` FOREIGN KEY (`monthlyGoalId`) REFERENCES `monthlygoals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `weeklygoals` ADD CONSTRAINT `weeklygoals_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthlygoals` ADD CONSTRAINT `monthlygoals_seasonalGoalId_fkey` FOREIGN KEY (`seasonalGoalId`) REFERENCES `seasonalgoals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthlygoals` ADD CONSTRAINT `monthlygoals_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seasonalgoals` ADD CONSTRAINT `seasonalgoals_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_batch_history` ADD CONSTRAINT `user_batch_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_batch_history` ADD CONSTRAINT `user_batch_history_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academy_programs` ADD CONSTRAINT `academy_programs_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_program_credits` ADD CONSTRAINT `student_program_credits_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_program_credits` ADD CONSTRAINT `student_program_credits_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `academy_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `academy_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academy_signups` ADD CONSTRAINT `academy_signups_selectedPlanId_fkey` FOREIGN KEY (`selectedPlanId`) REFERENCES `plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_academyPlanId_fkey` FOREIGN KEY (`academyPlanId`) REFERENCES `academy_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasedplans` ADD CONSTRAINT `purchasedplans_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasedplans` ADD CONSTRAINT `purchasedplans_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_signups` ADD CONSTRAINT `user_signups_batchInterestId_fkey` FOREIGN KEY (`batchInterestId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_signups` ADD CONSTRAINT `user_signups_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_signups` ADD CONSTRAINT `user_signups_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizs` ADD CONSTRAINT `quizs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizs` ADD CONSTRAINT `quizs_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_questions` ADD CONSTRAINT `quiz_questions_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_quiz_attempts` ADD CONSTRAINT `student_quiz_attempts_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_quiz_attempts` ADD CONSTRAINT `student_quiz_attempts_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `quizs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_quiz_attempts` ADD CONSTRAINT `student_quiz_attempts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_quiz_answers` ADD CONSTRAINT `student_quiz_answers_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `quiz_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_quiz_answers` ADD CONSTRAINT `student_quiz_answers_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `student_quiz_attempts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academy_navigations` ADD CONSTRAINT `academy_navigations_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `academy_navigations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academy_navigations` ADD CONSTRAINT `academy_navigations_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pages` ADD CONSTRAINT `pages_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `academies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `page_components` ADD CONSTRAINT `page_components_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailVerificationToken` ADD CONSTRAINT `EmailVerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserFriends` ADD CONSTRAINT `_UserFriends_A_fkey` FOREIGN KEY (`A`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserFriends` ADD CONSTRAINT `_UserFriends_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AcademyAdmins` ADD CONSTRAINT `_AcademyAdmins_A_fkey` FOREIGN KEY (`A`) REFERENCES `academies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AcademyAdmins` ADD CONSTRAINT `_AcademyAdmins_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BatchCoaches` ADD CONSTRAINT `_BatchCoaches_A_fkey` FOREIGN KEY (`A`) REFERENCES `batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BatchCoaches` ADD CONSTRAINT `_BatchCoaches_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BatchStudents` ADD CONSTRAINT `_BatchStudents_A_fkey` FOREIGN KEY (`A`) REFERENCES `batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BatchStudents` ADD CONSTRAINT `_BatchStudents_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ChannelMembers` ADD CONSTRAINT `_ChannelMembers_A_fkey` FOREIGN KEY (`A`) REFERENCES `channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ChannelMembers` ADD CONSTRAINT `_ChannelMembers_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
