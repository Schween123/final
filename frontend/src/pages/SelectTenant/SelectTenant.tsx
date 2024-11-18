import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Tenant {
  id: number;
  boarderfirstname: string;
}

const SelectTenant: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("0");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/tenant/");
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
        } else {
          console.error("Failed to fetch tenants");
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
      }
    };

    fetchTenants();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenant(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedTenant !== null) {
      navigate("/login", { state: { tenantId: selectedTenant } });
    }
  };

  return (
    <div className="m-5 p-5 border border-gray-300 rounded-md shadow-lg">
      <h1 className="text-lg font-semibold mb-4">Select a Tenant</h1>
      <div className="flex items-center gap-4">
        <select
          value={selectedTenant}
          onChange={handleChange}
          className="p-2 border border-gray-300 rounded-md w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="0">Select a tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.boarderfirstname}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          View Tenant
        </button>
      </div>
    </div>
  );
};

export default SelectTenant;
