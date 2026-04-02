export default function DeleteData() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Deletion Instructions</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <p className="text-lg mb-4">
              We respect your privacy and your right to control your personal data. 
              If you wish to delete your data from our WhatsApp chatbot service, please follow the instructions below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What Data Will Be Deleted</h2>
            <p className="mb-2">When you request data deletion, we will remove:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your phone number and WhatsApp profile information</li>
              <li>All messages and conversation history</li>
              <li>Documents and files you have submitted</li>
              <li>Any personal information associated with your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request Data Deletion</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-blue-900 mb-2">Option 1: Via WhatsApp</p>
              <p className="text-blue-800">
                Send a message to our WhatsApp chatbot with the text: <span className="font-mono bg-white px-2 py-1 rounded">"Delete my data"</span> or <span className="font-mono bg-white px-2 py-1 rounded">"Remove my information"</span>
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-2">Option 2: Via Email</p>
              <p className="text-green-800">
                Send an email to <span className="font-mono bg-white px-2 py-1 rounded">[email]</span> with the subject "Data Deletion Request" 
                and include your WhatsApp phone number in the message.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Processing Time</h2>
            <p>
              We will process your data deletion request within 30 days. You will receive a confirmation 
              once your data has been successfully deleted from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention Exceptions</h2>
            <p className="mb-2">
              Please note that we may retain certain information if required by law or for legitimate business purposes, such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Legal compliance and regulatory requirements</li>
              <li>Fraud prevention and security purposes</li>
              <li>Resolving disputes or enforcing agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Questions?</h2>
            <p>
              If you have any questions about data deletion or need assistance, please contact us 
              through our WhatsApp chatbot or email us at <span className="font-mono bg-gray-100 px-2 py-1 rounded">[email]</span>
            </p>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              For more information about how we handle your data, please review our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
