import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Scaleva",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base text-content">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-sm font-semibold tracking-tight text-content">
            Scaleva
          </Link>
          <Link href="/dashboard" className="text-sm text-content-muted hover:text-content">
            Dashboard →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-content">Terms of Service</h1>
        <p className="mt-2 text-sm text-content-muted">Last Updated: June 14, 2026</p>

        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400">
          PLEASE READ THESE TERMS OF SERVICE CAREFULLY. THEY CONTAIN A BINDING ARBITRATION CLAUSE AND CLASS ACTION WAIVER THAT AFFECT YOUR LEGAL RIGHTS.
        </div>

        <p className="mt-6 text-sm leading-relaxed text-content-muted">
          These Terms govern your access to and use of Scaleva&apos;s website, dashboard, and AI-powered SMS customer relationship management service (collectively, the &ldquo;Service&rdquo;), operated by Scaleva (&ldquo;Scaleva,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account, accessing, or using the Service, you (&ldquo;you,&rdquo; &ldquo;Customer,&rdquo; or &ldquo;Business Customer&rdquo;) agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-content-muted">

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">1. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into a binding contract to use the Service. By using the Service, you represent and warrant that you meet these requirements and that any business you represent is lawfully authorized to operate.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">2. Description of Service</h2>
            <p>
              Scaleva provides a platform that allows Business Customers to import customer contact and purchase data, configure an AI-driven messaging persona, and send automated, personalized SMS messages to their own customers using third-party infrastructure including Anthropic&apos;s Claude API (for message generation) and Twilio (for message delivery).
            </p>
            <p className="mt-3 font-medium text-content">
              Scaleva is a tool. Scaleva does not create, review, approve, or assume responsibility for the content of any message sent through the Service, nor for the legality of any Business Customer&apos;s contact list or messaging practices.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">3. Account Registration</h2>
            <p>
              You must provide accurate, complete information when creating an account and keep this information up to date. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">4. Subscription Plans, Fees, and Billing</h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.1 Plans</h3>
                <p>The Service is offered under subscription plans (Starter, Growth, Pro, and Enterprise) with associated customer and message limits, as described on our Pricing page. Pricing and plan features are subject to change with notice.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.2 Billing</h3>
                <p>Subscriptions are billed monthly in advance via Stripe. By providing payment information, you authorize us (through Stripe) to charge the applicable fees on a recurring basis until your subscription is cancelled.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.3 Free Trial</h3>
                <p>We may offer a free trial period. At the end of the trial, your subscription will automatically convert to a paid plan and your payment method will be charged unless you cancel before the trial ends.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.4 Usage Limits</h3>
                <p>Each plan includes specified limits on the number of customers and messages per billing cycle. Exceeding these limits may result in message sending being paused until you upgrade your plan or the next billing cycle begins.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.5 No Refunds</h3>
                <p>Except as required by law, all fees are non-refundable, including for partial billing periods, unused messages, or early cancellation.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.6 Failed Payments</h3>
                <p>If a payment fails, we may suspend or terminate your access to the Service until payment is successfully processed. You remain responsible for any fees incurred prior to suspension.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">4.7 Cancellation</h3>
                <p>You may cancel your subscription at any time through your account settings or the Stripe billing portal. Cancellation will take effect at the end of the current billing period.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">5. Customer Responsibilities — SMS Compliance</h2>
            <p className="font-medium text-content">This section is critical. By using the Service, you agree to the following:</p>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.1 Consent</h3>
                <p>You represent and warrant that you have obtained, and will maintain records of, valid prior express written consent from each individual (&ldquo;Recipient&rdquo;) to whom you send messages through the Service, in compliance with the Telephone Consumer Protection Act (TCPA), the CAN-SPAM Act, state mini-TCPA laws, and all other applicable laws and regulations governing automated and marketing communications.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.2 Opt-Outs</h3>
                <p>You agree to honor all opt-out requests immediately. The Service automatically processes STOP-type keywords to opt out Recipients and HELP-type keywords to provide support information. You agree not to circumvent, disable, or attempt to message Recipients who have opted out.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.3 Prohibited Content</h3>
                <p className="mb-2">You agree not to use the Service to send messages that:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Are unlawful, fraudulent, deceptive, or misleading;</li>
                  <li>Contain spam, unsolicited advertising to non-consenting recipients, or chain messages;</li>
                  <li>Infringe on intellectual property or privacy rights of any person;</li>
                  <li>Contain hate speech, harassment, threats, or content promoting violence;</li>
                  <li>Relate to illegal goods or services, adult content, or content prohibited by Twilio&apos;s Acceptable Use Policy or Messaging Policy.</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.4 Accuracy of Imported Data</h3>
                <p>You are solely responsible for the accuracy, legality, and source of any data you import into the Service, whether via CSV upload, manual entry, or third-party integration (Square, Shopify, HubSpot, Stripe, Clover, etc.). You represent that you have the right to use and share this data with Scaleva and its service providers.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.5 AI-Generated Content</h3>
                <p>The Service uses artificial intelligence to generate message content. While the Service is designed to produce relevant, personalized messages, <strong className="text-content">you acknowledge that AI-generated content may occasionally be inaccurate, inappropriate, or unexpected.</strong> You are responsible for the content sent on your behalf, including content generated automatically via the autopilot feature, and you may configure custom instructions, forbidden words, and other controls to manage this risk. You assume all risk associated with enabling automated/autopilot sending.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">5.6 Sole Responsibility</h3>
                <p>You acknowledge that <strong className="text-content">you, and not Scaleva, are the sender of record</strong> for purposes of TCPA and similar laws, and that you bear sole legal responsibility for compliance with all laws governing your communications with Recipients.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">6. Acceptable Use</h2>
            <p className="mb-2">In addition to the SMS-specific restrictions above, you agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use the Service to violate any law or regulation;</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or related systems;</li>
              <li>Interfere with or disrupt the integrity or performance of the Service;</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service;</li>
              <li>Use the Service to build a competing product;</li>
              <li>Resell or white-label the Service without a separate written agreement with Scaleva.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">7. Intellectual Property</h2>
            <p>
              Scaleva retains all right, title, and interest in and to the Service, including all software, designs, text, graphics, and other content, excluding data you upload (&ldquo;Customer Data&rdquo;). You retain ownership of your Customer Data. You grant Scaleva a limited license to use, process, and transmit Customer Data solely as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">8. Third-Party Services</h2>
            <p>
              The Service integrates with and relies on third-party providers, including Anthropic, Twilio, Stripe, Supabase, Resend, and optional integrations (Square, Shopify, HubSpot, Clover, etc.). Scaleva is not responsible for the availability, performance, security, or practices of these third-party services. Your use of such integrations may be subject to their own terms of service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">9. Disclaimers</h2>
            <div className="mt-2 rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed tracking-tight text-content-muted">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT MESSAGES WILL BE SUCCESSFULLY DELIVERED OR WILL ACHIEVE ANY PARTICULAR RESULT (INCLUDING, WITHOUT LIMITATION, INCREASED CUSTOMER RETENTION OR REVENUE).
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">10. Limitation of Liability</h2>
            <p className="mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
            <div className="rounded-lg border border-line bg-surface p-4 text-xs leading-relaxed tracking-tight text-content-muted">
              <p className="mb-3">(A) IN NO EVENT WILL SCALEVA, ITS OWNERS, OFFICERS, EMPLOYEES, AGENTS, AFFILIATES, OR THEIR RESPECTIVE FAMILY MEMBERS, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES;</p>
              <p className="mb-3">(B) IN NO EVENT WILL SCALEVA&apos;S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF (I) THE TOTAL FEES PAID BY YOU TO SCALEVA IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (II) ONE HUNDRED DOLLARS ($100);</p>
              <p>(C) THESE LIMITATIONS APPLY REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED, WHETHER CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.</p>
            </div>
            <p className="mt-3">Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">11. Indemnification</h2>
            <p className="mb-2">
              You agree to defend, indemnify, and hold harmless Scaleva, its owners, officers, employees, agents, affiliates, and their respective family members, from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>(A) your use of the Service;</li>
              <li>(B) Customer Data you upload, import, or process through the Service;</li>
              <li>(C) any messages sent on your behalf through the Service, including AI-generated and autopilot messages;</li>
              <li>(D) your violation of these Terms, including without limitation the SMS Compliance provisions in Section 5;</li>
              <li>(E) your violation of the TCPA, CAN-SPAM Act, or any other applicable law;</li>
              <li>(F) your violation of any rights of any third party, including Recipients.</li>
            </ul>
            <p className="mt-3">This indemnification obligation will survive termination of these Terms.</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice, including for violation of these Terms, non-payment, or suspected fraudulent, abusive, or illegal activity. Upon termination, your right to use the Service will immediately cease. Sections of these Terms that by their nature should survive termination (including Sections 7, 9, 10, 11, 14, and 15) will survive.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by cancelling your subscription and contacting us to request account deletion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">13. Modifications to the Service and Terms</h2>
            <p>
              We may modify or discontinue the Service, in whole or in part, at any time. We may update these Terms from time to time; material changes will be communicated via email or notice within the Service. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">14. Dispute Resolution — Binding Arbitration and Class Action Waiver</h2>
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400">
              PLEASE READ THIS SECTION CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS.
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">14.1 Agreement to Arbitrate</h3>
                <p>Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved by binding arbitration, rather than in court, except that either party may bring an individual action in small claims court.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">14.2 Class Action Waiver</h3>
                <div className="rounded-lg border border-line bg-surface p-3 text-xs tracking-tight text-content-muted">
                  YOU AND SCALEVA AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
                </div>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">14.3 Arbitration Procedure</h3>
                <p>Arbitration will be conducted by a single arbitrator under the rules of a recognized arbitration organization (such as the American Arbitration Association), in the state specified in Section 16, and judgment on the award rendered may be entered in any court having jurisdiction.</p>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-content">14.4 Opt-Out</h3>
                <p>You may opt out of this arbitration agreement by sending written notice to the contact email below within 30 days of first accepting these Terms.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">15. Limitation on Time to File Claims</h2>
            <p>
              Any cause of action or claim you may have arising out of or relating to these Terms or the Service must be commenced within one (1) year after the cause of action accrues, or such claim is permanently barred.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">16. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law principles, except where preempted by federal law (including the Federal Arbitration Act).
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">17. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">18. Entire Agreement</h2>
            <p>
              These Terms, together with the Privacy Policy, constitute the entire agreement between you and Scaleva regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold text-content">19. Contact Us</h2>
            <p>
              Questions about these Terms can be directed to:{" "}
              <a href="mailto:legal@scaleva.app" className="text-accent hover:underline">legal@scaleva.app</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="mt-16 border-t border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <span className="font-heading text-sm font-semibold text-content">Scaleva</span>
          <div className="flex items-center gap-4 text-xs text-content-muted">
            <Link href="/privacy" className="hover:text-content">Privacy</Link>
            <Link href="/terms" className="hover:text-content">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
