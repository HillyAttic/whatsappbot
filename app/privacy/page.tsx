export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This Privacy Policy describes how we collect, use, and protect your personal information when you use our WhatsApp chatbot service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Phone number and WhatsApp profile information</li>
              <li>Messages and interactions with our chatbot</li>
              <li>Documents and files you share with us</li>
              <li>Usage data and interaction patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our chatbot services</li>
              <li>Process and manage document submissions</li>
              <li>Communicate with you about your requests</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Storage and Security</h2>
            <p>
              We store your data securely using industry-standard encryption and security practices. 
              Your documents are stored in secure cloud storage with access controls and encryption at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sharing</h2>
            <p className="mb-2">We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who help us operate our platform</li>
              <li>Legal authorities when required by law</li>
              <li>Third parties with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services 
              and comply with legal obligations. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us through our WhatsApp chatbot or email us at [email].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
