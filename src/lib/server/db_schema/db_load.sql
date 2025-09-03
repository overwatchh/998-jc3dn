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
('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 'Student 5', 'stu5@uowmail.edu.com', 0, NULL, '2025-08-06 13:02:37', '2025-08-06 13:02:37', 'student'),
('I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6', 'Khoa Nguyen', 'khoa@uow.edu.au', 0, NULL, '2025-09-02 20:39:00', '2025-09-02 20:39:00', 'lecturer'),
('TicPM3HkVBNntKwJ2p5Nlmq5fBJSLHVY', 'Justin James Quinn', 'jjq157@uowmail.edu.au', 0, NULL, '2025-09-02 20:40:57', '2025-09-02 20:40:57', 'student'),
('4aRIUgAzGqSDOTXgMt4U0LIZujYSaYPi', 'Deepak Kumar Sunar', 'dks695@uowmail.edu.au', 0, NULL, '2025-09-02 20:44:29', '2025-09-02 20:44:29', 'student'),
('wKoHWAzrHuZ9LyDFSYipEpSBUNVoZiz8', 'Changu Doreen Chankie-Madoda', 'cdcm052@uowmail.edu.au', 0, NULL, '2025-09-02 20:42:05', '2025-09-02 20:42:05', 'student'),
('ZXasbU3XBwpLIAyIEKdPqxFLqbJvwSXl', 'Ngo Minh Thu Le', 'nmtl087@uowmail.edu.au', 0, NULL, '2025-09-02 20:43:23', '2025-09-02 20:43:23', 'student'),
('7kwyGLjoLq10So1RvbMv9DrftPtdsnme', 'Dai Duong Phan', 'ddp505@uowmail.edu.au', 0, NULL, '2025-09-02 20:45:21', '2025-09-02 20:45:21', 'student'),
('HRVe0ah5AzQidmSNNVw8uzwrBjrBkeQY', 'Dang Tuan Nguyen', 'dtn939@uowmail.edu.au', 0, NULL, '2025-09-02 20:32:33', '2025-09-02 20:32:33', 'student');


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
('RWvYT0XU0eB5H897TOa5CiaO10Xui17G', 'UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 'credential', 'UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', NULL, NULL, NULL, NULL, NULL, NULL, '6725f0ab1ce173eb90977a40b313ec25:e618059e7033c4d7b79da75267611b958c45a38883ce6ee3b792d5a01b3ab710aa1fcac1a63ad44dca2ed1a9ef1e2d92894e67dd06326a5eed36f2706631e5ed', '2025-08-06 13:02:18', '2025-08-06 13:02:18'),
('nQXBMxJA2J646mjXHSntqmdSE2qal2Kb', 'I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6', 'credential', 'I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6', NULL, NULL, NULL, NULL, NULL, NULL, '21ec3f8681502ab4a9b3b37a59831b8a:1624e4007a06ab2eeb0b02668acc89a6153a31a7d25a7df84a7989043b96563d10db8e953416b746d8bf6b695ed2f50bf1b911fcd2aa18e86b805d9239d66c35', '2025-09-02 22:35:41', '2025-09-02 22:35:41'),
('1HzEx3htF1L5iUkDNUiVOBNCSFffIwg5', 'TicPM3HkVBNntKwJ2p5Nlmq5fBJSLHVY', 'credential', 'TicPM3HkVBNntKwJ2p5Nlmq5fBJSLHVY', NULL, NULL, NULL, NULL, NULL, NULL, '1f32b56ab894761c0f9144a51985e88b:77f4e2199ed16858cc743b208ded96396d57594a06ee1b95577d55554b45307b8866e9530ed5168a9e91f3ebf7694cf5e20606546fed41e913cda6949c8fe93a', '2025-09-02 22:36:38', '2025-09-02 22:36:38'),
('Ar9kTPlpMnYGlRSUnoDK3UNO5sfUjIfu', '4aRIUgAzGqSDOTXgMt4U0LIZujYSaYPi', 'credential', '4aRIUgAzGqSDOTXgMt4U0LIZujYSaYPi', NULL, NULL, NULL, NULL, NULL, NULL, 'ed27e6dc9a8771aa220f3e82cebf769c:51e2d760bca1ca1c090ebf4166698360fc36dfbf122167b7129b59a578a7b6f101f2492c8265801757a4748f86207f524c7167c8b0147b20df34aa8dc6df8ae4', '2025-09-02 22:39:05', '2025-09-02 22:39:05'),
('6PKHvL4KSH2rz4wxTQnAksFGzijbJ2gm', 'wKoHWAzrHuZ9LyDFSYipEpSBUNVoZiz8', 'credential', 'wKoHWAzrHuZ9LyDFSYipEpSBUNVoZiz8', NULL, NULL, NULL, NULL, NULL, NULL, 'c2347a42d5ff4f6f7d303f1b3dd2e8cc:7f7b4e863ffed72ea2154b23bc3a0772cba194087663c3bc74954c10e04aa08a0d41f1c3effdde20e294cbfd37212e59703c04af5dc21e3cc3c60b7e093a5523', '2025-09-02 22:37:24', '2025-09-02 22:37:24'),
('tXyfUrKvlKDsyxxVVt59xEXtnHFOB8MP', 'ZXasbU3XBwpLIAyIEKdPqxFLqbJvwSXl', 'credential', 'ZXasbU3XBwpLIAyIEKdPqxFLqbJvwSXl', NULL, NULL, NULL, NULL, NULL, NULL, '063c4542e5535342eedad65b3e737158:18435aeffc73c90acfab2ffe49655b7094910bcb9e1124ec333a18ead6bf6eb3a36c5b4632ab89d1276d1e45c3d9da6c5d9d1a7f630db1fa7afa6ead43f500d6', '2025-09-02 22:38:05', '2025-09-02 22:38:05'),
('TaFvBXMuLzCOM008uUhZ3iznFtQMyN7l', '7kwyGLjoLq10So1RvbMv9DrftPtdsnme', 'credential', '7kwyGLjoLq10So1RvbMv9DrftPtdsnme', NULL, NULL, NULL, NULL, NULL, NULL, '5537dc75b3d813d6ec735959da6e78d4:69cac34b8fa7fd3a6ae362622e4f754d744d1228f36e3dd823f1b2ac99d9a98ae4cfbb5cf83aa9e219777ebe9d5ccc11e29a4b78dc1870c90b6bb32149f84df3', '2025-09-02 22:39:52', '2025-09-02 22:39:52'),
('EbIwxD9PxYM7BJR9SX1KvSfV3egg6T71', 'HRVe0ah5AzQidmSNNVw8uzwrBjrBkeQY', 'credential', 'HRVe0ah5AzQidmSNNVw8uzwrBjrBkeQY', NULL, NULL, NULL, NULL, NULL, NULL, '5474fdbd3f093616e1892c3e4da4b2ef:cea56780e79844fe00e462b62560f01c4a19eb3d39d0f618f95ffcdbd2c26f862917f3f2cf258c8a0ca1fd4aaf753eae9de6719f5b271184c70a35c3983ab85e', '2025-09-02 22:40:31', '2025-09-02 22:40:31');

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

-- Campus
INSERT INTO campus (id, name) VALUES
(1, 'Wollongong'),
(2, 'Sydney');

-- Rooms
INSERT INTO room (building_number, room_number, description, latitude, longitude, campus_id) VALUES
('17', '101', 'Library', -34.406735319735034, 150.87855122064795, 1),
('20', '102', 'Building 20', -34.405756696459065, 150.8784914211785, 1),
('14', '201', 'Building 14', -34.40637101770338, 150.8801386108864, 1),
('17', '202', 'Building 17', -34.40689043969014, 150.87804938559652, 1),
('2', '103', 'Building 2', -34.40661777021882, 150.88137803896953, 1),
('3', '103', 'Building 3', -34.40599667280061, 150.8823234816749, 1),
('22', '103', 'Building 22', -34.404630436746494, 150.87661222539015, 1),
('40', '103', 'Building 40', -34.4062537916668, 150.87683726956962, 1),
('35', '103', 'Building 35', -34.40582005010667, 150.88081766767468, 1),
('67', '202', 'Building 67', -34.40458820292591, 150.87731246467433, 1);

-- Semesters
INSERT INTO semester (id, name, year) VALUES
(1, 'spring', 2024),
(2, 'autumn', 2025),
(3, 'spring', 2025);

-- Subjects
INSERT INTO subject (id, name, code, semester_id, status) VALUES
(1, 'Project management', 'CSIT883', 1, 'finished'),
(2, 'Database management', 'CSIT882', 2, 'finished'),
(3, 'Research methodology', 'CSIT940', 3, 'active'),
(4, 'Web server programming', 'MTS9307', 3, 'active'),
(5, 'Computer vision algorithms and systems', 'CSCI935', 3, 'active'),
(6, 'Computer vision algorithms and systems', 'CSCI435', 3, 'active'),
(7, 'Data Mining', 'CSCI910', 3, 'active'),
(8, 'Artificial Intelligence', 'CSCI920', 3, 'active'),
(9, 'Cybersecurity Fundamentals', 'CSIT930', 3, 'active'),
(10, 'Cloud Computing', 'CSIT941', 3, 'active'),
(11, 'Machine Learning Applications', 'CSCI950', 3, 'active'),
(12, 'Project capstone', 'CSIT998', 3, 'active');

-- enrollments — 5 students assigned to 5 courses
INSERT INTO enrolment (student_id, subject_id) VALUES
-- student 1, student 2 enrolled subject 1
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 1), ('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 1),
 -- student 3, student 4 enrolled subject 2
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 2), ('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 2),
-- student 5 enrolled subject 3
('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 3),
-- student 1,2,3 enrolled subject 4
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 4), ('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 4),('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp',4),
-- student 3,4,5 enrolled subject 5
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 5), ('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 5), ('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 5),
-- student 1, student 2 enrolled subject 6
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 6), ('zkpUwtQqTxeezHJgkXVtW8n2lyf65AI5', 6),
-- student 1 enrolled subject 7,8,9,10,11
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 7),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 8),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 9),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 10),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 11),
-- JC3DN team members enrolled in CSIT998(id=12) and MTS9307(id=4)
('TicPM3HkVBNntKwJ2p5Nlmq5fBJSLHVY', 4),
('4aRIUgAzGqSDOTXgMt4U0LIZujYSaYPi', 4),
('wKoHWAzrHuZ9LyDFSYipEpSBUNVoZiz8', 4),
('ZXasbU3XBwpLIAyIEKdPqxFLqbJvwSXl', 4),
('7kwyGLjoLq10So1RvbMv9DrftPtdsnme', 4),
('HRVe0ah5AzQidmSNNVw8uzwrBjrBkeQY', 4),
('TicPM3HkVBNntKwJ2p5Nlmq5fBJSLHVY', 12),
('4aRIUgAzGqSDOTXgMt4U0LIZujYSaYPi', 12),
('wKoHWAzrHuZ9LyDFSYipEpSBUNVoZiz8', 12),
('ZXasbU3XBwpLIAyIEKdPqxFLqbJvwSXl', 12),
('7kwyGLjoLq10So1RvbMv9DrftPtdsnme', 12),
('HRVe0ah5AzQidmSNNVw8uzwrBjrBkeQY', 12);

