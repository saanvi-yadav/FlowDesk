-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: localhost    Database: flowdesk
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (13,'Rahul Sharma','rahul@flowdesk.com','Developer','Engineering'),(14,'Priya Patel','priya@flowdesk.com','Designer','UI/UX'),(15,'Arjun Nair','arjun@flowdesk.com','Manager','Operations');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Engineering','Builds and maintains FlowDesk products and internal systems.','2026-04-05 11:30:00'),(2,'UI/UX','Designs user experiences, interfaces, and visual systems.','2026-04-05 11:31:00'),(3,'Operations','Handles company operations, delivery planning, and execution.','2026-04-05 11:32:00'),(4,'HR','Manages hiring, employee support, and internal policies.','2026-04-05 11:33:00'),(5,'Finance','Owns budgets, payroll coordination, and financial reporting.','2026-04-05 11:34:00');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_name` varchar(150) DEFAULT NULL,
  `description` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'FlowDesk Web Revamp','Refresh the company management platform UI and core workflows.',1,'2026-04-05 12:00:00'),(2,'HR Automation Setup','Build attendance, leave, and payroll automation modules.',2,'2026-04-05 12:15:00');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `description` text,
  `status` varchar(50) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (7,'Design Dashboard UI',NULL,'IN_PROGRESS',2,1,'2026-03-20','HIGH'),(8,'API Integration',NULL,'DONE',1,1,'2026-03-22','MEDIUM'),(9,'Project Planning',NULL,'TO_DO',3,2,'2026-03-15','LOW'),(10,'Kanban Feature',NULL,'DONE',1,1,'2026-03-25','HIGH');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','employee') DEFAULT 'employee',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'sreesahithi','p.sreesahithi2212@gmail.com','scrypt:32768:8:1$7ZltaINtdoPLqlN9$4103ec6c1c3f83a46fc88c84f4d19a9d7f8831fc2e709a1aa8d3d940882fe554e0a174009db29ea3c85e1f9a0e5590ac639e6b657880479961b77c95795571a6','admin','2026-02-17 21:41:09'),(2,'test','test@gmail.com','scrypt:32768:8:1$zCSoigptcTo7JZQK$c8717cb9467869e5917b1a2203e77b186d158b083f46c4068e22b3f06d7fd5900605766b73004fe8b05c4b9a5e834cc9ad0cc4f7397b36a506dfb650254f4957','manager','2026-03-10 18:51:07'),(3,'smily','smily@gmail.com','scrypt:32768:8:1$Q5ZEYGNVCXtrAqSR$87f8e4fc55f76197d9792ff3491fb9181d34f270fae8c38ddab5b51502739e4a71416e20bd70a8d004e426846b50e95c284954b765beaa52962f50218adb074f','employee','2026-03-11 05:59:18'),(6,'lily','lily@gmail.com','scrypt:32768:8:1$VKQxTnezSFcOYb4K$da4c728ae71adb0935851147a9943bb4f75087384f5a432da78953932237d2dd38ecd1f71e3189fb70add39edbcdd459f728caf5c355909038f300973e38c5fd','employee','2026-03-18 07:27:56'),(23,'prakash','prashu@gmail.com','scrypt:32768:8:1$eiBWWntnUqS9j80h$234e04b142e5bfcb2f9aa738fcd725b8cfeb507b9c5967f1b755c84ff04f46cbc810346ce66d1953f734335e0f6ea7e593cc716bfe0ff793355fa637d4220deb','employee','2026-03-31 17:03:32');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` enum('present','absent','half_day','leave') DEFAULT 'present',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `leave_type` enum('sick','vacation','personal','unpaid','emergency') DEFAULT 'vacation',
  `reason` text,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `review_notes` text,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET UNIQUE_CHECKS=@UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40101 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-12 10:30:00


