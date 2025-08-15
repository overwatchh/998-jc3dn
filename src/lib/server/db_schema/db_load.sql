USE qr_attendance_app;

--
-- Dumping data for table `user`
-- Password is Abcd@1234
--

INSERT INTO `user` (`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`, `role`) VALUES
('h8nKiTVlYKqt1FpQxHWG6IUDDugNu9NS', 'Admin 1', 'adm1@uowmail.edu.com', 0, NULL, '2025-08-06 13:04:26', '2025-08-06 13:04:26', 'admin'),
('hrEpeIa27ITirYij0FJRAYgbMledKcuw', 'Lecturer 1', 'lec1@uowmail.edu.com', 0, NULL, '2025-08-06 13:03:20', '2025-08-06 13:03:20', 'lecturer'),
('Pl3aUloS8SowYGhvBTnUH2nocxPPXE41', 'Lecturer 2', 'lec2@uowmail.edu.com', 0, NULL, '2025-08-06 13:03:53', '2025-08-06 13:03:53', 'lecturer'),
('QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw', 'Lecturer 3', 'lec3@uowmail.edu.com', 0, NULL, '2025-08-06 13:04:02', '2025-08-06 13:04:02', 'lecturer'),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 'Student 1', 'stu1@uowmail.edu.com', 0, NULL, '2025-08-06 13:00:50', '2025-08-06 13:00:50', 'student'),
('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 'Student 2', 'stu2@uowmail.edu.com', 0, NULL, '2025-08-06 13:02:07', '2025-08-06 13:02:07', 'student'),
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 'Student 3', 'stu3@uowmail.edu.com', 0, NULL, '2025-08-06 13:02:18', '2025-08-06 13:02:18', 'student'),
('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 'Student 4', 'stu4@uowmail.edu.com', 0, NULL, '2025-08-06 13:02:28', '2025-08-06 13:02:28', 'student'),
('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 'Student 5', 'stu5@uowmail.edu.com', 0, NULL, '2025-08-06 13:02:37', '2025-08-06 13:02:37', 'student');


--
-- Dumping data for table `account`
--

INSERT INTO `account` (`id`, `accountId`, `providerId`, `userId`, `accessToken`, `refreshToken`, `idToken`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `scope`, `password`, `createdAt`, `updatedAt`) VALUES
('58iVuE67YDIIfDYDJWZcLciQ6ozTDFHn', 'zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 'credential', 'zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', NULL, NULL, NULL, NULL, NULL, NULL, 'c8a7edeb50f41f24380aceba5ab02e33:8bea744a25787bdf44533cc1955e762a3943b6cc34da36a91039cad133470b37d05a9b7bccab30cbe9aef9d9b3abcfe60e82c844b75ccb01dd7fa289395d5eb6', '2025-08-06 13:02:07', '2025-08-06 13:02:07'),
('DSy9kmgw1kSkxgdPO1B3W3tOsTmcHpns', 'w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 'credential', 'w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', NULL, NULL, NULL, NULL, NULL, NULL, '1f0f05830857b21e210ff38f4f000abf:1c0053a585605ed23d2b102c0454afc46ae4afc8c37f79cf5d096978d721f4fbc68ff60aff0ea8d45b1f255945e406b56cff05a578414f069120a01017a59ff1', '2025-08-06 13:02:38', '2025-08-06 13:02:38'),
('JhkYtBm9VREgqjz9Q6Ody8Ru8aeLq59X', 'xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 'credential', 'xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', NULL, NULL, NULL, NULL, NULL, NULL, '2bbf8423dc477cf4969be500ff607f4e:bebf743cfa45516497051bf9bb6d39a193fe3744d263333fd6877f18daeddac73704f73a95f16c355f5100610f4aae37a08e909f01c6892fe27e225a89af04c8', '2025-08-06 13:02:28', '2025-08-06 13:02:28'),
('kbpmn128AymnZD8FUjCGppuv0bZZkStE', 'h8nKiTVlYKqt1FpQxHWG6IUDDugNu9NS', 'credential', 'h8nKiTVlYKqt1FpQxHWG6IUDDugNu9NS', NULL, NULL, NULL, NULL, NULL, NULL, 'fe8aa201d4f24150db49cee72bde79e4:04e65a197012bc18b7889d4f5dbe906bbd46735bab060579035c0f4c180890fa27083a22ff96ef114e6638d141fd200ec477a3e29b76dc4dafb82b6b75294f0b', '2025-08-06 13:04:26', '2025-08-06 13:04:26'),
('Kov2vkTaUXHftDLZRKFVq89I9c7Bl2BS', 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41', 'credential', 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41', NULL, NULL, NULL, NULL, NULL, NULL, 'a577408d701964a024dfe5c400b41498:227b2b5ed259c072eea5117700c1f7e030315813a5a67919177fad76dfa8310e62970d322961892991096c84a7e6905db6f82a48c5c40a15048c5bc8c1b995c6', '2025-08-06 13:03:53', '2025-08-06 13:03:53'),
('oBaoUhHwYqTMyJNjdNyjA7uCF8DE4h29', 'hrEpeIa27ITirYij0FJRAYgbMledKcuw', 'credential', 'hrEpeIa27ITirYij0FJRAYgbMledKcuw', NULL, NULL, NULL, NULL, NULL, NULL, '7923ab18fdc55b7acfbdd2fb5baae43a:cbdc33fbbb1faeab00da446728677099c6a9727294f450e86840e5d6d1460c7a9f5f317d6b37f8f10d46e5a3caa9c3b4021bb710e65cbf8621f3ffef865557e5', '2025-08-06 13:03:20', '2025-08-06 13:03:20'),
('px8Diq69MIf1kZ1rzQP5wp1mUx586lZz', 'QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw', 'credential', 'QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw', NULL, NULL, NULL, NULL, NULL, NULL, '9d2dbf0611a6a6c7167a9e3774be9e87:12b61a53ae62795a5e45832d03cfba96d0b3633bfa08062d09825917fd9890ae81f7a86f48b7931d21c74767bc45fda11c95edf7cce02e19d29aee0586854a0e', '2025-08-06 13:04:02', '2025-08-06 13:04:02'),
('rAVP2ISUEwoFGI4vAKwFQPn5m8SNkBYP', 'MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 'credential', 'MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', NULL, NULL, NULL, NULL, NULL, NULL, 'd397b474de7d2ac972b160f304bc4fb9:96129fb28625f75be913e6d59652e47da86c74d6841e5d50f8fd160dd3638e9245f1670966e7952b4e45b2adba949d1109d178d8c1037873305022afc1817f11', '2025-08-06 13:00:50', '2025-08-06 13:00:50'),
('RWvYT0XU0eB5H897TOa5CiaO10Xui17G', 'UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 'credential', 'UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', NULL, NULL, NULL, NULL, NULL, NULL, '6725f0ab1ce173eb90977a40b313ec25:e618059e7033c4d7b79da75267611b958c45a38883ce6ee3b792d5a01b3ab710aa1fcac1a63ad44dca2ed1a9ef1e2d92894e67dd06326a5eed36f2706631e5ed', '2025-08-06 13:02:18', '2025-08-06 13:02:18');

--
-- Dumping data for table `session`
--

INSERT INTO `session` (`id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`) VALUES
('6gQHKTuDgVlsMHfh5Oyu3V2wo19NrNio', '2025-08-13 13:02:28', 'sZ98oims7dtxu1Lvf3p1VRKwut3rLJ5g', '2025-08-06 13:02:28', '2025-08-06 13:02:28', '', '', 'xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5'),
('eDRki9Ogi15ViOa9pqli6CLT2DBbniJQ', '2025-08-13 13:02:38', 'VrzIxOiRYXpUdDO5sjsBqKPYvkePRmft', '2025-08-06 13:02:38', '2025-08-06 13:02:38', '', '', 'w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx'),
('frMIV2TT7IfXH2nrcQ4bic9moKyJ6GoO', '2025-08-13 13:00:50', 'lSbjTckKmdmAscz7kzyFbPjISsq4g8Ls', '2025-08-06 13:00:50', '2025-08-06 13:00:50', '', '', 'MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd'),
('HTRe7gkzL4l6V6nOJP8eEoc68FEvtfU2', '2025-08-13 13:03:53', 'bUw5b7KrptGEOKWAbjEbGf9PYP5dWVG7', '2025-08-06 13:03:53', '2025-08-06 13:03:53', '', '', 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41'),
('NKoyxOVEnvQTkpDaQ0yTVP8K37LRwIZf', '2025-08-13 13:02:07', 'l3ycwZddRFhzSXrtsKf3Rh4F2fxA4DrX', '2025-08-06 13:02:07', '2025-08-06 13:02:07', '', '', 'zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5'),
('RaqOmLzgOMpUVsiBamzlmX2a7HpZ0x9s', '2025-08-13 13:04:26', 'Q9rEccMTGJn5vTO2cKE3QjPPofEAq9lW', '2025-08-06 13:04:26', '2025-08-06 13:04:26', '', '', 'h8nKiTVlYKqt1FpQxHWG6IUDDugNu9NS'),
('SRBUBakGv1ETk9RPQC8RSPA2egRXYWru', '2025-08-13 13:02:18', 'YzNfTynJap00qTUpDr4EZFxhLMZbPEZV', '2025-08-06 13:02:18', '2025-08-06 13:02:18', '', '', 'UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp'),
('ThWUWLhjpG0Fay9xGQZqVA2Nd7xwTmjE', '2025-08-13 13:04:02', 'DRKFOqTddN76jQ2aKaG1wJZL3RnIt5Op', '2025-08-06 13:04:02', '2025-08-06 13:04:02', '', '', 'QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw'),
('vHvvwQCPXFbSupgRMtLjTpSuBJ9U0l1V', '2025-08-13 13:03:20', 'sEkimNwmWYSGmNLQDCAbuDyKUvZIoG1r', '2025-08-06 13:03:20', '2025-08-06 13:03:20', '', '', 'hrEpeIa27ITirYij0FJRAYgbMledKcuw');

-- Semesters
INSERT INTO semesters (id, name, year) VALUES
(1, 'spring', 2024),
(2, 'autumn', 2025),
(3, 'spring', 2025);

-- Courses
INSERT INTO courses (name, code, semester_id, status) VALUES
('Project management', 'CSIT883', 1, 'finished'),
('Database management', 'CSIT882', 2, 'finished'),
('Research methodology', 'CSIT940', 3, 'active'),
('Demo webserver', 'MTS9307', 3, 'active'),
('Computer vision algorithms and systems', 'CSCI935', 3, 'active');

-- Course Lecturers
INSERT INTO course_lecturers (course_id, lecturer_id) VALUES
(1, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(2, 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41'),
(3, 'QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw'),
(4, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(5, 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41');

-- Locations
INSERT INTO locations (building_name, room_number, description, latitude, longitude) VALUES
('Lib', '101', 'Library', -34.406735319735034, 150.87855122064795),
('20', '102', 'Building 20', -34.405756696459065, 150.8784914211785),
('14', '201', 'Building 14', -34.40637101770338, 150.8801386108864),
('17', '202', 'Building 17', -34.40727843969014, 150.87895838559652),
('2', '103', 'Building 2', -34.40661777021882, 150.88137803896953),
('3', '103', 'Building 3', -34.40599667280061, 150.8823234816749),
('22', '103', 'Building 22', -34.404630436746494, 150.87661222539015),
('40', '103', 'Building 40', -34.4062537916668, 150.87683726956962),
('35', '103', 'Building 35', -34.40582005010667, 150.88081766767468),
('67', '202', 'Building 67', -34.40458820292591, 150.87731246467433);

-- Course Sessions (1 lecture + 2 labs each course)
INSERT INTO course_sessions (course_id, type, day_of_week, start_time, end_time, location_id) VALUES
-- CSIT883
(1, 'lecture', 'Monday', '09:00:00', '11:00:00', 1),
(1, 'lab', 'Wednesday', '13:00:00', '15:00:00', 2),
(1, 'lab', 'Friday', '10:00:00', '12:00:00', 3),
-- CSIT882
(2, 'lecture', 'Tuesday', '08:00:00', '10:00:00', 4),
(2, 'lab', 'Thursday', '14:00:00', '16:00:00', 5),
(2, 'lab', 'Friday', '12:00:00', '14:00:00', 6),
-- CSIT940
(3, 'lecture', 'Wednesday', '11:00:00', '13:00:00', 7),
(3, 'lab', 'Thursday', '10:00:00', '12:00:00', 8),
(3, 'lab', 'Friday', '14:00:00', '16:00:00', 9),
-- MTS9307
(4, 'lecture', 'Monday', '13:00:00', '15:00:00', 10),
(4, 'lab', 'Tuesday', '10:00:00', '12:00:00', 1),
(4, 'lab', 'Thursday', '08:00:00', '10:00:00', 2),
-- CSCI935
(5, 'lecture', 'Friday', '09:00:00', '11:00:00', 3),
(5, 'lab', 'Wednesday', '15:00:00', '17:00:00', 4),
(5, 'lab', 'Thursday', '16:00:00', '18:00:00', 5);

-- enrollments — 5 students assigned to 5 courses
INSERT INTO enrollments (student_id, course_id) VALUES
-- student 1, student 2 enrolled course 1
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 1), ('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 1),
 -- student 3, student 4 enrolled course 2
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 2), ('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 2),
-- student 5 enrolled course 3
('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 3),
-- student 1,2,3 enrolled course 4
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 4), ('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 4),('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp',4),
-- student 3,4,5 enrolled course 5
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 5), ('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 5), ('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 5);

-- QR codes for course 5
-- INSERT INTO session_qr_codes (course_session_id, qr_code, generated_at, valid_until, week_number) VALUES
-- (13, 'QR_13_2_6477e554', '2025-07-14 08:00:00', '2025-07-14 23:59:59', 2),
-- (14, 'QR_14_2_42054543', '2025-07-14 08:00:00', '2025-07-14 23:59:59', 2),
-- (15, 'QR_15_2_ae879978', '2025-07-14 08:00:00', '2025-07-14 23:59:59', 2);

-- INSERT INTO attendance (student_id, session_id, qr_code_id, checkin_time, latitude, longitude) VALUES
-- (1, 13, 1, '2025-07-14 09:30:00', -34.4072165, 150.8793267),
-- (2, 14, 2, '2025-07-14 10:15:00', -34.4071712, 150.8797944),
-- (5, 15, 3, '2025-07-14 10:45:00', -34.4074413, 150.8796216);



