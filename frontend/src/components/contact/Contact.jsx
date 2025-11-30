import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  User,
  MessageSquare,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import Header from "../Header";
import Footer from "../Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <Header />
      {/* HERO SECTION */}
      <section className="py-20 mt-20 bg-gradient-to-r from-red-600 to-red-700 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          We’re here to support you. Reach out to us for any help, queries, or blood-related assistance.
        </p>
      </section>

      {/* CONTACT CARDS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6">
          {/* Phone */}
          <div className="text-center shadow-md p-8 rounded-xl hover:shadow-xl transition">
            <Phone className="w-10 h-10 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Emergency Helpline</h3>
            <p className="text-gray-600">+91 98765 43210</p>
            <p className="text-gray-600">Available 24/7</p>
          </div>

          {/* Email */}
          <div className="text-center shadow-md p-8 rounded-xl hover:shadow-xl transition">
            <Mail className="w-10 h-10 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Email Us</h3>
            <p className="text-gray-600">support@bloodconnect.org</p>
            <p className="text-gray-600">info@bloodconnect.org</p>
          </div>

          {/* Office */}
          <div className="text-center shadow-md p-8 rounded-xl hover:shadow-xl transition">
            <MapPin className="w-10 h-10 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Head Office</h3>
            <p className="text-gray-600">Navi Mumbai, Maharashtra</p>
            <p className="text-gray-600">India - 410206</p>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 px-6">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-gray-600 mb-6">
              Have any questions? We're always here to help you with blood donation, camp organization, or support queries.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="text-red-600 mr-3" />
                <span className="text-gray-700">+91 98765 43210</span>
              </div>
              <div className="flex items-center">
                <Mail className="text-red-600 mr-3" />
                <span className="text-gray-700">support@bloodconnect.org</span>
              </div>
              <div className="flex items-center">
                <MapPin className="text-red-600 mr-3" />
                <span className="text-gray-700">Navi Mumbai, Maharashtra</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-6 mt-8">
              <Instagram className="w-8 h-8 text-red-600 hover:text-red-700 cursor-pointer" />
              <Facebook className="w-8 h-8 text-red-600 hover:text-red-700 cursor-pointer" />
              <Linkedin className="w-8 h-8 text-red-600 hover:text-red-700 cursor-pointer" />
              <Globe className="w-8 h-8 text-red-600 hover:text-red-700 cursor-pointer" />
            </div>
          </div>

          {/* FORM */}
          <form className="bg-white p-8 rounded-2xl shadow-lg space-y-6">
            {/* Name */}
            <div>
              <label className="font-medium text-gray-700">Full Name</label>
              <div className="flex items-center border rounded-lg px-3 mt-2">
                <User className="text-gray-500 mr-2" />
                <input  
                  type="text"
                  placeholder="Enter your name"
                  className="w-full p-3 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="font-medium text-gray-700">Email Address</label>
              <div className="flex items-center border rounded-lg px-3 mt-2">
                <Mail className="text-gray-500 mr-2" />
                <input  
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-3 outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center border rounded-lg px-3 mt-2">
                <Phone className="text-gray-500 mr-2" />
                <input  
                  type="text"
                  placeholder="Enter phone number"
                  className="w-full p-3 outline-none"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="font-medium text-gray-700">Message</label>
              <div className="flex items-start border rounded-lg px-3 mt-2">
                <MessageSquare className="text-gray-500 mr-2 mt-3" />
                <textarea
                  rows={4}
                  placeholder="Write your message here..."
                  className="w-full p-3 outline-none"
                ></textarea>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* MAP SECTION */}
      <section className="mb-5">
        <iframe
          title="map"
          className="w-full h-96"
          src="https://maps.google.com/maps?q=Navi%20Mumbai&t=&z=13&ie=UTF8&iwloc=&output=embed"
          allowFullScreen
        ></iframe>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Contact;
