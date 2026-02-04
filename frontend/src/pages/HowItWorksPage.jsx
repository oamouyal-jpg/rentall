import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Star, 
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Find what you need",
      description: "Browse thousands of items in your area. Use filters to find exactly what you're looking for — from cars to cameras to camping gear."
    },
    {
      icon: Calendar,
      title: "Book your dates",
      description: "Select the dates you need the item. See real-time availability and get instant pricing. No hidden fees."
    },
    {
      icon: MessageSquare,
      title: "Connect with the owner",
      description: "Message the owner to arrange pickup details, ask questions, or negotiate terms. Our in-app messaging keeps everything organized."
    },
    {
      icon: CreditCard,
      title: "Pay securely",
      description: "Complete your booking with our secure payment system. Your payment is protected until you receive the item."
    },
    {
      icon: Star,
      title: "Enjoy & review",
      description: "Use the item, return it on time, and leave a review. Your feedback helps build a trusted community."
    }
  ];

  const ownerSteps = [
    {
      title: "List your item",
      description: "Take photos, write a description, set your price. Listing is free and takes just minutes."
    },
    {
      title: "Accept bookings",
      description: "Review booking requests and accept the ones that work for you. You're always in control."
    },
    {
      title: "Meet & handover",
      description: "Arrange a safe meetup spot to hand over the item. Document condition with photos."
    },
    {
      title: "Get paid",
      description: "Receive 95% of the rental price directly to your account. We only take a 5% service fee."
    }
  ];

  return (
    <div className="page-enter min-h-screen" data-testid="how-it-works-page">
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
            How RentAll Works
          </h1>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto">
            Rent anything from anyone, anywhere. It's simple, secure, and saves you money.
          </p>
        </div>
      </section>

      {/* For Renters */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-[#E05D44]/10 text-[#E05D44] rounded-full text-sm font-medium mb-4">
              For Renters
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-heading">
              Rent in 5 easy steps
            </h2>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex items-start gap-6 bg-white p-6 rounded-2xl border border-stone-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#E05D44]/10 flex items-center justify-center shrink-0">
                  <step.icon className="h-7 w-7 text-[#E05D44]" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-stone-900 text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-stone-900 font-heading">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/search">
              <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full px-8 h-12">
                Start browsing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-[#8DA399]/10 text-[#8DA399] rounded-full text-sm font-medium mb-4">
              For Owners
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-heading">
              Turn your stuff into cash
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ownerSteps.map((step, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl border border-stone-100"
              >
                <div className="w-10 h-10 rounded-full bg-[#8DA399] text-white font-bold flex items-center justify-center mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2 font-heading">
                  {step.title}
                </h3>
                <p className="text-stone-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/create-listing">
              <Button className="bg-[#8DA399] hover:bg-[#768C82] rounded-full px-8 h-12">
                List your first item <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-heading">
              Your safety is our priority
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2 font-heading">
                Secure Payments
              </h3>
              <p className="text-stone-600 text-sm">
                All payments processed through Stripe. Your money is protected until you receive the item.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2 font-heading">
                Verified Users
              </h3>
              <p className="text-stone-600 text-sm">
                Look for verified badges. Users can verify their identity for extra trust.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2 font-heading">
                Reviews & Ratings
              </h3>
              <p className="text-stone-600 text-sm">
                Read honest reviews from real renters. Build your reputation with every rental.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/safety" className="text-[#E05D44] font-medium hover:underline">
              Learn more about safety →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 font-heading">
            Ready to get started?
          </h2>
          <p className="text-stone-300 mb-8">
            Join thousands of people already renting on RentAll. It's free to sign up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-[#E05D44] hover:bg-[#C54E36] rounded-full px-8 h-12">
                Create an account
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="rounded-full px-8 h-12 border-white text-white hover:bg-white hover:text-stone-900">
                Browse listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
