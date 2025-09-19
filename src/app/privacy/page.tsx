
export default function Page() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="italic mb-6"><em>Effective 17th September 2025</em></p>

      <p>
        AttendEase (“we”) remains committed to protecting user privacy. 
        This document explains how information is collected, stored, and transmitted, 
        and how it is safeguarded.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Information We Collect</h2>
      <ul>
        <li>
          <strong>Personal information:</strong> usernames, names, emails, account type, enrolled classes, taught classes
        </li>
        <li>
          <strong>Usage information:</strong> check-in records, time, class attendance, methods of check-in, location of check-in
        </li>
        <li>
          <strong>GPS Location:</strong> GPS location at the time of check-ins
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-3">How We Use the Information</h2>
      <p>
        Personal information is used to create and manage user accounts, provide user authentication, 
        and assign them to the appropriate classes. It is also used to link user activity to that of students 
        for reporting and communication purposes.
      </p>
      <br></br>
      <p>
        Usage information is used to confirm attendance and generate analytics and reports. 
        It also forms the basis of automated notifications and email reminders.
      </p>
      <br></br>
      <p>
        GPS location is used at the time of check-in to verify the location of students 
        and ensure they are at the purported venue.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Sharing of Information</h2>
      <p>
        Names and usage information relevant to specific subjects are made available to lecturers 
        of enrolled subjects in the form of check-in history and analytics. 
        Data is not shared with any other third parties, except as required by law.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Data Storage</h2>
      <p>
        Personal information and usage information are stored within the system database. 
        While GPS data is used by the system, it is not stored. 
        Other information is retained only for as long as it is required 
        to deliver the relevant service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Children’s Privacy</h2>
      <p>
        Children under the age of 13 are prohibited from using this platform. 
        Any accounts or information found to belong to a child under the age of 13 
        will be deleted.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-3">Changes to Policy</h2>
      <p>
        This policy may be updated at any time without notification. 
        Updates will be indicated by changes in the date at the top of this document. 
        Significant changes will be communicated to users via email.
      </p>
    </div>
  );
}
