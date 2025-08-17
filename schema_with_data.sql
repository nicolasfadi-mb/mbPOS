-- Cafe POS Pro :: SQL Schema with Initial Data
-- This file creates the necessary tables and populates them with default data.
-- Before running: DROP all existing tables from your database to avoid errors.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Table structure for table `branches`
--
CREATE TABLE `branches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `branches`
--
INSERT INTO `branches` (`id`, `name`) VALUES
('branch1', 'Main Branch');

--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `pin` varchar(255) NOT NULL,
  `role` enum('admin','barista') NOT NULL,
  `accessibleBranchIds` text NOT NULL COMMENT 'JSON array of branch IDs or "all"',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--
INSERT INTO `users` (`id`, `name`, `pin`, `role`, `accessibleBranchIds`) VALUES
('user_admin', 'Admin', '1234', 'admin', 'all'),
('user_barista', 'Barista', '0000', 'barista', '["branch1"]');

--
-- Table structure for table `settings`
--
CREATE TABLE `settings` (
  `branchId` varchar(255) NOT NULL COMMENT 'Use "global" for non-branch settings',
  `settingKey` varchar(255) NOT NULL,
  `settingValue` text NOT NULL,
  PRIMARY KEY (`branchId`, `settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `settings`
--
INSERT INTO `settings` (`branchId`, `settingKey`, `settingValue`) VALUES
('branch1', 'shopInfo', '{"shopName":"Main Branch Cafe","address":"123 Coffee Avenue","phone":"555-CAFE","website":"www.cafepos.pro","footerMessage":"Thank you for visiting!","usdToLbpRate":90000}'),
('branch1', 'invoiceSettings', '{"primaryFormat":{"format":"INV-{YYYY}{MM}-{seq}","nextNumber":1},"useDualSystem":false,"dualSystemPercentage":80,"secondaryFormat":{"format":"ALT-{YYYY}{MM}-{seq}","nextNumber":1}}'),
('branch1', 'inventoryUnits', '["g","ml","pcs","kg"]'),
('branch1', 'pettyCash', '{"lbp":0,"usd":0}'),
('branch1', 'cashBoxIncomeCategories', '["Owner Deposit","Miscellaneous Income"]'),
('branch1', 'cashBoxExpenseCategories', '["Supplier Payment","Utilities Bill","Rent Payment","Salary Payout","Office Supplies","Maintenance & Repairs","Petty Cash Expense"]'),
('global', 'deletionPin', '"1111"');

--
-- Table structure for table `stock_items`
--
CREATE TABLE `stock_items` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock` decimal(10,2) NOT NULL,
  `averageCost` decimal(10,2) NOT NULL,
  `lowStockThreshold` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `stock_items`
--
INSERT INTO `stock_items` (`id`, `branchId`, `name`, `unit`, `stock`, `averageCost`, `lowStockThreshold`) VALUES
('si_beans', 'branch1', 'Coffee Beans', 'g', 5000.00, 250.00, 1000.00),
('si_milk', 'branch1', 'Whole Milk', 'ml', 10000.00, 50.00, 2000.00),
('si_croissant_dough', 'branch1', 'Croissant Dough', 'pcs', 100.00, 25000.00, 20.00);

--
-- Table structure for table `products`
--
CREATE TABLE `products` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(255) NOT NULL,
  `recipe` text COMMENT 'JSON array of recipe ingredients',
  `costOfGoodsSold` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `products`
--
INSERT INTO `products` (`id`, `branchId`, `name`, `price`, `category`, `recipe`, `costOfGoodsSold`) VALUES
('prod_espresso', 'branch1', 'Espresso', 150000.00, 'Coffee', '[{"stockItemId":"si_beans","quantity":18}]', 4500.00),
('prod_latte', 'branch1', 'Latte', 200000.00, 'Coffee', '[{"stockItemId":"si_beans","quantity":18},{"stockItemId":"si_milk","quantity":150}]', 12000.00),
('prod_croissant', 'branch1', 'Croissant', 120000.00, 'Pastries', '[{"stockItemId":"si_croissant_dough","quantity":1}]', 25000.00);

--
-- Table structure for table `rooms`
--
CREATE TABLE `rooms` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `capacity` int(11) NOT NULL,
  `hourlyRate` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `rooms`
--
INSERT INTO `rooms` (`id`, `branchId`, `name`, `capacity`, `hourlyRate`) VALUES
('room_meeting', 'branch1', 'Meeting Room', 8, 900000.00);

--
-- Empty transactional tables that are still needed
--
CREATE TABLE `reservations` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `roomId` varchar(255) NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `guests` int(11) NOT NULL,
  `scheduledStartTime` datetime NOT NULL,
  `scheduledEndTime` datetime NOT NULL,
  `actualStartTime` datetime DEFAULT NULL,
  `actualEndTime` datetime DEFAULT NULL,
  `status` enum('scheduled','active','completed','cancelled') NOT NULL,
  `items` text COMMENT 'JSON array of order items',
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `transactions` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `invoiceNumber` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `items` text NOT NULL COMMENT 'JSON array of transaction items',
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `paymentMethod` enum('cash','card') NOT NULL,
  `costOfGoodsSold` decimal(10,2) NOT NULL,
  `profit` decimal(10,2) NOT NULL,
  `rentalCharge` decimal(10,2) DEFAULT NULL,
  `reservationId` varchar(255) DEFAULT NULL,
  `amountPaidInCurrency` decimal(10,2) DEFAULT NULL,
  `paymentCurrency` enum('USD','LBP') DEFAULT NULL,
  `changeGiven` decimal(10,2) NOT NULL,
  `usdToLbpRate` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `cashier_sessions` (
  `sessionId` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime DEFAULT NULL,
  `startingInventory` text NOT NULL COMMENT 'JSON object of cashier inventory',
  `currentInventory` text NOT NULL COMMENT 'JSON object of cashier inventory',
  `overageLog` text COMMENT 'JSON array of overage entries',
  `transactions` text COMMENT 'JSON array of session transactions',
  `isActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`sessionId`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `cash_box_entries` (
  `id` varchar(255) NOT NULL,
  `branchId` varchar(255) NOT NULL COMMENT 'Use "main" for the main cash box',
  `date` datetime NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` text,
  `amountLBP` decimal(10,2) NOT NULL,
  `amountUSD` decimal(10,2) NOT NULL,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `isManual` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`, `branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


COMMIT;