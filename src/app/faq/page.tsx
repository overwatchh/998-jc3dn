export default function Page() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-gray-800">
      <h1 className="mb-6 text-4xl font-bold">FAQ</h1>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">What is AttendEase?</h2>
      <p>
        AttendEase is a platform that allows student to confirm their attendance
        in lectures and classes by scanning a QR code. AttendEase also provides
        advanced tracking tools to allow students and lecturers alike to better
        track their attendance.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        How do I confirm my attendance?
      </h2>
      <p>
        Students can simply scan the QR code when prompted by their lecturer,
        then follow the on-screen prompts to confirm their attendance.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        How do I add classes (Student)?
      </h2>
      <p>
        At this time, students are unable to add or enrol themselves in classes.
        Student enrolment is provided by institutions, and students are
        automatically enrolled based on this data.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        How do I access my past attendance?
      </h2>
      <p>
        Students can log in with their account details to access their
        dashboard. This dashboard gives access to information about the classes
        enrolled, as well as statistics for each class and overall attendance.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        How can I determine if I have sufficient attendance?
      </h2>
      <p>
        Students can check their account dashboard to check their attendance
        rates at any time. The minimum attendance thresholds for enrolled
        classes can also be accessed via this dashboard. Students are also
        notified if their attendance drops below minimum attendance, and on
        their first missed session for each class.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        Why does AttendEase request GPS location data?
      </h2>
      <p>
        AttendEase utilises student GPS data to determine whether students are
        attending in person. Student GPS data can be cross-referenced with the
        location data of the venue for the event to determine whether students
        are attending in-person or viewing the lecture online.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        How is GPS data used?
      </h2>
      <p>
        GPS data is used by AttendEase to verify whether students are in the
        correct location, which is a requirement for in-person attendance for
        some event types (based on lecturer settings). This GPS data is only
        used to verify location at the time of attendance confirmation, and is
        not stored.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        What if I can’t scan the code?
      </h2>
      <p>
        If you are unable to scan the QR code for some reason, such as a lack of
        device access or technical issues, your lecturer can manually confirm
        your attendance. Ask your lecturer about whether they are able to sign
        you in manually, or if there is another way you can confirm your
        attendance.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        Can I check in after class?
      </h2>
      <p>
        Students are not able to check in after their class. Each lecture
        instance and its associated QR codes are time sensitive, based on the
        times entered by the lecturer at the time of creation. As a result, the
        check in page will be unavailable outside of these times.
      </p>
      <h2 className="mt-8 mb-3 text-2xl font-semibold">
        What if I forget to check in?
      </h2>
      <p>
        If you forget to check in, you will be unable to scan the QR code at a
        later date to confirm your attendance. Please contact your lecturer so
        that they can manually add your attendance.
      </p>
    </div>
  );
}