-- Course Sessions (1 lecture + 2 labs each course)
INSERT INTO study_session (id, type, day_of_week, start_time, end_time, room_id) VALUES
-- CSIT883
(1, 'lecture', 'Monday', '09:00:00', '11:00:00', 1),
(2, 'tutorial', 'Wednesday', '13:00:00', '15:00:00', 2),
(3, 'tutorial', 'Friday', '10:00:00', '12:00:00', 3),
-- CSIT882
(4, 'lecture', 'Tuesday', '08:00:00', '10:00:00', 4),
(5, 'tutorial', 'Thursday', '14:00:00', '16:00:00', 5),
(6, 'tutorial', 'Friday', '12:00:00', '14:00:00', 6),
-- CSIT940
(7, 'lecture', 'Wednesday', '11:00:00', '13:00:00', 7),
(8, 'tutorial', 'Thursday', '10:00:00', '12:00:00', 8),
(9, 'tutorial', 'Friday', '14:00:00', '16:00:00', 9),
-- MTS9307
(10, 'lecture', 'Wednesday', '13:00:00', '15:00:00', 10),
(11, 'tutorial', 'Friday', '13:00:00', '15:00:00', 1),
(12, 'tutorial', 'Thursday', '08:00:00', '10:00:00', 2),
-- CSCI935, CSCI435
(13, 'lecture', 'Friday', '09:00:00', '11:00:00', 3),
(14, 'tutorial', 'Wednesday', '15:00:00', '17:00:00', 4),
(15, 'tutorial', 'Thursday', '16:00:00', '18:00:00', 5),
-- Data Mining
(16, 'lecture', 'Monday', '09:00:00', '11:00:00', 6),
(17, 'tutorial', 'Wednesday', '13:00:00', '15:00:00', 7),
-- Artificial Intelligence
(18, 'lecture', 'Tuesday', '10:00:00', '12:00:00', 8),
(19, 'tutorial', 'Thursday', '14:00:00', '16:00:00', 9),
-- Cybersecurity Fundamentals
(20, 'lecture', 'Wednesday', '09:00:00', '11:00:00', 10),
(21, 'tutorial', 'Friday', '11:00:00', '13:00:00', 1),
-- Cloud Computing
(22, 'lecture', 'Thursday', '09:00:00', '11:00:00', 2),
(23, 'tutorial', 'Monday', '14:00:00', '16:00:00', 3),
-- Machine Learning Applications
(24, 'lecture', 'Friday', '09:00:00', '11:00:00', 4),
(25, 'tutorial', 'Tuesday', '15:00:00', '17:00:00', 5),
(26, 'lecture', 'Thursday', '13:30:00', '15:30:00', 6),
(27, 'tutorial', 'Wednesday', '13:30:00', '15:30:00', 7),
(28, 'lecture', 'Thursday', '13:30:00', '15:30:00', 8),
(29, 'lecture', 'Thursday', '13:30:00', '15:30:00', 9);


