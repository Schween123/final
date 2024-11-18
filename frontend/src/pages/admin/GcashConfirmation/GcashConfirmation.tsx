import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { Suspense } from "react";
import GcashConfirmationInfo from "../../../components/GcashConfirmationInfo/GcashConfirmationInfo";
import GcashConfirmedRejected from "../../../components/GcashConfirmedRejected/GcashConfirmedRejected";
import Loading from "../../Loading/Loading";

const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0;
  }
  #root, .app {
    height: 100%;
  }
`;

interface Tenant {
  id: number;
  boarderfirstname: string;
  boardermiddlename: string;
  boarderlastname: string;
}

interface GcashTransaction {
  id: number;
  tenant: number;
  reference_number: string;
  amount_paid: string;
  transaction_date: string;
  transaction_time: string;
  month_paid_for: number;
  year_paid_for: number;
  status: string; // Status of the transaction (pending, confirmed, rejected)
}

export default function GcashConfirmation() {
  const navigate = useNavigate();
  const [pendingTransactions, setPendingTransactions] = useState<
    GcashTransaction[]
  >([]);
  const [confirmedTransactions, setConfirmedTransactions] = useState<
    GcashTransaction[]
  >([]);
  const [rejectedTransactions, setRejectedTransactions] = useState<
    GcashTransaction[]
  >([]);
  const [tenants, setTenants] = useState<Record<number, Tenant>>({});
  const [loading, setLoading] = useState(true);


    const fetchGcashTransactions = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/gcashtransactions/"
        );
        const transactions: GcashTransaction[] = response.data;

        // Filter transactions by their status
        const pending = transactions.filter((tx) => tx.status === "pending");
        const confirmed = transactions.filter(
          (tx) => tx.status === "CONFIRMED"
        );
        const rejected = transactions.filter((tx) => tx.status === "REJECTED");

        setPendingTransactions(pending);
        setConfirmedTransactions(confirmed);
        setRejectedTransactions(rejected);

        const tenantIds = Array.from(
          new Set(transactions.map((tx) => tx.tenant))
        );
        const tenantPromises = tenantIds.map((id) =>
          axios.get(`http://localhost:8000/api/tenant/${id}/`)
        );
        const tenantResponses = await Promise.all(tenantPromises);

        const tenantsData = tenantResponses.reduce(
          (acc: Record<number, Tenant>, { data }: { data: Tenant }) => {
            acc[data.id] = data;
            return acc;
          },
          {}
        );
        setTenants(tenantsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
 useEffect(() => {
    fetchGcashTransactions();
  }, []);

  const handleButtonClick = () => {
    navigate("/dashboard");
  };

  const handleConfirmTransaction = async (transactionId: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/gcashtransactions/${transactionId}/confirm/`
      );
      setPendingTransactions(
        pendingTransactions.filter((tx) => tx.id !== transactionId)
      );
      fetchGcashTransactions();
    } catch (error) {
      console.error("Error confirming transaction:", error);
    }
  };

  const handleRejectTransaction = async (transactionId: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/gcashtransactions/${transactionId}/reject/`
      );
      setPendingTransactions(
        pendingTransactions.filter((tx) => tx.id !== transactionId)
      );
      fetchGcashTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta
          name="description"
          content="Web site created using create-react-app"
        />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full border border-solid border-white-A700">
        <div className="flex flex-col items-center bg-customgray4">
          <div className="flex items-center self-stretch bg-customcyan">
            <button onClick={handleButtonClick} className="p-5 cursor-pointer">
              <img src="/images/backbtn.png" alt="Back" className="my-6 ml-5" />
            </button>
            <p className="text-3xl tracking-[4.50px] text-white pl-5 !font-opensans">
              Gcash Transactions
            </p>
          </div>

          {/* Pending Transactions Section */}
          <div className="container max-w-[1273px] mb-5 p-2">
            <div className="flex flex-col gap-4">
              {pendingTransactions.map((transaction) => (
                <Suspense
                  key={transaction.id}
                  fallback={<div>Loading transaction info...</div>}
                >
                  <GcashConfirmationInfo
                    boarder={`${tenants[transaction.tenant]?.boarderfirstname || ""} ${
                      tenants[transaction.tenant]?.boardermiddlename || ""
                    } ${tenants[transaction.tenant]?.boarderlastname || ""}`}
                    reference_number={transaction.reference_number}
                    amount_paid={transaction.amount_paid}
                    transaction_date={transaction.transaction_date}
                    transaction_time={transaction.transaction_time}
                    transactionId={transaction.id}
                    onConfirm={() => handleConfirmTransaction(transaction.id)}
                    onReject={() => handleRejectTransaction(transaction.id)}
                  />
                </Suspense>
              ))}
            </div>
          </div>

          <div className="h-[2px] w-11/12 mx-auto bg-cyan-800 shadow-xs" />

          {/* Confirmed and Rejected Transactions Section */}
          <div className="container max-w-[1273px] mb-5 p-2">
            <div className="flex flex-col gap-4">
              {/* Display Confirmed Transactions */}

              {confirmedTransactions.map((transaction) => (
                <Suspense
                  key={transaction.id}
                  fallback={<div>Loading transaction info...</div>}
                >
                  <GcashConfirmedRejected
                    boarder={`${tenants[transaction.tenant]?.boarderfirstname || ""} ${
                      tenants[transaction.tenant]?.boardermiddlename || ""
                    } ${tenants[transaction.tenant]?.boarderlastname || ""}`}
                    reference_number={transaction.reference_number}
                    amount_paid={transaction.amount_paid}
                    transaction_date={transaction.transaction_date}
                    transaction_time={transaction.transaction_time}
                    status={transaction.status}
                  />
                </Suspense>
              ))}

              {/* Display Rejected Transactions */}

              {rejectedTransactions.map((transaction) => (
                <Suspense
                  key={transaction.id}
                  fallback={<div>Loading transaction info...</div>}
                >
                  <GcashConfirmedRejected
                    boarder={`${tenants[transaction.tenant]?.boarderfirstname || ""} ${
                      tenants[transaction.tenant]?.boardermiddlename || ""
                    } ${tenants[transaction.tenant]?.boarderlastname || ""}`}
                    reference_number={transaction.reference_number}
                    amount_paid={transaction.amount_paid}
                    transaction_date={transaction.transaction_date}
                    transaction_time={transaction.transaction_time}
                    status={transaction.status}
                  />
                </Suspense>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
