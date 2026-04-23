import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Deletion | JPCO WhatsApp Bot',
}

export default function DeleteData() {
  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      <div className="fixed top-10 left-10 w-64 h-64 bg-danger/5 rotate-12 pointer-events-none" />
      <div className="fixed bottom-0 right-10 w-72 h-72 bg-accent/5 -rotate-6 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-danger" />
            <span className="eyebrow text-danger">Privacy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-ink tracking-tight leading-none mb-3">
            Data <span className="text-danger">Deletion</span> Instructions
          </h1>
          <p className="text-base text-ink-secondary leading-relaxed mt-4 max-w-lg">
            We respect your privacy and your right to control your personal data.
            If you wish to delete your data from our WhatsApp chatbot service, please follow the instructions below.
          </p>
        </div>

        <div className="bg-white border-2 border-ink/8 shadow-card p-8 md:p-10 space-y-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-danger" />
              <h2 className="text-xl font-display font-bold text-ink">What Data Will Be Deleted</h2>
            </div>
            <p className="text-ink-secondary mb-3">When you request data deletion, we will remove:</p>
            <div className="space-y-2">
              {[
                'Your phone number and WhatsApp profile information',
                'All messages and conversation history',
                'Documents and files you have submitted',
                'Any personal information associated with your account',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 pl-3 py-1.5 border-l-2 border-danger/30">
                  <span className="text-danger font-bold text-sm leading-none mt-0.5">&#8226;</span>
                  <span className="text-sm text-ink-secondary">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-accent" />
              <h2 className="text-xl font-display font-bold text-ink">How to Request Data Deletion</h2>
            </div>

            <div className="border-2 border-accent/20 bg-accent/5 p-5 relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent" />
              <p className="eyebrow text-accent mb-2">Option 1: Via WhatsApp</p>
              <p className="text-ink-secondary text-sm">
                Send a message to our WhatsApp chatbot with the text:{' '}
                <span className="font-mono bg-accent/10 text-accent px-2 py-1 border border-accent/20">"Delete my data"</span>{' '}
                or{' '}
                <span className="font-mono bg-accent/10 text-accent px-2 py-1 border border-accent/20">"Remove my information"</span>
              </p>
            </div>

            <div className="border-2 border-[#0c8599]/20 bg-[#0c8599]/5 p-5 mt-4 relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#0c8599]" />
              <p className="eyebrow text-[#0c8599] mb-2">Option 2: Via Email</p>
              <p className="text-ink-secondary text-sm">
                Send an email to{' '}
                <span className="font-mono bg-[#0c8599]/10 text-[#0c8599] px-2 py-1 border border-[#0c8599]/20">[email]</span>{' '}
                with the subject{' '}
                <span className="font-mono bg-[#0c8599]/10 text-[#0c8599] px-2 py-1 border border-[#0c8599]/20">"Data Deletion Request"</span>{' '}
                and include your WhatsApp phone number in the message.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#0c8599]" />
              <h2 className="text-xl font-display font-bold text-ink">Processing Time</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              We will process your data deletion request within 30 days. You will receive a confirmation
              once your data has been successfully deleted from our systems.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#d9480f]" />
              <h2 className="text-xl font-display font-bold text-ink">Data Retention Exceptions</h2>
            </div>
            <p className="text-ink-secondary mb-3">
              Please note that we may retain certain information if required by law or for legitimate business purposes, such as:
            </p>
            <div className="space-y-2">
              {[
                'Legal compliance and regulatory requirements',
                'Fraud prevention and security purposes',
                'Resolving disputes or enforcing agreements',
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
              <div className="w-1 h-6 bg-accent" />
              <h2 className="text-xl font-display font-bold text-ink">Questions?</h2>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              If you have any questions about data deletion or need assistance, please contact us
              through our WhatsApp chatbot or email us at{' '}
              <span className="font-mono bg-surface px-1.5 py-0.5 border border-ink/10 text-ink">[email]</span>.
            </p>
          </section>

          <section className="pt-6 border-t-2 border-ink/8">
            <p className="text-sm text-ink-muted">
              For more information about how we handle your data, please review our{' '}
              <a href="/privacy" className="text-accent hover:text-accent-hover font-medium border-b border-accent/30 hover:border-accent/60 transition-colors">Privacy Policy</a>.
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