-- Subject-StudySession
INSERT INTO subject_study_session (subject_id, study_session_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 4), (2, 5), (2, 6),
(3, 7), (3, 8), (3, 9),
(4, 10), (4, 11), (4, 12),
(5, 13), (5, 14), (5, 15),
(6, 13), (6, 14), (6, 15),
(7, 16), (7, 17),
(8, 18), (8, 19),
(9, 20), (9, 21),
(10, 22), (10, 23),
(11, 24), (11, 25),
(12, 26);

-- Student-StudySession
INSERT INTO student_study_session (student_id, study_session_id) VALUES
-- Students 3 and 4 enrolled in CSCI935 tutorial on Wednesday session
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 14),
('xSaq6zsZubsuIpDWzyDGGi39Q1q3iiv5', 14),
-- Student 5 enrolled in CSCI935 tutorial on Thursday session
('w72ehe9ERt9ezeQNLT1Bf3HOoJNbpCsx', 15),
-- Student 1 enrolled into tutorials
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 15),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 17),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 19),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 21),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 23),
('MPuBeIdXwIoPhceUBtKLFEiFxoAzE3dd', 25);

-- Lectuer study session
INSERT INTO lecturer_study_session (study_session_id, lecturer_id) VALUES
-- lec1 
(10, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
-- lec2 and khoa teaches study session 11
(11, 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41'), (11, 'I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6'),
-- lec3
(13, 'QNZ4aS743Pn4hUsd0dskFnnAUQ3JIxaw'),
-- lec1 teaches study sesion 14-25
(14, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(15, 'Pl3aUloS8SowYGhvBTnUH2nocxPPXE41'),
(16, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(17, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(18, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(19, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(20, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(21, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(22, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(23, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(24, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
(25, 'hrEpeIa27ITirYij0FJRAYgbMledKcuw'),
-- khoa teaches study session 26 and 4
(26, 'I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6'), (10, 'I9vweFqQtLTzP7UqemwUlwWIuOYs3hJ6');

-- QR Codes 
INSERT INTO qr_code (id) VALUES
(1),
(2),
(3);

-- Validity records for qr codes
INSERT INTO validity (id, qr_code_id, count) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);
-- QR Code - Study Session mapping
-- CSCI935 week 1 lucture, tutorial
INSERT INTO qr_code_study_session (id, study_session_id, qr_code_id,week_number) VALUES
(1, 13, 1, 1),
(2, 14, 2, 1),
(3, 15, 3, 1);

-- Checkin records for students
-- Student 3 checked in to CSCI935 tutorial week 1 on Wednesday on the first attendance checkin
-- qr_code_study_session_id = 2=> qr_code_id=2 => validity_id=2 for the first checkin window with count=1
INSERT INTO checkin (student_id, qr_code_study_session_id, validity_id) VALUES
('UbM08mzzakyMBZFaQ46MB4ocQpd0gNUp', 2, 2);

