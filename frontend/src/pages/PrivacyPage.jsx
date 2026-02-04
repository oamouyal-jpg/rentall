import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="page-enter min-h-screen bg-white" data-testid="privacy-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-8 font-heading">
          Privacy Policy
        </h1>
        
        <p className="text-stone-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-stone max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              1. Information We Collect
            </h2>
            <h3 className="font-semibold text-stone-800 mb-2">Information you provide:</h3>
            <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
              <li>Account information (name, email, password)</li>
              <li>Profile information (photo, bio, location)</li>
              <li>Listing information (descriptions, photos, pricing)</li>
              <li>Payment information (processed by Stripe)</li>
              <li>Communications with other users and support</li>
            </ul>
            
            <h3 className="font-semibold text-stone-800 mb-2">Information collected automatically:</h3>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>Device information (browser, operating system)</li>
              <li>Usage data (pages visited, features used)</li>
              <li>Location data (with your permission)</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>To provide and improve our services</li>
              <li>To process transactions and send related information</li>
              <li>To send promotional communications (with your consent)</li>
              <li>To detect and prevent fraud</li>
              <li>To comply with legal obligations</li>
              <li>To enforce our terms of service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              3. Information Sharing
            </h2>
            <p className="text-stone-600 mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li><strong>Other users:</strong> Your profile and listing information is visible to other users</li>
              <li><strong>Service providers:</strong> Companies that help us operate (payment processing, hosting)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger or acquisition</li>
            </ul>
            <p className="text-stone-600 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              4. Data Security
            </h2>
            <p className="text-stone-600 leading-relaxed">
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2 mt-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing through Stripe</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              5. Your Rights
            </h2>
            <p className="text-stone-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              6. Cookies
            </h2>
            <p className="text-stone-600 leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2 mt-2">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Provide personalized content</li>
            </ul>
            <p className="text-stone-600 mt-4">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              7. Children's Privacy
            </h2>
            <p className="text-stone-600 leading-relaxed">
              RentAll is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              8. Changes to This Policy
            </h2>
            <p className="text-stone-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              9. Contact Us
            </h2>
            <p className="text-stone-600">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-stone-600 mt-2">
              Email: privacy@rentall.com<br />
              Address: 123 Rental Street, San Francisco, CA 94102
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="text-[#E05D44] hover:underline">
              Terms of Service
            </Link>
            <Link to="/safety" className="text-[#E05D44] hover:underline">
              Safety Guidelines
            </Link>
            <Link to="/how-it-works" className="text-[#E05D44] hover:underline">
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
