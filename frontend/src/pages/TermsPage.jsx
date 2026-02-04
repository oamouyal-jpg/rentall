import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="page-enter min-h-screen bg-white" data-testid="terms-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-8 font-heading">
          Terms of Service
        </h1>
        
        <p className="text-stone-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-stone max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              1. Acceptance of Terms
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              By accessing or using RentAll ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              2. Description of Service
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              RentAll is a peer-to-peer rental marketplace that connects people who want to rent items with people who have items to rent. 
              We provide the platform and payment processing; we do not own, create, sell, resell, control, manage, offer, deliver, or supply any listings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              3. User Accounts
            </h2>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information</li>
              <li>One person may not maintain more than one account</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              4. Listings and Bookings
            </h2>
            <h3 className="font-semibold text-stone-800 mb-2">For Owners (Listers):</h3>
            <ul className="list-disc pl-6 text-stone-600 space-y-2 mb-4">
              <li>You must have the legal right to rent the item</li>
              <li>Listings must be accurate and not misleading</li>
              <li>You are responsible for the condition and safety of your items</li>
              <li>You must honor confirmed bookings unless there are extenuating circumstances</li>
              <li>You are responsible for any applicable taxes on your earnings</li>
            </ul>
            
            <h3 className="font-semibold text-stone-800 mb-2">For Renters:</h3>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>You agree to use rented items responsibly and lawfully</li>
              <li>You must return items in the same condition you received them</li>
              <li>You are liable for any damage caused during the rental period</li>
              <li>You must comply with all applicable laws when using rented items</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              5. Fees and Payments
            </h2>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>RentAll charges a 5% service fee on all transactions</li>
              <li>Owners receive 95% of the listed rental price</li>
              <li>All payments are processed through Stripe</li>
              <li>Payouts are processed within 3-5 business days after rental completion</li>
              <li>Refunds are subject to our cancellation policy</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              6. Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li><strong>More than 48 hours before:</strong> Full refund minus processing fees</li>
              <li><strong>24-48 hours before:</strong> 50% refund</li>
              <li><strong>Less than 24 hours:</strong> No refund</li>
              <li>Owners who cancel may be subject to penalties</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              7. Damage and Disputes
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              In case of damage to rented items:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>Renters are responsible for damage occurring during the rental period</li>
              <li>Damage deposits may be collected and held for high-value items</li>
              <li>Disputes should be reported within 24 hours of rental completion</li>
              <li>RentAll may mediate disputes but is not responsible for damages</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              8. Prohibited Items
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              The following items may not be listed on RentAll:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>Illegal items or items used for illegal purposes</li>
              <li>Weapons, ammunition, or explosives</li>
              <li>Controlled substances or drug paraphernalia</li>
              <li>Stolen property</li>
              <li>Counterfeit goods</li>
              <li>Items that infringe on intellectual property rights</li>
              <li>Hazardous materials</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              9. Limitation of Liability
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              RentAll is a platform connecting renters and owners. We do not own, control, or inspect items listed. 
              To the maximum extent permitted by law, RentAll is not liable for:
            </p>
            <ul className="list-disc pl-6 text-stone-600 space-y-2">
              <li>The quality, safety, or legality of listed items</li>
              <li>The accuracy of listings or user profiles</li>
              <li>The ability of users to complete transactions</li>
              <li>Personal injury or property damage arising from rentals</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              10. Indemnification
            </h2>
            <p className="text-stone-600 leading-relaxed">
              You agree to indemnify and hold harmless RentAll, its officers, directors, employees, and agents 
              from any claims, damages, losses, or expenses arising from your use of the platform, 
              your violation of these terms, or your violation of any rights of another.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4 font-heading">
              11. Contact Us
            </h2>
            <p className="text-stone-600 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-stone-600 mt-2">
              Email: legal@rentall.com<br />
              Address: 123 Rental Street, San Francisco, CA 94102
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="text-[#E05D44] hover:underline">
              Privacy Policy
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
