-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 03, 2024 at 04:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pesach`
--

-- --------------------------------------------------------

--
-- Table structure for table `ach`
--

CREATE TABLE `ach` (
  `ach_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `routing_number` varchar(255) NOT NULL,
  `account_number` varchar(255) NOT NULL,
  `ach_date` int(11) NOT NULL,
  `ach_type` enum('checking','saving') NOT NULL,
  `amount` double(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ach`
--

INSERT INTO `ach` (`ach_id`, `customer_id`, `order_id`, `name`, `email`, `address`, `city`, `state`, `routing_number`, `account_number`, `ach_date`, `ach_type`, `amount`) VALUES
(1, 1, 1, 'rr', 'test@yopmail.com', 'rr', 'San Francisco', 'San Francisco', '123', '123', 2024, 'checking', 48290.00);

-- --------------------------------------------------------

--
-- Table structure for table `credit_card`
--

CREATE TABLE `credit_card` (
  `credit_card_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `card_number` int(11) NOT NULL,
  `card_holder_name` varchar(255) NOT NULL,
  `card_expiry_date` varchar(255) NOT NULL,
  `cvv` int(11) NOT NULL,
  `amount` double(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` bigint(20) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address_line_1` text NOT NULL,
  `address_line_2` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `zipcode` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `phone` int(11) NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `full_name`, `email`, `address_line_1`, `address_line_2`, `city`, `state`, `zipcode`, `country`, `phone`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 'riken', 'riken@yopmail.com', 'abc', '', 'ahmedabad', 'San Francisco', '123', '', 1234567890, '0000-00-00 00:00:00', '2024-01-03 20:51:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dining`
--

CREATE TABLE `dining` (
  `dining_id` int(11) NOT NULL,
  `dining_name` varchar(255) NOT NULL,
  `above_12_price` double(10,2) NOT NULL,
  `bet_3_11_price` double(10,2) NOT NULL,
  `bet_1_2_age` int(11) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_deleted` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dining`
--

INSERT INTO `dining` (`dining_id`, `dining_name`, `above_12_price`, `bet_3_11_price`, `bet_1_2_age`, `status`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'Gal Elbaz Concert and Dinner', 395.00, 395.00, 0, 'ACTIVE', '2024-01-03 13:49:59', '2024-01-03 13:49:59', '2024-01-03 13:49:59');

-- --------------------------------------------------------

--
-- Table structure for table `dining_date`
--

CREATE TABLE `dining_date` (
  `dining_date_id` bigint(20) NOT NULL,
  `dining_id` bigint(20) NOT NULL,
  `dining_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dining_date`
--

INSERT INTO `dining_date` (`dining_date_id`, `dining_id`, `dining_date`) VALUES
(1, 1, '2024-04-25');

-- --------------------------------------------------------

--
-- Table structure for table `dining_table`
--

CREATE TABLE `dining_table` (
  `dining_table_id` bigint(20) NOT NULL,
  `dining_table_numner` int(11) NOT NULL,
  `max_person` int(11) NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `event_id` bigint(20) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `event_start_date` date NOT NULL,
  `event_end_date` date NOT NULL,
  `status` enum('active','inactive') NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`event_id`, `event_name`, `event_start_date`, `event_end_date`, `status`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 'The Chanukah Experiences', '2024-04-22', '2024-05-01', 'active', '2023-12-26 11:51:49', '2023-12-26 11:51:49', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `payment_type` enum('ACH','CREDIT_CARD') NOT NULL,
  `payment_status` enum('PENDING','PAID','PARTIAL_PAID','REFUND') NOT NULL,
  `total_amount` double(10,2) NOT NULL,
  `order_date` date NOT NULL,
  `seating_arrangements` int(11) NOT NULL,
  `total_no_of_seats_at_your_table` int(11) NOT NULL,
  `additional_information` text NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `customer_id`, `payment_type`, `payment_status`, `total_amount`, `order_date`, `seating_arrangements`, `total_no_of_seats_at_your_table`, `additional_information`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 1, 'ACH', 'PAID', 48290.00, '2024-01-03', 0, 0, '', '2024-01-03 21:18:53', '0000-00-00 00:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_dining_table`
--

CREATE TABLE `order_dining_table` (
  `order_dining_table_id` int(11) NOT NULL,
  `dining_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `dining_date` date NOT NULL,
  `above_12_count` int(11) DEFAULT NULL,
  `above_12_price` double(10,2) DEFAULT NULL,
  `bet_3_11_count` int(11) DEFAULT NULL,
  `bet_3_11_price` double(10,2) DEFAULT NULL,
  `bet_1_2_count` int(11) DEFAULT NULL,
  `bet_1_2_price` double(10,2) NOT NULL,
  `highchairs` int(11) DEFAULT NULL,
  `total_seats` int(11) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `order_dining_table`
--

INSERT INTO `order_dining_table` (`order_dining_table_id`, `dining_id`, `order_id`, `customer_id`, `dining_date`, `above_12_count`, `above_12_price`, `bet_3_11_count`, `bet_3_11_price`, `bet_1_2_count`, `bet_1_2_price`, `highchairs`, `total_seats`, `status`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 1, 0, 1, '2024-04-25', 2, 395.00, 0, 395.00, 2, 0.00, 0, 0, 'active', '2024-01-03 21:19:23', '2024-01-03 21:19:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_package`
--

CREATE TABLE `order_package` (
  `order_package_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `package_id` bigint(20) NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_room`
--

CREATE TABLE `order_room` (
  `order_room_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `package_id` bigint(20) NOT NULL,
  `room_id` bigint(20) NOT NULL,
  `room_price` double(10,2) DEFAULT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `age_group` varchar(255) DEFAULT NULL,
  `no_of_additional_adult` int(11) DEFAULT NULL,
  `no_of_additional_adult_price` double(10,2) DEFAULT NULL,
  `no_of_kids_age_11_18` int(11) DEFAULT NULL,
  `kids_age_11_18_price` double(10,2) DEFAULT NULL,
  `no_of_kids_age_6_10` int(11) DEFAULT NULL,
  `kids_age_6_10_price` double(10,2) DEFAULT NULL,
  `no_of_kids_age_3_5` int(11) DEFAULT NULL,
  `kids_age_3_5_price` double(10,2) DEFAULT NULL,
  `no_of_kids_age_1_2` int(11) DEFAULT NULL,
  `kids_age_1_2_price` double(10,2) DEFAULT NULL,
  `crib_price` double(10,2) DEFAULT NULL,
  `cot_price` double(10,2) DEFAULT NULL,
  `additional_beds` int(11) DEFAULT NULL,
  `early_check_in_price_status` int(11) DEFAULT NULL,
  `early_check_in_price` double(10,2) DEFAULT NULL,
  `check_in` int(11) DEFAULT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `order_room`
--

INSERT INTO `order_room` (`order_room_id`, `order_id`, `package_id`, `room_id`, `room_price`, `check_in_date`, `check_out_date`, `age_group`, `no_of_additional_adult`, `no_of_additional_adult_price`, `no_of_kids_age_11_18`, `kids_age_11_18_price`, `no_of_kids_age_6_10`, `kids_age_6_10_price`, `no_of_kids_age_3_5`, `kids_age_3_5_price`, `no_of_kids_age_1_2`, `kids_age_1_2_price`, `crib_price`, `cot_price`, `additional_beds`, `early_check_in_price_status`, `early_check_in_price`, `check_in`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 1, 1, 1, 9750.00, NULL, NULL, '0', 1, 2000.00, 0, 1750.00, 1, 1200.00, 0, 900.00, 0, 650.00, 50.00, 200.00, NULL, NULL, NULL, NULL, '2024-01-03 21:19:19', '2024-01-03 21:19:19', NULL),
(2, 1, 1, 1, 9750.00, NULL, NULL, '0', 1, 2000.00, 0, 1750.00, 1, 1200.00, 0, 900.00, 0, 650.00, 50.00, 200.00, NULL, NULL, NULL, NULL, '2024-01-03 21:19:19', '2024-01-03 21:19:19', NULL),
(3, 1, 2, 2, 4800.00, NULL, NULL, '0', 2, 900.00, 0, 850.00, 2, 650.00, 0, 450.00, 0, 250.00, 50.00, 100.00, NULL, NULL, NULL, NULL, '2024-01-03 21:19:19', '2024-01-03 21:19:19', NULL),
(4, 1, 2, 2, 4800.00, NULL, NULL, '0', 2, 900.00, 0, 850.00, 2, 650.00, 0, 450.00, 0, 250.00, 50.00, 100.00, NULL, NULL, NULL, NULL, '2024-01-03 21:19:19', '2024-01-03 21:19:19', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `package`
--

CREATE TABLE `package` (
  `package_id` bigint(20) NOT NULL,
  `event_id` bigint(20) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  `package_slug` varchar(255) NOT NULL,
  `package_start_date` date NOT NULL,
  `package_end_date` date NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Dumping data for table `package`
--

INSERT INTO `package` (`package_id`, `event_id`, `package_name`, `package_slug`, `package_start_date`, `package_end_date`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 1, '1 KING BED OR 2 FULL (54”) BEDS', 'all_days', '2024-04-22', '2024-05-01', '2023-12-25 14:16:35', '2023-12-25 14:16:35', NULL),
(2, 1, 'First days Only', 'first_days_only', '2024-04-22', '2024-04-25', '2023-12-26 05:42:15', '2023-12-26 05:42:15', NULL),
(3, 1, 'FIRST DAYS + 1 DAY C”H', 'FIRST DAYS + 1 DAY C”H', '2024-04-22', '2024-04-26', '2023-12-26 06:12:32', '2023-12-26 06:12:32', NULL),
(4, 1, 'LAST DAYS ONLY', 'LAST DAYS ONLY', '2024-04-28', '2024-05-01', '2023-12-26 06:15:27', '2023-12-26 06:15:27', NULL),
(5, 1, 'FIRST DAYS + CHOL HAMOED', 'FIRST DAYS + CHOL HAMOED', '2024-04-22', '2024-04-28', '2023-12-26 06:22:13', '2023-12-26 06:22:13', NULL),
(6, 1, 'CHOL HAMOED + LAST DAYS', 'CHOL HAMOED + LAST DAYS', '2024-04-25', '2024-05-01', '2023-12-26 06:24:39', '2023-12-26 06:24:39', NULL),
(7, 1, 'SHABBOS C”H + LAST DAYS', 'SHABBOS C”H + LAST DAYS', '2024-04-26', '2024-05-01', '2024-01-03 16:43:46', '2024-01-03 16:43:46', NULL),
(8, 1, 'JUST CHOL HAMOED', 'JUST CHOL HAMOED', '2024-04-25', '2024-04-29', '2024-01-03 16:45:41', '2024-01-03 16:45:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `package_rooms`
--

CREATE TABLE `package_rooms` (
  `package_room_id` bigint(20) NOT NULL,
  `package_id` bigint(20) NOT NULL,
  `room_id` bigint(20) NOT NULL,
  `room_price` double(10,2) NOT NULL,
  `per_couple` double(10,2) NOT NULL,
  `early_bird_special_price` double(10,2) NOT NULL,
  `single_occupancy` double(10,2) NOT NULL,
  `duration` int(11) NOT NULL,
  `no_of_additional_adult` int(11) NOT NULL,
  `no_of_additional_kids` int(11) NOT NULL,
  `additional_adult_price` double(10,2) NOT NULL,
  `kids_age_11_18_price` double(10,2) NOT NULL,
  `kids_age_6_10_price` double(10,2) NOT NULL,
  `kids_age_3_5_price` double(10,2) NOT NULL,
  `kids_age_1_2_price` double(10,2) NOT NULL,
  `cribs_price` double(10,2) NOT NULL,
  `cot_price` double(10,2) NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL,
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `package_rooms`
--

INSERT INTO `package_rooms` (`package_room_id`, `package_id`, `room_id`, `room_price`, `per_couple`, `early_bird_special_price`, `single_occupancy`, `duration`, `no_of_additional_adult`, `no_of_additional_kids`, `additional_adult_price`, `kids_age_11_18_price`, `kids_age_6_10_price`, `kids_age_3_5_price`, `kids_age_1_2_price`, `cribs_price`, `cot_price`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, 1, 1, 9750.00, 9750.00, 9200.00, 7500.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-03 16:25:57', '2024-01-03 16:25:57', NULL),
(2, 2, 2, 4800.00, 4800.00, 0.00, 3950.00, 0, 0, 0, 900.00, 850.00, 650.00, 450.00, 250.00, 50.00, 100.00, '2024-01-03 16:29:48', '2024-01-03 16:29:48', NULL),
(3, 3, 3, 5500.00, 5500.00, 0.00, 4650.00, 0, 0, 0, 0.00, 900.00, 700.00, 500.00, 300.00, 50.00, 125.00, '2024-01-03 16:31:53', '2024-01-03 16:31:53', NULL),
(4, 4, 4, 3600.00, 3600.00, 0.00, 3000.00, 0, 0, 0, 900.00, 700.00, 500.00, 350.00, 250.00, 50.00, 100.00, '2024-01-03 16:34:01', '2024-01-03 16:34:01', NULL),
(5, 5, 5, 7950.00, 7950.00, 0.00, 6800.00, 0, 0, 0, 1600.00, 1450.00, 1100.00, 800.00, 550.00, 50.00, 180.00, '2024-01-03 16:40:30', '2024-01-03 16:40:30', NULL),
(6, 6, 6, 7200.00, 7200.00, 0.00, 6200.00, 0, 0, 0, 1500.00, 1250.00, 900.00, 650.00, 500.00, 50.00, 180.00, '2024-01-03 16:42:36', '2024-01-03 16:42:36', NULL),
(7, 7, 7, 6900.00, 6900.00, 0.00, 6000.00, 0, 0, 0, 1450.00, 1200.00, 850.00, 600.00, 450.00, 50.00, 150.00, '2024-01-03 16:44:36', '2024-01-03 16:44:36', NULL),
(8, 8, 8, 4500.00, 4500.00, 0.00, 3500.00, 0, 0, 0, 1000.00, 800.00, 600.00, 500.00, 400.00, 50.00, 100.00, '2024-01-03 16:46:28', '2024-01-03 16:46:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `room_id` bigint(20) NOT NULL,
  `room_number` varchar(255) NOT NULL,
  `room_name` varchar(255) NOT NULL,
  `max_person` int(11) NOT NULL,
  `description` text NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`room_id`, `room_number`, `room_name`, `max_person`, `description`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, '101', '1 KING BED OR 2 FULL (54”) BEDS', 4, '', '2024-01-03 16:25:12', '2024-01-03 20:55:44', NULL),
(2, '102', 'FIRST DAYS ONLY', 4, '', '2024-01-03 16:29:11', '2024-01-03 20:59:31', NULL),
(3, '103', 'FIRST DAYS + 1 DAY C”H', 4, '', '2024-01-03 16:31:34', '2024-01-03 21:01:46', NULL),
(4, '104', 'LAST DAYS ONLY', 4, '', '2024-01-03 16:33:28', '2024-01-03 21:03:52', NULL),
(5, '105', 'FIRST DAYS + CHOL HAMOED', 4, '', '2024-01-03 16:39:45', '2024-01-03 21:10:09', NULL),
(6, '106', 'CHOL HAMOED + LAST DAYS', 4, '', '2024-01-03 16:42:16', '2024-01-03 21:12:31', NULL),
(7, '107', 'SHABBOS C”H + LAST DAYS', 4, '', '2024-01-03 16:44:13', '2024-01-03 21:14:30', NULL),
(8, '108', 'JUST CHOL HAMOED', 4, '', '2024-01-03 16:46:12', '2024-01-03 21:16:24', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ach`
--
ALTER TABLE `ach`
  ADD PRIMARY KEY (`ach_id`);

--
-- Indexes for table `credit_card`
--
ALTER TABLE `credit_card`
  ADD PRIMARY KEY (`credit_card_id`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `dining`
--
ALTER TABLE `dining`
  ADD PRIMARY KEY (`dining_id`);

--
-- Indexes for table `dining_date`
--
ALTER TABLE `dining_date`
  ADD PRIMARY KEY (`dining_date_id`);

--
-- Indexes for table `dining_table`
--
ALTER TABLE `dining_table`
  ADD PRIMARY KEY (`dining_table_id`);

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`event_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `order_dining_table`
--
ALTER TABLE `order_dining_table`
  ADD PRIMARY KEY (`order_dining_table_id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `order_package`
--
ALTER TABLE `order_package`
  ADD PRIMARY KEY (`order_package_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `order_room`
--
ALTER TABLE `order_room`
  ADD PRIMARY KEY (`order_room_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `package`
--
ALTER TABLE `package`
  ADD PRIMARY KEY (`package_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `package_rooms`
--
ALTER TABLE `package_rooms`
  ADD PRIMARY KEY (`package_room_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`room_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ach`
--
ALTER TABLE `ach`
  MODIFY `ach_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `credit_card`
--
ALTER TABLE `credit_card`
  MODIFY `credit_card_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dining`
--
ALTER TABLE `dining`
  MODIFY `dining_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dining_date`
--
ALTER TABLE `dining_date`
  MODIFY `dining_date_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dining_table`
--
ALTER TABLE `dining_table`
  MODIFY `dining_table_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `event_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_dining_table`
--
ALTER TABLE `order_dining_table`
  MODIFY `order_dining_table_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_package`
--
ALTER TABLE `order_package`
  MODIFY `order_package_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_room`
--
ALTER TABLE `order_room`
  MODIFY `order_room_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `package`
--
ALTER TABLE `package`
  MODIFY `package_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `package_rooms`
--
ALTER TABLE `package_rooms`
  MODIFY `package_room_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `room_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `order_room`
--
ALTER TABLE `order_room`
  ADD CONSTRAINT `order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `package_id` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `package`
--
ALTER TABLE `package`
  ADD CONSTRAINT `event_id` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Constraints for table `package_rooms`
--
ALTER TABLE `package_rooms`
  ADD CONSTRAINT `package_rooms_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `package` (`package_id`),
  ADD CONSTRAINT `room_id` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
