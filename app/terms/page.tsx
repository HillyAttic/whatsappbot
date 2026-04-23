import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | JPCO WhatsApp Bot',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <div className="fixed top-0 right-20 w-56 h-56 bg-teal/5 rotate-45 pointer-events-none" />
      <div className="fixed bottom-20 left-0 w-80 h-80 bg-accent/5 -rotate-12 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-accent" />
            <span className="eyebrow">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink tracking-tight leading-none mb-3">
            Terms of <span className="text-accent">Service</span>
          </h1>
          <p className="text-sm text-ink-muted font-mono">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="bg-white border-2 border-ink/8 shadow-card p-8 md:p-10 space-y-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <section>
            <p className="text-ink-secondary leading-relaxed">
              By using our WhatsApp chatbot service, you agree to these Terms of Service.
              Please read them carefully before using our services.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-accent" />
              <h2 className="text-xl font-display font-bold text-ink">Acceptance of Terms</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              By accessing or using our service, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using our service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-teal" />
              <h2 className="text-xl font-display font-bold text-ink">Service Description</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Our service provides an automated WhatsApp chatbot that helps you submit and manage documents.
              We reserve the right to modify, suspend, or discontinue any part of the service at any time.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#d9480f]" />
              <h2 className="text-xl font-display font-bold text-ink">User Responsibilities</h2>
            </div>
            <p className="text-ink-secondary mb-3">You agree to:</p>
            <div className="space-y-2">
              {[
                'Provide accurate and complete information',
                'Use the service only for lawful purposes',
                'Not attempt to interfere with or disrupt the service',
                'Not upload malicious files or content',
                'Respect intellectual property rights',
                'Maintain the confidentiality of your account',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 pl-3 py-1.5 border-l-2 border-[#d9480f]/30">
                  <span className="text-[#d9480f] font-bold text-sm leading-none mt-0.5">&#8226;</span>
                  <span className="text-sm text-ink-secondary">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#0c8599]" />
              <h2 className="text-xl font-display font-bold text-ink">Document Submission</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              When you submit documents through our service, you represent that you have the right
              to share those documents and that they do not violate any laws or third-party rights.
              We are not responsible for the content of documents you submit.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-accent" />
              <h2 className="text-xl font-display font-bold text-ink">Intellectual Property</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              The service and its original content, features, and functionality are owned by us
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-danger" />
              <h2 className="text-xl font-display font-bold text-ink">Limitation of Liability</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              We provide the service "as is" without warranties of any kind. We shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages resulting from
              your use of or inability to use the service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#7048e8]" />
              <h2 className="text-xl font-display font-bold text-ink">Termination</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              We may terminate or suspend your access to the service immediately, without prior notice,
              for any reason, including breach of these Terms of Service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#2b8a3e]" />
              <h2 className="text-xl font-display font-bold text-ink">Changes to Terms</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes. Your continued use of the service after changes constitutes acceptance
              of the new terms.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-teal" />
              <h2 className="text-xl font-display font-bold text-ink">Governing Law</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws,
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-accent" />
              <h2 className="text-xl font-display font-bold text-ink">Contact Information</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through
              our WhatsApp chatbot or email us at <span className="font-mono text-ink bg-surface px-1.5 py-0.5 border border-ink/10">[email]</span>.
            </p>
          </section>
        </div>

        <p className="text-center text-[11px] text-ink-muted mt-10">
          JPCO &copy; {new Date().getFullYear()} — All rights reserved
        </p>
      </div>
    </div>
  )
}
