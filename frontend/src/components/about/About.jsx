import React from 'react';
import { 
  Heart, 
  Users, 
  Shield, 
  Award, 
  Target,
  Droplet,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import Footer from '../Footer';
import Header from '../Header';

const AboutUs = () => {
  const stats = [
    { icon: Users, number: '50,000+', label: 'Lives Saved' },
    { icon: Droplet, number: '100,000+', label: 'Donations' },
    { icon: MapPin, number: '500+', label: 'Camps Organized' },
    { icon: Shield, number: '99.8%', label: 'Safety Rate' }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'We believe in the power of human kindness and the impact one person can make in saving lives.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Every donation follows strict medical protocols ensuring donor safety and blood quality.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building strong communities where people help each other in times of need.'
    },
    {
      icon: Target,
      title: 'Excellence',
      description: 'Committed to maintaining the highest standards in blood collection and distribution.'
    }
  ];

  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Medical Director',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      bio: '15+ years in hematology and transfusion medicine'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Operations Head',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Expert in healthcare logistics and camp management'
    },
    {
      name: 'Priya Sharma',
      role: 'Community Manager',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Dedicated to building donor relationships and awareness'
    },
    {
      name: 'David Kim',
      role: 'Technology Lead',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Ensuring seamless digital experience for donors and recipients'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 mt-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Saving Lives, One Drop at a Time
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            We are a dedicated platform connecting blood donors with those in need, 
            making blood donation accessible, safe, and impactful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors">
              Join Our Mission
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6">
                To create a world where no one dies waiting for blood. We bridge the gap 
                between voluntary blood donors and patients, ensuring timely access to 
                safe blood when it's needed most.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-red-600 mr-3" />
                  <span className="text-gray-700">24/7 Emergency Blood Availability</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-red-600 mr-3" />
                  <span className="text-gray-700">100% Safe & Verified Donors</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-red-600 mr-3" />
                  <span className="text-gray-700">Nationwide Network Coverage</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h3>
              <p className="text-lg text-gray-700 mb-6">
                We envision a future where blood transfusion becomes a hassle-free process 
                for every patient, supported by a robust network of committed donors and 
                advanced technology.
              </p>
              <div className="bg-red-50 p-6 rounded-lg">
                <Award className="w-12 h-12 text-red-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Quality Promise</h4>
                <p className="text-gray-700">
                  Every unit of blood goes through 12 rigorous quality checks to ensure 
                  maximum safety for both donors and recipients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do and define who we are
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="bg-red-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                  <value.icon className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Passionate professionals dedicated to making a difference in healthcare
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="h-48 bg-gradient-to-r from-red-400 to-red-600 relative overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-red-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of heroes who are saving lives through blood donation. 
            Your single donation can save up to 3 lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors">
              Become a Donor
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
              Organize a Camp
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Phone className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Helpline</h3>
              <p className="text-gray-600">+1 (555) 123-HELP</p>
              <p className="text-gray-600">24/7 Available</p>
            </div>
            <div className="text-center">
              <Mail className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">help@bloodconnect.org</p>
              <p className="text-gray-600">support@bloodconnect.org</p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Headquarters</h3>
              <p className="text-gray-600">123 Healthcare Ave</p>
              <p className="text-gray-600">Medical District, City 12345</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;