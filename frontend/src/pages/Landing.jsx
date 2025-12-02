import {
  ArrowRight,
  Heart,
  Users,
  MapPin,
  Clock,
  Droplets,
  Shield,
  Zap,
  Search,
  Bell,
  Calendar,
  FileText,
  Award,
  CheckCircle,
  Target,
  Activity,
  RefreshCw,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LandingPage = () => {
  const stats = [
    { icon: Users, label: "Lives Saved", value: "10,000+" },
    { icon: Heart, label: "Blood Units", value: "50,000+" },
    { icon: MapPin, label: "Partner Hospitals", value: "150+" },
    { icon: Clock, label: "Response Time", value: "< 30min" },
  ];

  const features = [
    {
      icon: Users,
      title: "Easy Donor Registration",
      description:
        "Simple and secure donor registration process with medical history tracking and eligibility verification.",
      color: "red",
    },
    {
      icon: Droplets,
      title: "Real-time Inventory Tracking",
      description:
        "Monitor blood inventory levels, expiration dates, and distribution in real-time across all partner facilities.",
      color: "blue",
    },
    {
      icon: Zap,
      title: "Quick Response",
      description:
        "Emergency request system with automated matching and notification to ensure rapid response in critical situations.",
      color: "green",
    },
  ];

  const processSteps = [
    {
      step: "01",
      icon: FileText,
      title: "Register & Screen",
      description: "Complete simple registration and health screening process",
    },
    {
      step: "02",
      icon: Search,
      title: "Find Match",
      description: "Our system matches blood needs with compatible donors",
    },
    {
      step: "03",
      icon: Bell,
      title: "Get Notified",
      description: "Receive instant alerts for urgent needs in your area",
    },
    {
      step: "04",
      title: "Donate & Save Lives",
      description: "Visit approved centers and make your life-saving donation",
    },
  ];

  const bloodTypes = [
    { type: "A+", need: "High", donors: "32%" },
    { type: "A-", need: "Critical", donors: "8%" },
    { type: "B+", need: "Medium", donors: "12%" },
    { type: "B-", need: "High", donors: "3%" },
    { type: "O+", need: "High", donors: "35%" },
    { type: "O-", need: "Critical", donors: "5%" },
    { type: "AB+", need: "Low", donors: "4%" },
    { type: "AB-", need: "Medium", donors: "1%" },
  ];

  const donationFacts = [
    {
      icon: Heart,
      title: "One Donation, Multiple Lives",
      description:
        "A single blood donation can save up to 3 lives. Your one hour can give someone a lifetime.",
      stat: "3 Lives Saved",
    },
    {
      icon: RefreshCw,
      title: "Blood Regeneration",
      description:
        "Your body replaces the blood you donate within 24-48 hours. The red blood cells are completely replaced in 4-6 weeks.",
      stat: "48 Hours",
    },
    {
      icon: Users,
      title: "Constant Need",
      description:
        "Every 2 seconds, someone needs blood. Your regular donation ensures continuous supply for emergencies.",
      stat: "Every 2 Seconds",
    },
    {
      icon: AlertTriangle,
      title: "Short Shelf Life",
      description:
        "Red blood cells last only 42 days, platelets just 5 days. Regular donations are essential to maintain supply.",
      stat: "42 Days Shelf Life",
    },
  ];

  const eligibilityInfo = [
    {
      icon: CheckCircle,
      title: "Who Can Donate",
      items: [
        "Age 17-75 (16 with parental consent)",
        "Weight at least 110 lbs (50 kg)",
        "Good general health",
        "No flu or cold symptoms",
      ],
    },
    {
      icon: Stethoscope,
      title: "Health Benefits",
      items: [
        "Free health screening",
        "Burns 650 calories per donation",
        "Reduces risk of heart disease",
        "Stimulates blood cell production",
      ],
    },
    {
      icon: Shield,
      title: "Safety First",
      items: [
        "Sterile, disposable equipment",
        "Trained medical staff",
        "Comfortable environment",
        "Post-donation care",
      ],
    },
  ];

  const emergencyNeeds = [
    { type: "Accident Victims", units: "Up to 100 units", icon: AlertTriangle },
    { type: "Cancer Patients", units: "8 units weekly", icon: Heart },
    { type: "Surgery Patients", units: "5-10 units", icon: Stethoscope },
    { type: "Burn Victims", units: "20+ units", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-red-50 mt-10">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-700 to-red-900 text-white">
        <div className="absolute inset-0 opacity-20"></div>
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
              <Heart className="w-4 h-4" />
              Saving Lives Every Day
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Connect{" "}
              <span className="bg-gradient-to-r from-red-200 to-red-300 bg-clip-text text-transparent">
                Blood Donors
              </span>{" "}
              with Those in Need
            </h1>

            <p className="text-lg md:text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Our advanced blood bank management system ensures efficient
              donation, storage, and distribution of blood products to save
              lives when every second counts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <button className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-xl bg-white text-red-700 hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <Link to="#about">
                <button className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-xl border-2 border-white text-white hover:bg-white/10 transition-all duration-300">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            className="relative block w-full h-16"
            viewBox="0 0 1200 150"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V150H0V90.83C36.67,85.19,76.33,76,112,69.33C160.67,59.67,224.67,47.33,321.39,56.44Z"
              className="fill-slate-50"
            ></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-red-50 hover:bg-red-100 transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-200 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-700" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-red-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-red-700 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blood Need Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Current Blood Needs
            </h2>
            <p className="text-lg text-slate-600">
              Real-time blood type requirements across our network. Your
              donation matters now more than ever.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {bloodTypes.map((blood, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`text-2xl font-bold mb-2 ${
                    blood.need === "Critical"
                      ? "text-red-600"
                      : blood.need === "High"
                      ? "text-orange-500"
                      : "text-green-500"
                  }`}
                >
                  {blood.type}
                </div>
                <div
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    blood.need === "Critical"
                      ? "bg-red-100 text-red-700"
                      : blood.need === "High"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {blood.need} Need
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {blood.donors} Donors
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Donate Blood Section - NEW */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Why Your Blood Donation Matters
            </h2>
            <p className="text-lg text-slate-600">
              Every donation creates a ripple effect of hope and healing in our
              community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {donationFacts.map((fact, index) => {
              const Icon = fact.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border-t-4 border-red-500"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-slate-800">
                    {fact.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {fact.description}
                  </p>
                  <div className="text-red-600 font-bold text-lg">
                    {fact.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Needs Section - NEW */}
      <section className="py-20 bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Who Needs Your Blood?
            </h2>
            <p className="text-lg text-red-100">
              Your donation directly impacts patients in critical situations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {emergencyNeeds.map((need, index) => {
              const Icon = need.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {need.type}
                  </h3>
                  <p className="text-red-100 text-sm">{need.units}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <div className="bg-white/10 rounded-2xl p-6 max-w-2xl mx-auto backdrop-blur-sm">
              <p className="text-lg text-white mb-4">
                <strong>47% of the population</strong> is eligible to donate
                blood, but only <strong>5%</strong> actually do.
              </p>
              <p className="text-red-100">
                Your single donation can make all the difference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Simple steps to become a life-saver. Join thousands of donors
              making a difference.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-red-500 group-hover:transform group-hover:-translate-y-2">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                      {step.step}
                    </div>
                    {Icon && (
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-3 text-slate-800">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eligibility & Benefits Section - NEW */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Donor Eligibility & Benefits
            </h2>
            <p className="text-lg text-slate-600">
              Safe, simple, and rewarding - discover the benefits of blood
              donation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {eligibilityInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-800 text-center">
                    {info.title}
                  </h3>
                  <ul className="space-y-3">
                    {info.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-3 text-slate-600"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
              Why Choose Our Blood Bank System?
            </h2>
            <p className="text-lg text-slate-600">
              We provide a comprehensive platform that connects donors,
              hospitals, and blood banks to ensure efficient blood collection
              and distribution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border-t-4 border-red-500"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-800">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10 max-w-5xl mx-auto">
            <div className="flex-1">
              <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Secure & Compliant
              </h2>
              <p className="text-slate-600 mb-6">
                Our system meets all healthcare data security standards with
                end-to-end encryption and strict compliance with medical
                regulations to protect donor and patient information.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  HIPAA compliant data handling
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  End-to-end encryption
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  Regular security audits
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-red-50 rounded-2xl p-8 border border-red-100">
              <div className="aspect-video bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                <div className="text-center p-4">
                  <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-700 font-medium">
                    Secure Blood Bank Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-700 to-red-900 text-white relative overflow-hidden">
        <div className="absolute inset-0  opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Save Lives?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join our community of donors and healthcare professionals working
            together to ensure blood is available when and where it's needed
            most.
          </p>
          <Link to="/auth">
            <button className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium rounded-xl bg-white text-red-700 hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl">
              Join Today <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LandingPage;
