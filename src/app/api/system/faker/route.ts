import { auth } from "@/lib/server/auth";
import { getAnchorForStudySession } from "@/lib/server/db_service/validity_window";
import { STUDENTS } from "@/lib/server/faker";
import {
  CAMPUSES,
  ROOMS,
  SEMESTEERS,
  SUBJECTS,
  STUDY_SESSIONS,
  SUBJECT_STUDY_SESSIONS,
  LECTURERS,
} from "@/lib/server/faker/fix-data";
import { rawQuery } from "@/lib/server/query";
import { computeQrDateForWeek, DayOfWeek, parseTimeToDate } from "@/lib/utils";
import { faker } from "@faker-js/faker";
import { NextResponse } from "next/server";

/**
 * @openapi
 * /api/system/faker:
 *   post:
 *     tags:
 *       - System
 *     summary: Generate dummy users with Faker
 *     description: >
 *       Seeds the database with a batch of fake users.
 *       Each user is created through the existing `auth.api.signUpEmail` flow.
 *       Email format follows the pattern:
 *       **first-initial + last-initial + random number @uowmail.edu.au**
 *       Example: John Smith → `js123@uowmail.edu.au`.
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Faker seeding completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Faker seeding complete
 */

function shiftTimeByMinutes(
  timeStr: string,
  minShift = -30,
  maxShift = 30
): string {
  // parse "HH:MM"
  const [hh, mm] = timeStr.split(":").map(Number);
  const baseDate = new Date();
  baseDate.setHours(hh, mm, 0, 0);

  // pick random shift in minutes
  const shift = faker.number.int({ min: minShift, max: maxShift });
  baseDate.setMinutes(baseDate.getMinutes() + shift);

  // format back to "HH:MM"
  const newH = baseDate.getHours().toString().padStart(2, "0");
  const newM = baseDate.getMinutes().toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

export async function POST() {
  //1. Create prefixed campuses, rooms, semesters, subjects
  //1.1 create campuses
  console.log("Creating campuses...");
  for (const campus of CAMPUSES) {
    const createCampusSql = `
        INSERT INTO campus (id, name) 
        VALUES (?, ?)`;
    try {
      await rawQuery(createCampusSql, [campus.id, campus.name]);
    } catch (e) {
      console.error("Create campuses error", e);
    }
  }
  //1.2 creat rooms
  console.log("Creating rooms...");
  for (const room of ROOMS) {
    const createRoomSql = `
        INSERT INTO room (id, building_number, room_number, description, latitude, longitude, campus_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    try {
      await rawQuery(createRoomSql, [
        room.id,
        room.building_number,
        room.room_number,
        room.description,
        room.latitude,
        room.longitude,
        room.campus_id,
      ]);
    } catch (e) {
      console.error("Create rooms error", e);
    }
  }
  //1.3 create semesters
  console.log("Creating semesters...");
  for (const semester of SEMESTEERS) {
    const createSemesterSql = `
    INSERT INTO semester (id, name, year) 
    VALUES (?, ?, ?)`;
    try {
      await rawQuery(createSemesterSql, [
        semester.id,
        semester.name,
        semester.year,
      ]);
    } catch (e) {
      console.error("Create semesters error", e);
    }
  }
  //1.4 create subjects
  console.log("Creating subjects...");
  for (const subject of SUBJECTS) {
    const createSubjectsSql = `
    INSERT INTO subject (id, name, code, semester_id, status) 
    VALUES (?, ?, ?, ?, ?)`;
    try {
      await rawQuery(createSubjectsSql, [
        subject.id,
        subject.name,
        subject.code,
        subject.semester_id,
        subject.status,
      ]);
    } catch (e) {
      console.error("Create subjects error", e);
    }
  }

  //1.5 create study sessions
  console.log("Creating study sessions...");
  for (const study_session of STUDY_SESSIONS) {
    const createStudySessionsSql = `
    INSERT INTO study_session (id, type, day_of_week, start_time, end_time, room_id) 
    VALUES(?, ?, ?, ?, ?, ?)`;
    try {
      await rawQuery(createStudySessionsSql, [
        study_session.id,
        study_session.type,
        study_session.day_of_week,
        study_session.start_time,
        study_session.end_time,
        study_session.room_id,
      ]);
    } catch (e) {
      console.error("Create study sessions error", e);
    }
  }

  // 1.6 link subjects to study sessions
  console.log("Linking subjects to study sessions...");
  for (const ss of SUBJECT_STUDY_SESSIONS) {
    const createSubjectStudySessionsSql = `
      INSERT INTO subject_study_session (subject_id, study_session_id) 
      VALUES(?, ?)`;
    try {
      await rawQuery(createSubjectStudySessionsSql, [
        ss.subject_id,
        ss.study_session_id,
      ]);
    } catch (e) {
      console.error("Create subject-study_session link error", e);
    }
  }

  //1.7 create a default lecturer and assign to all subjects
  console.log("Creating default lecturers and assign to all subjects...");
  for (const lecturer of LECTURERS) {
    try {
      const response = await auth.api.signUpEmail({
        body: {
          name: lecturer.name,
          email: lecturer.email,
          password: lecturer.password,
          role: lecturer.role,
        },
      });
      const lecID = response.user.id;
      // assign lecturer to all subjects (study sessions) id=1..29
      for (const ss of STUDY_SESSIONS) {
        const assignLecturerSql = `
          INSERT INTO lecturer_study_session (study_session_id, lecturer_id)
          VALUES(?, ?)`;
        try {
          await rawQuery(assignLecturerSql, [ss.id, lecID]);
        } catch (e) {
          console.error("Assign lecturer to study session error", e);
        }
      }
    } catch (e) {
      console.error("Create default lecturer error", e);
    }
  }
  //1.8. create students and and assign to subjects and tutorials
  console.log("Creating users");
  for (const [index, student] of STUDENTS.entries()) {
    try {
      // creating user number
      console.log("User ", index + 1, " of " + STUDENTS.length);
      // 2.1. create user via existing sign-up flow
      const response = await auth.api.signUpEmail({
        body: {
          name: student.name,
          email: student.email,
          password: student.password,
          role: student.role,
        },
      });
      const userID = response.user.id;
      // 2.2 Students enroll into subjects (automatically join lecture) and tutorials
      // randomly enroll each student into 12 subjects
      const subjectIds = [...Array(12).keys()].map(i => i + 1); // [1,2,3,...12]
      for (const subjectId of subjectIds) {
        const isJoinSubject = Math.random() < 0.85; // 85% chance to join each subject
        if (isJoinSubject) {
          // enroll student into subject
          const enrollSubjectSql = `
            INSERT INTO enrolment (student_id, subject_id)
            VALUES (?, ?)`;
          try {
            await rawQuery(enrollSubjectSql, [userID, subjectId]);
          } catch (e) {
            console.error("Enroll subject error", e);
          }
          // enrol student into study tutorial session randomly
          // find tutorial study session id for the subject
          const tutorialStudySessionIds = SUBJECT_STUDY_SESSIONS.filter(
            ss => ss.subject_id === subjectId
          )
            .map(ss => ss.study_session_id)
            .filter(id =>
              STUDY_SESSIONS.find(s => s.id === id && s.type === "tutorial")
            );

          const pick = (xs: number[]) =>
            xs[Math.floor(Math.random() * xs.length)];

          const rndTutSSId = pick(tutorialStudySessionIds);
          //   console.log('subectId', subjectId, 'tutorialStudySessionIds', tutorialStudySessionIds, 'rndTutSSId', rndTutSSId);
          // student joins the tutorial session randomly
          try {
            const studentStudySessionSql = `
                INSERT INTO student_study_session (student_id, study_session_id)
                VALUES (?, ?)`;
            await rawQuery(studentStudySessionSql, [userID, rndTutSSId]);
          } catch (e) {
            console.error("Enroll tutorial study session error", e);
          }
        }
      }
    } catch (e) {
      console.error("Create dummy students error", e);
    }
  }
  //1.9. Create QR codes for all study sessions from week 1 to week 9 and checkin students
  console.log("Creating QR code and check-in students");
  const weekNumbers = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  for (const [index, ss] of STUDY_SESSIONS.entries()) {
    console.log("Study Session", index + 1, "of", STUDY_SESSIONS.length);
    let vwIds = [] as number[]; // validity window ids
    let qrcode_ssid = null as number | null; // qr_code_study_session id
    let first_vw_start = null as Date | null;
    let first_vw_end = null as Date | null;
    let second_vw_start = null as Date | null;
    let second_vw_end = null as Date | null;
    for (const weekNo of weekNumbers) {
      // create QR code
      const insertQrSql = `
      INSERT INTO qr_code ( valid_radius, validate_geo, valid_room_id)
      VALUES (?, ?, ?)
    `;
      const radius = faker.number.int({ min: 100, max: 1000 });
      const validateGeoFlag = faker.number.int({ min: 0, max: 1 }); // 0 or 1
      const valid_room_id = faker.number.int({ min: 1, max: 10 });
      const qrResult: any = await rawQuery(insertQrSql, [
        radius,
        validateGeoFlag,
        valid_room_id,
      ]);
      const qrCodeId = qrResult.insertId as number;
      // create validity for the qr code
      const anchor = await getAnchorForStudySession(ss.id);
      const sessionDate = computeQrDateForWeek(
        ss.day_of_week as DayOfWeek,
        weekNo,
        anchor
      );
      const validityWindows = [1, 2];
      for (const vw of validityWindows) {
        const anchorTime = vw === 1 ? ss.start_time : ss.end_time;
        // randomly shift anchor time by -30 to +30 minutes
        const shifted = parseTimeToDate(
          sessionDate,
          shiftTimeByMinutes(anchorTime, -30, 30)
        );
        const durationMin = 10 + Math.floor(Math.random() * 31); // 10–40 minutes
        const start = shifted;
        const end = new Date(start.getTime() + durationMin * 60_000);

        if (vw === 1) {
          first_vw_start = start;
          first_vw_end = end;
        } else {
          second_vw_start = start;
          second_vw_end = end;
        }
        try {
          const insertValiditySql = `
          INSERT INTO validity (qr_code_id, count, start_time, end_time)
          VALUES (?, ?, ?, ?)
          `;
          const vdResult: any = await rawQuery(insertValiditySql, [
            qrCodeId,
            vw,
            start,
            end,
          ]);
          const validityId = vdResult.insertId as number;
          vwIds.push(validityId); // first window id is index 0, second window id is index 1
        } catch (e) {
          console.error("Insert validity error", e);
        }
      }
      // insert into qr_code_study_session

      try {
        const insertMapSql = `
          INSERT INTO qr_code_study_session (study_session_id, qr_code_id, week_number)
          VALUES (?, ?, ?)
          `;
        const qrcode_ss_result: any = await rawQuery(insertMapSql, [
          ss.id,
          qrCodeId,
          weekNo,
        ]);
        qrcode_ssid = qrcode_ss_result.insertId as number;
      } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") {
          return NextResponse.json(
            { message: "QR code already exists for this session and week." },
            { status: 409 }
          );
        }
        throw err;
      }
      // create check-in entries for all students in this study session for this week
      //query all students in this study session
      const queryStudentsSql = `
      SELECT ss.student_id
      FROM student_study_session ss
      WHERE ss.study_session_id = ?`;
      const ss_students = await rawQuery<{ student_id: string }>(
        queryStudentsSql,
        [ss.id]
      );
      // checkin students
      for (const s of ss_students) {
        const studentId = s.student_id;
        // 75%-95% chance the student checks in
        const isCheckIn = Math.random() < 0.75 + Math.random() * 0.2;
        if (isCheckIn) {
          // only allow In-person or manually checkin
          let checkinType = null as null | "In-person" | "Online" | "Manual";
          // Determine check-in type based on validateGeoFlag.
          // If geo validation is enabled (true):
          //   - "In-person" is chosen with 75–90% probability
          //   - "Manual" is chosen with 10–15% probability
          //   - "Online" is not allowed (0%)
          // If geo validation is disabled (false):
          //   - "Online" is chosen with 80–90% probability
          //   - "Manual" is chosen with 5–10% probability
          //   - "In-person" is not allowed (0%)
          if (validateGeoFlag) {
            // Geo validation ON
            const p = 0.75 + Math.random() * 0.15; // 75–90%
            const q = 0.1 + Math.random() * 0.05; // 10–15%
            const r = 1 - (p + q); // adjust remainder (Online = 0%)
            const roll = Math.random();

            if (roll < p) checkinType = "In-person";
            else if (roll < p + r)
              checkinType = "Online"; // effectively 0%
            else checkinType = "Manual";
          } else {
            // Geo validation OFF
            const p = 0.8 + Math.random() * 0.1; // 80–90%
            const q = 0.05 + Math.random() * 0.05; // 5–10%
            const r = 1 - (p + q); // In-person = 0%
            const roll = Math.random();

            if (roll < p) checkinType = "Online";
            else if (roll < p + r)
              checkinType = "In-person"; // effectively 0%
            else checkinType = "Manual";
          }
          // decide which validity windows to check into
          const roll = Math.random();
          const targetIdxs = roll < 0.8 ? [0, 1] : roll < 0.9 ? [0] : [1];

          for (const idx of targetIdxs) {
            const vw_id = vwIds[idx];

            let randomCheckinTime = null as null | Date;
            // first vw
            if (idx === 0) {
              randomCheckinTime = faker.date.between({
                from: first_vw_start,
                to: first_vw_end,
              });
            }
            // second vw
            else {
              randomCheckinTime = faker.date.between({
                from: second_vw_start,
                to: second_vw_end,
              });
            }
            await rawQuery(
              `
                INSERT INTO checkin
                (student_id, qr_code_study_session_id, validity_id, checkin_time,checkin_type)
                VALUES (?, ?, ?, ?, ?)
              `,
              [studentId, qrcode_ssid, vw_id, randomCheckinTime, checkinType]
            );
          }
        }
      }
    }
  }

  return NextResponse.json({
    message: "Faker seeding complete",
  });
}
