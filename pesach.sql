-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 16, 2024 at 01:38 PM
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

-- --------------------------------------------------------

--
-- Table structure for table `credit_card`
--

CREATE TABLE `credit_card` (
  `credit_card_id` bigint(20) NOT NULL,
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `card_number` bigint(20) NOT NULL,
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
(1, 'GAL ELBAZ CONCERT AND DINNER', 395.00, 395.00, 0, 'ACTIVE', '2024-01-03 13:49:59', '2024-01-03 13:49:59', '2024-01-03 13:49:59');

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
(1, 'The Pesach Experience', '2024-04-22', '2024-05-01', 'active', '2023-12-26 11:51:49', '2023-12-26 11:51:49', NULL);

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
  `room_unique_id` bigint(20) NOT NULL,
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

-- --------------------------------------------------------

--
-- Table structure for table `order_room_guest`
--

CREATE TABLE `order_room_guest` (
  `order_room_guest_id` bigint(20) NOT NULL,
  `order_room_id` bigint(20) DEFAULT NULL,
  `guest_first_name` varchar(255) DEFAULT NULL,
  `guest_last_name` varchar(255) DEFAULT NULL,
  `guest_age` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 1, 'FULL PESACH', 'FULL PESACH', '2024-04-22', '2024-05-01', '2024-01-08 08:25:58', '2024-01-08 08:25:58', NULL),
(2, 1, 'FIRST DAYS ONLY', 'FIRST DAYS ONLY', '2024-04-22', '2024-04-25', '2024-01-08 08:26:39', '2024-01-08 08:26:39', NULL),
(3, 1, 'FIRST DAYS + 1 DAY C\"\"H', 'FIRST DAYS + 1 DAY C\"\"H', '2024-04-22', '2024-04-25', '2024-01-08 08:27:09', '2024-01-08 08:27:09', NULL),
(4, 1, 'CHOL HAMOED', 'CHOL HAMOED', '2024-04-25', '2024-04-28', '2024-01-08 08:27:48', '2024-01-08 08:27:48', NULL),
(5, 1, 'FIRST DAYS + CHOL HAMOED', 'FIRST DAYS + CHOL HAMOED', '2024-04-22', '2024-04-28', '2024-01-08 08:28:14', '2024-01-08 08:28:14', NULL),
(6, 1, 'CHOL HAMOED + LAST DAYS', 'CHOL HAMOED + LAST DAYS', '2024-04-25', '2024-05-01', '2024-01-08 08:28:40', '2024-01-08 08:28:40', NULL),
(7, 1, 'SHABBOS C\"\"H + LAST DAYS', 'SHABBOS C\"\"H + LAST DAYS', '2024-04-26', '2024-05-01', '2024-01-08 08:29:02', '2024-01-08 08:29:02', NULL),
(8, 1, 'LAST DAYS', 'LAST DAYS', '2024-04-28', '2024-05-01', '2024-01-08 08:29:33', '2024-01-08 08:29:33', NULL);

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
(1, 1, 1, 9750.00, 9750.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:37:53', '2024-01-08 09:37:53', NULL),
(2, 1, 2, 9750.00, 9750.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:41:52', '2024-01-08 09:41:52', NULL),
(3, 1, 3, 7500.00, 0.00, 0.00, 7500.00, 0, 0, 0, 0.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:42:44', '2024-01-08 09:42:44', NULL),
(4, 1, 4, 11500.00, 11500.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:43:53', '2024-01-08 09:43:53', NULL),
(5, 1, 5, 12500.00, 12500.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:44:26', '2024-01-08 09:44:26', NULL),
(6, 1, 6, 16000.00, 16000.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:45:00', '2024-01-08 09:45:00', NULL),
(7, 1, 7, 17000.00, 17000.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:45:33', '2024-01-08 09:45:33', NULL),
(8, 1, 8, 21000.00, 21000.00, 0.00, 0.00, 0, 0, 0, 2000.00, 1750.00, 1200.00, 900.00, 650.00, 50.00, 200.00, '2024-01-08 09:46:05', '2024-01-08 09:46:05', NULL),
(9, 2, 1, 4800.00, 4800.00, 0.00, 0.00, 0, 0, 0, 900.00, 850.00, 650.00, 450.00, 250.00, 50.00, 100.00, '2024-01-08 09:46:34', '2024-01-08 09:46:34', NULL),
(10, 2, 2, 4800.00, 4800.00, 0.00, 0.00, 0, 0, 0, 900.00, 850.00, 650.00, 450.00, 250.00, 50.00, 100.00, '2024-01-08 09:48:06', '2024-01-08 09:48:06', NULL),
(11, 2, 3, 3950.00, 0.00, 0.00, 3950.00, 0, 0, 0, 0.00, 850.00, 650.00, 450.00, 250.00, 50.00, 100.00, '2024-01-08 09:48:46', '2024-01-08 09:48:46', NULL),
(12, 3, 1, 5500.00, 5500.00, 0.00, 0.00, 0, 0, 0, 1000.00, 900.00, 700.00, 500.00, 300.00, 50.00, 125.00, '2024-01-08 09:49:45', '2024-01-08 09:49:45', NULL),
(13, 3, 2, 5500.00, 5500.00, 0.00, 0.00, 0, 0, 0, 1000.00, 900.00, 700.00, 500.00, 300.00, 50.00, 125.00, '2024-01-08 09:50:52', '2024-01-08 09:50:52', NULL),
(14, 3, 3, 4650.00, 0.00, 0.00, 4650.00, 0, 0, 0, 0.00, 900.00, 700.00, 500.00, 300.00, 50.00, 125.00, '2024-01-08 09:51:44', '2024-01-08 09:51:44', NULL),
(15, 4, 1, 4500.00, 4500.00, 0.00, 0.00, 0, 0, 0, 1000.00, 800.00, 600.00, 500.00, 400.00, 50.00, 100.00, '2024-01-08 09:52:47', '2024-01-08 09:52:47', NULL),
(16, 4, 2, 4500.00, 4500.00, 0.00, 0.00, 0, 0, 0, 1000.00, 800.00, 600.00, 500.00, 400.00, 50.00, 100.00, '2024-01-08 09:53:36', '2024-01-08 09:53:36', NULL),
(17, 4, 3, 3500.00, 0.00, 0.00, 3500.00, 0, 0, 0, 0.00, 800.00, 600.00, 500.00, 400.00, 50.00, 100.00, '2024-01-08 09:54:05', '2024-01-08 09:54:05', NULL),
(18, 5, 1, 7950.00, 7950.00, 0.00, 0.00, 0, 0, 0, 1600.00, 1450.00, 1100.00, 800.00, 550.00, 50.00, 200.00, '2024-01-08 09:54:59', '2024-01-08 09:54:59', NULL),
(19, 5, 2, 7950.00, 7950.00, 0.00, 0.00, 0, 0, 0, 1600.00, 1450.00, 1100.00, 800.00, 550.00, 50.00, 200.00, '2024-01-08 09:55:47', '2024-01-08 09:55:47', NULL),
(20, 5, 3, 6800.00, 0.00, 0.00, 6800.00, 0, 0, 0, 0.00, 1450.00, 1100.00, 800.00, 550.00, 50.00, 200.00, '2024-01-08 09:56:47', '2024-01-08 09:56:47', NULL),
(21, 6, 1, 7200.00, 7200.00, 0.00, 0.00, 0, 0, 0, 1500.00, 1250.00, 900.00, 650.00, 500.00, 50.00, 180.00, '2024-01-08 09:57:38', '2024-01-08 09:57:38', NULL),
(22, 6, 2, 7200.00, 7200.00, 0.00, 0.00, 0, 0, 0, 1500.00, 1250.00, 900.00, 650.00, 500.00, 50.00, 180.00, '2024-01-08 09:58:43', '2024-01-08 09:58:43', NULL),
(23, 6, 3, 6200.00, 0.00, 0.00, 6200.00, 0, 0, 0, 0.00, 1250.00, 900.00, 650.00, 500.00, 50.00, 180.00, '2024-01-08 09:59:35', '2024-01-08 09:59:35', NULL),
(24, 7, 1, 6900.00, 6900.00, 0.00, 0.00, 0, 0, 0, 1450.00, 1200.00, 850.00, 600.00, 450.00, 50.00, 150.00, '2024-01-08 10:00:31', '2024-01-08 10:00:31', NULL),
(25, 7, 2, 6900.00, 6900.00, 0.00, 0.00, 0, 0, 0, 1450.00, 1200.00, 850.00, 600.00, 450.00, 50.00, 150.00, '2024-01-08 10:01:15', '2024-01-08 10:01:15', NULL),
(26, 7, 3, 6000.00, 0.00, 0.00, 6000.00, 0, 0, 0, 0.00, 1200.00, 850.00, 600.00, 450.00, 50.00, 150.00, '2024-01-08 10:02:21', '2024-01-08 10:02:21', NULL),
(27, 8, 1, 3600.00, 3600.00, 0.00, 0.00, 0, 0, 0, 900.00, 700.00, 500.00, 350.00, 250.00, 50.00, 100.00, '2024-01-08 10:03:12', '2024-01-08 10:03:12', NULL),
(28, 8, 2, 3600.00, 3600.00, 0.00, 0.00, 0, 0, 0, 900.00, 700.00, 500.00, 350.00, 250.00, 50.00, 100.00, '2024-01-08 10:04:01', '2024-01-08 10:04:01', NULL),
(29, 8, 3, 3000.00, 0.00, 0.00, 3000.00, 0, 0, 0, 0.00, 700.00, 500.00, 350.00, 250.00, 50.00, 100.00, '2024-01-08 10:04:45', '2024-01-08 10:04:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `room_id` bigint(20) NOT NULL,
  `room_number` varchar(255) DEFAULT NULL,
  `room_name` varchar(255) NOT NULL,
  `max_person` int(11) DEFAULT NULL,
  `description` text NOT NULL,
  `created_date` datetime NOT NULL,
  `updated_date` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`room_id`, `room_number`, `room_name`, `max_person`, `description`, `created_date`, `updated_date`, `is_deleted`) VALUES
(1, '', 'STANDARD KING ROOM', 0, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 08:30:37', '2024-01-08 13:01:59', NULL),
(2, NULL, 'STANDARD DOUBLE ROOM', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:35:12', '2024-01-08 14:05:24', NULL),
(3, '', 'SINGLE OCCUPANCY', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:35:37', '2024-01-08 14:05:46', NULL),
(4, NULL, 'JR SUITE', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:36:08', '2024-01-08 14:06:18', NULL),
(5, NULL, 'VIP JR SUITE', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:36:26', '2024-01-08 14:06:35', NULL),
(6, NULL, 'EXECUTIVE SUITE\r\n', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:36:45', '2024-01-08 14:06:55', NULL),
(7, NULL, 'EXECUITE SUITE WITH JACUZZI\r\n', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:37:01', '2024-01-08 14:07:09', NULL),
(8, NULL, 'PRESIDENTIAL SUITE\r\n', NULL, 'There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don\'t look even slightly believable.', '2024-01-08 09:37:16', '2024-01-08 14:07:24', NULL);

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
-- Indexes for table `order_room_guest`
--
ALTER TABLE `order_room_guest`
  ADD PRIMARY KEY (`order_room_guest_id`);

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
  MODIFY `ach_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_card`
--
ALTER TABLE `credit_card`
  MODIFY `credit_card_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` bigint(20) NOT NULL AUTO_INCREMENT;

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
  MODIFY `order_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_dining_table`
--
ALTER TABLE `order_dining_table`
  MODIFY `order_dining_table_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_package`
--
ALTER TABLE `order_package`
  MODIFY `order_package_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_room`
--
ALTER TABLE `order_room`
  MODIFY `order_room_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_room_guest`
--
ALTER TABLE `order_room_guest`
  MODIFY `order_room_guest_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `package`
--
ALTER TABLE `package`
  MODIFY `package_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `package_rooms`
--
ALTER TABLE `package_rooms`
  MODIFY `package_room_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

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
