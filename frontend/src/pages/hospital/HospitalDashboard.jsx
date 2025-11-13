import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  CalendarDays,
  Activity,
  Droplet,
  Clock,
  History,
} from "lucide-react";

const HospitalDashboard = () => {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchHospitalData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token being sent:", token);

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("http://localhost:5000/api/hospital/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Facility getProfile route hit!");

      if (!res.ok) {
        throw new Error("Failed to fetch hospital data");
      }

      // ✅ Fetch JSON properly
      const data = await res.json();
      console.log("Hospital API response:", data);

      const h = data.hospital || data.facility || data; // fallback for structure

      if (!h) {
        throw new Error("No hospital data found in response");
      }

      setHospital({
        name: h.name,
        email: h.email,
        phone: h.phone,
        type: h.facilityType,
        category: h.facilityCategory,
        address: `${h.address?.street}, ${h.address?.city}, ${h.address?.state} - ${h.address?.pincode}`,
        totalCamps:
          h.history?.filter((event) => event.eventType === "Blood Camp")
            .length || 0,
        upcomingCamps:
          h.history?.filter(
            (event) =>
              event.eventType === "Blood Camp" &&
              new Date(event.date) > new Date()
          ).length || 0,
        totalSlots: Math.floor(Math.random() * 50) + 50, // demo slots
        lastActivity: h.history?.slice(-1)[0]?.date
          ? new Date(h.history.slice(-1)[0].date).toLocaleDateString()
          : "No Activity Yet",
        status: h.status,
        operatingHours: h.operatingHours,
        history: h.history || [],
      });
    } catch (err) {
      console.error("Error fetching hospital data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchHospitalData();
}, []);


  if (loading)
    return (
      <div className="p-6 text-center text-gray-600 text-lg">
        Loading hospital data...
      </div>
    );

  if (!hospital)
    return (
      <div className="p-6 text-center text-gray-600 text-lg">
        Failed to load hospital data 😔
      </div>
    );

  return (
    <div className="p-6">
      {/* Hospital Profile Card */}
      <div className="bg-white shadow-lg rounded-2xl border border-red-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-red-100 p-6 rounded-full">
            <Building2 className="text-red-600 w-10 h-10" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-gray-800">
              {hospital.name}
            </h2>
            <p className="text-gray-500">{hospital.email}</p>

            <p className="text-gray-600 mt-1 flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              {hospital.address}
            </p>

            <p className="text-gray-600 text-sm mt-1 flex items-center justify-center md:justify-start gap-2">
              <Phone className="w-4 h-4 text-red-500" />
              {hospital.phone}
            </p>

            <p className="text-gray-600 text-sm mt-1">
              Type:{" "}
              <span className="capitalize font-medium">
                {hospital.type || "Hospital"}
              </span>{" "}
              | Category: {hospital.category}
            </p>

            <p className="text-sm mt-1">
              Status:{" "}
              <span
                className={`font-semibold ${
                  hospital.status === "approved"
                    ? "text-green-600"
                    : hospital.status === "pending"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {hospital.status}
              </span>
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-500">Last Activity</p>
            <p className="text-xl font-bold text-red-600">
              {hospital.lastActivity}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Droplet className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Total Blood Camps</p>
            <h3 className="text-2xl font-bold">{hospital.totalCamps}</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <CalendarDays className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Upcoming Camps</p>
            <h3 className="text-2xl font-bold">{hospital.upcomingCamps}</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Activity className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Total Blood Slots</p>
            <h3 className="text-2xl font-bold">{hospital.totalSlots}</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 shadow-sm rounded-xl p-5 flex items-center gap-4">
          <Clock className="text-red-600 w-10 h-10" />
          <div>
            <p className="text-gray-600 text-sm">Operating Hours</p>
            <h3 className="text-md font-semibold">
              {hospital.operatingHours?.open} - {hospital.operatingHours?.close}
            </h3>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-red-600" /> Hospital Activity
        </h2>

        {hospital.history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-red-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Event
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {hospital.history.map((event, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-red-50 transition text-gray-700"
                  >
                    <td className="px-4 py-2">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{event.eventType}</td>
                    <td className="px-4 py-2">{event.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hospital activity yet.</p>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
