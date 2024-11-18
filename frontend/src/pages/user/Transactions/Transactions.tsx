import { Helmet } from "react-helmet";
import { Text } from "../../../components";
import TransactionPaid from "../../../components/TransactionPaid/TransactionPaid";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

interface Transaction {
  tenant_name: string;
  month_paid_for: number;
  year_paid_for: number;
  amount_paid: string;
  transaction_date: string;
}

interface FormattedTransaction {
  tenant_name: string;
  month_paid_for: string;
  year_paid_for: number;
  amount_paid: number;
  transaction_date: string;
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [transactions, setTransactions] = useState<FormattedTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        console.log(`Fetching transactions for tenantId: ${tenantId}`);
  
        const response = await fetch(`http://127.0.0.1:8000/api/transactions/?tenantId=${tenantId}`);
        if (response.ok) {
          const data: Transaction[] = await response.json();
          console.log("Fetched transactions:", data);
  
          const formattedData: FormattedTransaction[] = data.map((transaction) => ({
            ...transaction,
            amount_paid: parseFloat(transaction.amount_paid),
            transaction_date: formatTransactionDate(transaction.transaction_date),
            month_paid_for: convertMonthToName(transaction.month_paid_for),
          }));

          // Sort the transactions by year and month
          formattedData.sort((a, b) => {
            const yearComparison = a.year_paid_for - b.year_paid_for;
            if (yearComparison !== 0) return yearComparison;
            return convertMonthToNumber(a.month_paid_for) - convertMonthToNumber(b.month_paid_for);
          });

          setTransactions(formattedData);
        } else {
          setError("Failed to fetch transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Error fetching transactions");
      } finally {
        setLoading(false);
      }
    };
  
    fetchTransactions();
  }, [tenantId]);

  const convertMonthToName = (month: number): string => {
    const date = new Date();
    date.setMonth(month - 1); // JavaScript months are 0-based, so subtract 1
    return date.toLocaleString('default', { month: 'short' }); // "Jan", "Feb", etc.
  };

  const convertMonthToNumber = (monthName: string): number => {
    return new Date(Date.parse(monthName + " 1, 2012")).getMonth() + 1; // Use a fixed year for conversion
  };

  const formatTransactionDate = (dateStr: string): string => {
    // Assuming the input is in "yyyy-mm-dd" format
    const [year, month, day] = dateStr.split('-').map(Number);
  
    // Get the month name
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
  
    // Return the formatted date
    return `${day} ${monthName} ${year}`;
  };

  const handleButtonClick = () => {
    navigate(`/boarderprofile/${tenantId}`);
  };

  return (
    <>
      <Helmet>
        <title>HypTech</title>
        <meta name="description" content="Web site created using create-react-app" />
        <style>{globalStyles}</style>
      </Helmet>
      <div className="w-full border border-solid border-white-A700">
        <div className="flex flex-col items-center gap-5 pb-[54px] md:pb-5">
          <div className="self-stretch">
            <div className="flex items-center gap-[7px] self-stretch bg-customcyan p-3.5">
              <button onClick={handleButtonClick} className="p-5 cursor-pointer">
                <img src="/images/backbtn.png" alt="arrowleft" />
              </button>
              <Text size="3xl" as="p" className="!font-open-sans tracking-[4.50px] !text-white pl-5">
                Transactions
              </Text>
            </div>
          </div>
          <div className="container-xs md:p-5">
            <div className="flex flex-col gap-[30px]">
              {loading ? (
                <Text as="p" className="text-center">Loading...</Text>
              ) : error ? (
                <Text as="p" className="text-center">{error}</Text>
              ) : transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <TransactionPaid
                    key={index}
                    month={transaction.month_paid_for}
                    year={transaction.year_paid_for}
                    date={transaction.transaction_date}
                    dues={transaction.amount_paid}
                  />
                ))
              ) : (
                <Text as="p" className="text-center">No transactions found</Text>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
