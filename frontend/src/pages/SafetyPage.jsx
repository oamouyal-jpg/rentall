import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, Users, MapPin, Camera, MessageSquare } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="page-enter min-h-screen" data-testid="safety-page">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#8DA399] to-[#768C82] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
            Safety Guidelines
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Your safety matters. Follow these guidelines for secure, worry-free rentals.
          </p>
        </div>
      </section>

      {/* Safe Trade Guidelines */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 font-heading flex items-center gap-3">
            <CheckCircle className="h-7 w-7 text-green-600" />
            Safe Trading Checklist
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-100">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#E05D44]" />
                Meet in Public Places
              </h3>
              <ul className="space-y-2 text-stone-600">
                <li>• Choose well-lit, busy public locations (shopping centers, cafes, police stations)</li>
                <li>• Avoid meeting at your home or private locations for first-time exchanges</li>
                <li>• Consider "Safe Trade Spots" at local police stations</li>
                <li>• For large items, meet at the owner's location but bring a friend</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-100">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#E05D44]" />
                Document Everything
              </h3>
              <ul className="space-y-2 text-stone-600">
                <li>• Take photos/videos of the item's condition before and after rental</li>
                <li>• Note any existing damage in writing</li>
                <li>• Keep records of all communications</li>
                <li>• Screenshot booking details and payment confirmations</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-100">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#E05D44]" />
                Verify the Other Party
              </h3>
              <ul className="space-y-2 text-stone-600">
                <li>• Check their profile reviews and ratings</li>
                <li>• Look for verified badges (phone, ID verification)</li>
                <li>• Trust your instincts — if something feels off, cancel</li>
                <li>• Video call before meeting for high-value items</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-100">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#E05D44]" />
                Keep Communication On-Platform
              </h3>
              <ul className="space-y-2 text-stone-600">
                <li>• Use RentAll messaging for all communications</li>
                <li>• Don't share personal contact details until after booking</li>
                <li>• Be wary of requests to pay outside the platform</li>
                <li>• Report suspicious behavior immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Signs */}
      <section className="py-16 bg-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 font-heading flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-red-600" />
            Red Flags to Watch For
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Requests to pay outside RentAll",
              "Pressure to meet immediately",
              "Prices that seem too good to be true",
              "Refusal to video call or meet in public",
              "Asking for sensitive personal information",
              "Poor communication or vague answers",
              "No reviews or very new account",
              "Requests to use gift cards or wire transfers"
            ].map((flag, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <span className="text-stone-700">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For High-Value Items */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 font-heading">
            For High-Value Rentals (Cars, Machinery, Electronics)
          </h2>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-amber-900 mb-3">Extra Precautions</h3>
            <ul className="space-y-2 text-amber-800">
              <li>• Request a damage deposit through the platform</li>
              <li>• Verify the renter's driver's license for vehicles</li>
              <li>• Consider requiring a security deposit for expensive items</li>
              <li>• Check if your insurance covers rental activities</li>
              <li>• Create a rental agreement with clear terms</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Insurance Recommendations</h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Check your homeowner's/renter's insurance policy</li>
              <li>• Consider additional liability coverage</li>
              <li>• For vehicles, ensure proper insurance is in place</li>
              <li>• Document everything for potential claims</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Report Issues */}
      <section className="py-16 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4 font-heading">
            Something Wrong?
          </h2>
          <p className="text-stone-300 mb-6">
            If you experience any issues or suspicious activity, report it immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:safety@rentall.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#E05D44] hover:bg-[#C54E36] rounded-full font-medium transition-colors"
            >
              Report an Issue
            </a>
            <Link 
              to="/terms"
              className="inline-flex items-center justify-center px-6 py-3 border border-white/30 hover:bg-white/10 rounded-full font-medium transition-colors"
            >
              View Terms of Service
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
