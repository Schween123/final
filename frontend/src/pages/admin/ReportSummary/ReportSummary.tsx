import { useEffect, useState } from "react";
import Header from "../../../components/Header/Header";
import { Helmet } from "react-helmet";
import axios from "axios";

const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0;
  }
  #root, .app {
    height: 100%;
  }
    table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  th {
    background-color: #f4f4f4;
    color: #333;
  }

`;

interface Tenant {
  id: number;
  boarderfirstname: string;
  boarderlastname: string;
  due_date: string; // Assuming this field exists
}

interface Transactions {
  tenant: number;
  month_paid_for: number; // Changed to number to match your model
  year_paid_for: number;
  payment_method: string;
}

interface Month {
  month: string;
  year: number;
}

// Define monthNames globally or within your component
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ReportSummary = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [months, setMonths] = useState<Month[]>([]);
  const [payments, setPayments] = useState<Transactions[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantsResponse = await axios.get<Tenant[]>(
          "http://127.0.0.1:8000/api/tenant/"
        );
        const paymentsResponse = await axios.get<Transactions[]>(
          "http://127.0.0.1:8000/api/transactions/"
        );

        setTenants(tenantsResponse.data);
        setPayments(paymentsResponse.data);

        // Generate months dynamically
        const generatedMonths = generateMonths();
        setMonths(generatedMonths);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const generateMonths = () => {
    const currentDate = new Date();

    // Define the start and end of the period
    const startYear = currentDate.getFullYear();
    const startMonth = currentDate.getMonth(); // Current month
    const endYear = startYear + 1; // End of the current year plus one year

    const monthsList: Month[] = [];
    let date = new Date(startYear, startMonth, 1);

    while (date.getFullYear() <= endYear) {
      const year = date.getFullYear();
      const month = monthNames[date.getMonth()];
      monthsList.push({ month, year });

      // Increment to the next month
      date = new Date(date.setMonth(date.getMonth() + 1));
    }

    return monthsList;
  };

  const getPaymentMethod = (tenantId: number, month: string, year: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      const registrationDate = new Date(tenant.due_date);
      const isRegistered =
        registrationDate.getFullYear() === year &&
        monthNames[registrationDate.getMonth()] === month;
      if (isRegistered) return "registered";
    }

    const payment = payments.find(
      (payment) =>
        payment.tenant === tenantId &&
        monthNames[payment.month_paid_for - 1] === month &&
        payment.year_paid_for === year
    );

    return payment ? payment.payment_method : " ";
  };

  return (
    <>
      <Helmet>
        <title>HypTech - Report Summary</title>
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full">
        <Header />
        <div className="max-w-screen-xl mx-auto p-8">
          <h1 className="text-3xl font-semibold text-center mb-4">
            Report Summary
          </h1>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="bg-customColor1 text-white !font-montserrat">
                    Name
                  </th>
                  {months.map((monthObj, index) => (
                    <th
                      key={index}
                      className="bg-customColor1 text-white !font-montserrat"
                    >
                      {monthObj.month} {monthObj.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="!font-opensans">
                      {tenant.boarderfirstname} {tenant.boarderlastname}
                    </td>
                    {months.map((monthObj, index) => (
                      <td key={index} className="!font-opensans">
                        {getPaymentMethod(
                          tenant.id,
                          monthObj.month,
                          monthObj.year
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportSummary;
