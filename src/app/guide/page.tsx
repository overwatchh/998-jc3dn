export default function Page() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-gray-800">
      <h1 className="mb-6 text-4xl font-bold">How to Use</h1>

      <h2 className="mt-8 mb-3 text-2xl font-semibold">Student</h2>
      <h3 className="mt-6 mb-2 text-xl font-semibold">Check-in</h3>
      <p>
        Confirming attendance is a simple process whether attending in-person or
        online:
      </p>

      <h4 className="mt-4 mb-2 text-lg font-semibold">In-Person</h4>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Scan QR code when prompted by lecturer</li>
        <li>Sign in with account (if not already signed in)</li>
        <li>Approve permission to access ‘location data’</li>
        <li>Follow prompts to confirm attendance and submit</li>
        <li>
          If prompted for a second sign in by lecturer, rescan QR code (or
          refresh confirmation page) and follow steps 2–4 for second round
        </li>
      </ol>

      <h4 className="mt-4 mb-2 text-lg font-semibold">Online</h4>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Scan QR code when prompted by lecturer</li>
        <li>Sign in with account (if not already signed in)</li>
        <li>Approve permission to access ‘location data’</li>
        <li>Follow prompts to confirm attendance</li>
        <li>
          When prompted about location discrepancy, click button to set online
          attendance
        </li>
        <li>Submit attendance</li>
        <li>
          If prompted for a second sign in by lecturer, rescan QR code (or
          refresh confirmation page) and follow steps 2-4 for second round
        </li>
      </ol>

      <h3 className="mt-6 mb-2 text-xl font-semibold">Viewing Statistics</h3>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Sign in with account (if not already signed in)</li>
        <li>Select ‘Records’ on bottom of screen</li>
        <li>Select from the tabs on screen to choose statistic type</li>
      </ol>

      <h2 className="mt-8 mb-3 text-2xl font-semibold">Lecturer</h2>
      <h3 className="mt-6 mb-2 text-xl font-semibold">Creating QR Codes</h3>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Sign in with account (if not already signed in)</li>
        <li>Click on the ‘QR’ tab on the bottom of the screen</li>
        <li>Select the class for which you wish to create a QR code</li>
        <li>
          Select the week you wish to create a QR code for in the right-hand
          side dropdown menu
        </li>
        <li>Fill in all fields in the form</li>
        <li>Click ‘Generate QR’</li>
      </ol>

      <h3 className="mt-6 mb-2 text-xl font-semibold">
        Viewing Student Statistics
      </h3>
      <ol className="list-decimal space-y-1 pl-6">
        <li>Sign in with account (if not already signed in)</li>
        <li>Click the ‘Home’ tab on the bottom of the screen</li>
        <li>
          Select the class for which you wish to see statistics in the drop-down
          menu on the right-hand of the screen
        </li>
      </ol>
    </div>
  );
}
