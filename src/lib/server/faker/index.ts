import { faker } from "@faker-js/faker";
import { JDC3DN_STUDENTS } from "./fix-data";

// faker.seed(42);
function createFakeUser() {
  const fullName = faker.person.fullName();
  const parts = fullName.split(" ");
  const firstName = parts[0];
  const lastName = parts.slice(1).join("").toLowerCase();

  const email =
    firstName[0].toLowerCase() +
    lastName[0].toLowerCase() +
    faker.number.int({ min: 1, max: 999 }) +
    "@uowmail.edu.au";

  const password = "Abcd@1234";

  const student = { name: fullName, email, password, role: "student" as const };
  return student;
}

const dummpyStudents = Array.from({ length: 150 }, () => createFakeUser());
export const STUDENTS = dummpyStudents.concat(JDC3DN_STUDENTS);
