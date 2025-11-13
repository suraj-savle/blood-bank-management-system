import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Droplet,
  Clock,
  Calendar,
  Heart,
} from "lucide-react";

const DonorDashboard = () => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonorData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch("http://localhost:5000/api/donor/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch donor data");

        const data = await res.json();
        console.log("Donor Data:", data);

        const donorData = data.donor;

        setDonor({
          name: donorData.fullName || "Unknown Donor",
          email: donorData.email,
          city: donorData.address?.city || "Not Provided",
          state: donorData.address?.state || "",
          bloodType: donorData.bloodGroup || "N/A",
          totalDonations: donorData.totalDonations || 0,
          lastDonation: donorData.lastDonationDate
            ? new Date(donorData.lastDonationDate).toLocaleDateString()
            : "No Donations Yet",
          nextEligible: donorData.nextEligibleDate
            ? new Date(donorData.nextEligibleDate).toLocaleDateString()
            : "Not Calculated",
          eligibleToDonate: donorData.eligibleToDonate ? "Yes" : "No",
          age: donorData.age || "N/A",
          history:
            donorData.donationHistory?.map((h) => ({
              id: h.id,
              date: h.donationDate,
              place: h.facility || "Unknown Facility",
              units: h.quantity || 1,
            })) || [],
          upcomingCamps: donorData.upcomingCamps || [], // keep if you add camps later
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonorData();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-600 text-lg">
        Loading donor data...
      </div>
    );

  if (!donor)
    return (
      <div className="p-6 text-center text-gray-600 text-lg">
        Failed to load donor data 😔
      </div>
    );

  return (
    <div className="p-6">
      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-2xl border border-red-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-red-100 p-6 rounded-full">
            <User className="text-red-600 w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-gray-800">
              {donor.name}
            </h2>
            <p className="text-gray-500">{donor.email}</p>
            <p className="text-gray-600 mt-1 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              {donor.city}, {donor.state}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Age: {donor.age} | Eligible:{" "}
              <span
                className={`font-semibold ${
                  donor.eligibleToDonate === "Yes"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {donor.eligibleToDonate}
              </span>
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-500">Blood Type</p>
            <p className="text-3xl font-bold text-red-600">
              {donor.bloodType}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Droplet className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Total Donations</p>
            <h3 className="text-2xl font-bold">{donor.totalDonations}</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Clock className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Last Donation</p>
            <h3 className="text-2xl font-bold">{donor.lastDonation}</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Calendar className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Next Eligible</p>
            <h3 className="text-2xl font-bold">{donor.nextEligible}</h3>
          </div>
        </div>
      </div>

      {/* Donation History */}
      <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          Donation History
        </h2>
        {donor.history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-red-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Facility
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Units Donated
                  </th>
                </tr>
              </thead>
              <tbody>
                {donor.history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b hover:bg-red-50 transition text-gray-700"
                  >
                    <td className="px-4 py-2">
                      {new Date(h.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{h.place}</td>
                    <td className="px-4 py-2">{h.units} Unit</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No donation history yet</p>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;
