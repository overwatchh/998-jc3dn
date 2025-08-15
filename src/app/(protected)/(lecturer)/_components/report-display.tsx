import React from 'react';

// Define interfaces for the data structure
interface OverallStats {
  totalStudents?: number;
  totalCourses?: number;
  totalLectures?: number;
  averageAttendanceRate?: number;
  attendanceRate?: number; // Added for student report type
}

interface StudentStat {
  name: string;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

interface LectureStat {
  title: string;
  date: string; // Assuming date is a string, adjust if it's a Date object
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

interface CourseInfo {
  name: string;
  code: string;
}

interface CourseAggregateStat {
  totalLectures: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

interface CourseStat {
  course: CourseInfo;
  stats: CourseAggregateStat;
}

interface ReportData {
  overallStats?: OverallStats;
  studentStats?: StudentStat[];
  lectureStats?: LectureStat[];
  courseStats?: CourseStat[];
}

interface ReportDisplayProps {
  title: string;
  data: ReportData | null | undefined; // Use the defined interface
  type: 'course' | 'student';
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ title, data, type }) => {
  if (!data) {
    return <div className="p-4">Loading report data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      {/* Overall Stats */}
      <div className="mb-8 bg-slate-50 p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-3">Overall Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-slate-500">Total {type === 'course' ? 'Students' : 'Courses'}</p>
            <p className="text-2xl font-bold">
              {type === 'course' 
                ? data.overallStats?.totalStudents || 0
                : data.overallStats?.totalCourses || 0}
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-slate-500">Total Lectures</p>
            <p className="text-2xl font-bold">{data.overallStats?.totalLectures || 0}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-sm text-slate-500">Average Attendance</p>
            <p className="text-2xl font-bold">
              {data.overallStats?.averageAttendanceRate?.toFixed(1) || 
               data.overallStats?.attendanceRate?.toFixed(1) || 
               '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      {type === 'course' && (
        <>
          {/* Student Stats Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Student Attendance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-center">Present</th>
                    <th className="py-2 px-4 text-center">Late</th>
                    <th className="py-2 px-4 text-center">Absent</th>
                    <th className="py-2 px-4 text-center">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentStats?.map((student: StudentStat, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-4">{student.name}</td>
                      <td className="py-2 px-4 text-center">{student.present}</td>
                      <td className="py-2 px-4 text-center">{student.late}</td>
                      <td className="py-2 px-4 text-center">{student.absent}</td>
                      <td className="py-2 px-4 text-center">{student.attendanceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lecture Stats Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Lecture Attendance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Lecture</th>
                    <th className="py-2 px-4 text-center">Date</th>
                    <th className="py-2 px-4 text-center">Present</th>
                    <th className="py-2 px-4 text-center">Late</th>
                    <th className="py-2 px-4 text-center">Absent</th>
                    <th className="py-2 px-4 text-center">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lectureStats?.map((lecture: LectureStat, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="py-2 px-4">{lecture.title}</td>
                      <td className="py-2 px-4 text-center">
                        {new Date(lecture.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 text-center">{lecture.present}</td>
                      <td className="py-2 px-4 text-center">{lecture.late}</td>
                      <td className="py-2 px-4 text-center">{lecture.absent}</td>
                      <td className="py-2 px-4 text-center">{lecture.attendanceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {type === 'student' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Course Attendance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-2 px-4 text-left">Course</th>
                  <th className="py-2 px-4 text-center">Total Lectures</th>
                  <th className="py-2 px-4 text-center">Present</th>
                  <th className="py-2 px-4 text-center">Late</th>
                  <th className="py-2 px-4 text-center">Absent</th>
                  <th className="py-2 px-4 text-center">Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.courseStats?.map((course: CourseStat, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-2 px-4">{course.course.name} ({course.course.code})</td>
                    <td className="py-2 px-4 text-center">{course.stats.totalLectures}</td>
                    <td className="py-2 px-4 text-center">{course.stats.present}</td>
                    <td className="py-2 px-4 text-center">{course.stats.late}</td>
                    <td className="py-2 px-4 text-center">{course.stats.absent}</td>
                    <td className="py-2 px-4 text-center">{course.stats.attendanceRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;
