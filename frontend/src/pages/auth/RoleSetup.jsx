import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

export default function RoleSetup() {
	const [role, setRole] = useState("");
	const navigate = useNavigate();

	// Map friendly selection to registration targets
	const handleSubmit = (e) => {
		e.preventDefault();

		if (!role) {
			toast.error("Please select a role to continue");
			return;
		}

		if (role === "donor") {
			navigate("/register/donor");
			return;
		}

		// For facilities, navigate to the facility registration form and prefill the type
		// Role values for facilities are "hospital" and "blood-lab"
		if (role === "hospital" || role === "blood-lab") {
			navigate("/register/facility", { state: { facilityType: role === "hospital" ? "Hospital" : "Blood Lab" } });
			return;
		}

		// Fallback
		navigate("/");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<Toaster />
			<div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md border border-gray-200">
				<h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Choose Your Role</h2>
				<p className="text-center text-gray-500 mb-6">Select the role that best describes you to continue registration.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-800 mb-1">Role</label>
						<select
							value={role}
							onChange={(e) => setRole(e.target.value)}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
						>
							<option value="">Select role</option>
							<option value="donor">Donor</option>
							<option value="hospital">Hospital</option>
							<option value="blood-lab">Blood Lab</option>
						</select>
					</div>

					<button
						type="submit"
						className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
					>
						Continue
					</button>
				</form>
			</div>
		</div>
	);
}
