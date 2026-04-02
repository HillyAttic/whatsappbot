export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <p className="text-sm text-gray-500 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              By using our WhatsApp chatbot service, you agree to these Terms of Service. 
              Please read them carefully before using our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p>
              By accessing or using our service, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, 
              you are prohibited from using our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Service Description</h2>
            <p>
              Our service provides an automated WhatsApp chatbot that helps you submit and manage documents. 
              We reserve the right to modify, suspend, or discontinue any part of the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Responsibilities</h2>
            <p className="mb-2">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to interfere with or disrupt the service</li>
              <li>Not upload malicious files or content</li>
              <li>Respect intellectual property rights</li>
              <li>Maintain the confidentiality of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Document Submission</h2>
            <p>
              When you submit documents through our service, you represent that you have the right 
              to share those documents and that they do not violate any laws or third-party rights. 
              We are not responsible for the content of documents you submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are owned by us 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
            <p>
              We provide the service "as is" without warranties of any kind. We shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages resulting from 
              your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Termination</h2>
            <p>
              We may terminate or suspend your access to the service immediately, without prior notice, 
              for any reason, including breach of these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes. Your continued use of the service after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              our WhatsApp chatbot or email us at [email].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
