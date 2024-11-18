import { FC, useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Button, Text } from "../../../components";
import PayNowButtonRowOne from "../../../components/PayNowButtonRowOne/PayNowButtonRowOne";
import CashPaymentModal from "../../../components/CashPaymentModal/CashPaymentModal";
import GcashPaymentModalPage from "../GcashPaymentModal/GcashPaymentModal";
import PaymentMethodModal from "../../../components/PaymentMethodModal/PaymentMethodModal";
import { useNavigate, useParams } from "react-router-dom";

const globalStyles = `
  body, html {
    background-color: #C5C3C6; 
    height: 100%;
    margin: 0;
    overflow-y: scroll;
  }
  #root, .app {
    height: 100%;
    
    
  }
`;

interface MonthDetail {
  key: number;
  month: string;
  dueDate: string;
  price: string;
  isChecked: boolean;
  isPaid: boolean;
}

interface Tenant {
  id: number;
  total_monthly_due: number;
  due_date: string;
}

interface PaymentStatus {
  [year: string]: {
    [month: string]: string; // e.g., 'paid', 'unpaid'
  };
}

interface SelectedMonth {
  month: string;
  year: string;
}

const PayNow: FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showGcashPaymentModalPage, setShowGcashPaymentModalPage] =
    useState(false);
  const [months, setMonths] = useState<MonthDetail[]>([]);
  const [amountPayable, setAmountPayable] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<SelectedMonth[]>([]);
  const [hasUnpaidMonths, setHasUnpaidMonths] = useState(false);

  // Fetch tenant details and payment status
  const fetchTenantDetails = useCallback(async () => {
    if (tenantId) {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/tenant/${tenantId}/`
        );
        if (response.ok) {
          const data: Tenant = await response.json();
          const paymentStatusResponse = await fetch(
            `http://127.0.0.1:8000/api/tenant/${tenantId}/payment-status/`
          );
          if (paymentStatusResponse.ok) {
            const paymentStatus: PaymentStatus =
              await paymentStatusResponse.json();
            const monthlyDue = data.total_monthly_due;
            const startDate = new Date(data.due_date);
            generateMonths(startDate, monthlyDue, paymentStatus);
          } else {
            console.error("Failed to fetch payment status");
          }
        } else {
          console.error("Failed to fetch tenant details");
        }
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    }
  }, [tenantId]);

  //Generate months and remove paid months
  const generateMonths = (
    startDate: Date,
    monthlyDue: number,
    paymentStatus: PaymentStatus
  ) => {
    const monthsArray: MonthDetail[] = [];
    const monthsSet = new Set<string>(); // To track unique months
    let lastPaidMonthDate = new Date(startDate);
    lastPaidMonthDate.setMonth(lastPaidMonthDate.getMonth() - 0); // Initialize to one month before the start date

    // Helper function to generate month details
    const generateMonthDetails = (monthDate: Date, isPaid: boolean) => {
      const monthStr = monthDate.toLocaleString("default", { month: "long" });
      const monthNumeric = monthDate.getMonth() + 1; // Month as number
      const year = monthDate.getFullYear().toString();

      return {
        key: monthNumeric,
        month: monthStr,
        dueDate: `${monthDate.getDate()} ${monthDate.toLocaleString("default", { month: "short" })} ${year}`,
        price: `${monthlyDue.toFixed(2)}`,
        isChecked: false,
        isPaid: isPaid,
      };
    };

    // First Loop: Generate the initial 12 months
    for (let i = 1; i <= 12; i++) {
      const monthDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + i,
        startDate.getDate()
      );
      const monthStr = monthDate.toLocaleString("default", { month: "long" });
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      const isPaid =
        paymentStatus[monthDate.getFullYear().toString()]?.[monthStr] ===
        "paid";

      if (!monthsSet.has(monthKey) && monthDate >= startDate) {
        // Ensure no duplicate and only months from startDate onwards
        monthsArray.push(generateMonthDetails(monthDate, isPaid));
        monthsSet.add(monthKey);
      }

      if (isPaid) {
        lastPaidMonthDate = monthDate;
      }
    }

    // Second Loop: Generate succeeding months after the last paid month
    const startGenerationDate = new Date(
      lastPaidMonthDate.getFullYear(),
      lastPaidMonthDate.getMonth() + 1,
      lastPaidMonthDate.getDate()
    );

    for (let i = 0; i < 12; i++) {
      // Start from the next month after last paid
      const monthDate = new Date(
        startGenerationDate.getFullYear(),
        startGenerationDate.getMonth() + i,
        startGenerationDate.getDate()
      );
      const monthStr = monthDate.toLocaleString("default", { month: "long" });
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      const isPaid =
        paymentStatus[monthDate.getFullYear().toString()]?.[monthStr] ===
        "paid";

      if (!monthsSet.has(monthKey)) {
        monthsArray.push(generateMonthDetails(monthDate, isPaid));
        monthsSet.add(monthKey);
      }
    }

    setMonths(monthsArray);
  };

  //Calculate Amount Payable
  useEffect(() => {
    // Filter out the unpaid months
    const unpaidMonths = months.filter((month) => !month.isPaid);

    // Calculate the total amount payable
    const totalPayable = unpaidMonths.reduce((total, month) => {
      if (month.isChecked) {
        return total + parseFloat(month.price);
      }
      return total;
    }, 0);

    // Build the selected months array without duplicates
    const selected = unpaidMonths
      .filter((month) => month.isChecked)
      .reduce<SelectedMonth[]>((uniqueMonths, currentMonth) => {
        if (
          !uniqueMonths.some(
            (month) =>
              month.month === currentMonth.month &&
              month.year === currentMonth.dueDate.split(" ")[2]
          )
        ) {
          uniqueMonths.push({
            month: currentMonth.month,
            year: currentMonth.dueDate.split(" ")[2],
          });
        }
        return uniqueMonths;
      }, []);

    setAmountPayable(totalPayable);
    setSelectedMonths(selected);

    // Update if there are unpaid months
    setHasUnpaidMonths(selected.length > 0);
  }, [months]);

  // Handle month check
  const handleMonthCheck = (index: number, isChecked: boolean) => {
    setMonths((currentMonths) =>
      currentMonths.map((month) =>
        month.key === index ? { ...month, isChecked } : month
      )
    );
  };

  // Handle "Back" button click
  const handleButtonClick = () => {
    navigate(`/boarderprofile/${tenantId}`);
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setShowPaymentMethodModal(false);
    if (method === "CASH") {
      setShowCashPaymentModal(true);
    } else if (method === "GCASH") {
      setShowGcashPaymentModalPage(true); // Show Gcash modal
    }
  };

  // Close modals and refresh data
  const handleModalClose = () => {
    setShowPaymentMethodModal(false);
    setShowCashPaymentModal(false);
    setShowGcashPaymentModalPage(false); // Close Gcash modal
    fetchTenantDetails(); // Re-fetch tenant details when any modal closes
  };

  // Initial fetch of tenant details
  useEffect(() => {
    fetchTenantDetails();
  }, [fetchTenantDetails]);

  // After a successful payment, remove paid months
  const handlePaymentSuccess = (paidMonthKeys: number[]) => {
    setMonths((currentMonths) =>
      currentMonths.filter((month) => !paidMonthKeys.includes(month.key))
    );
  };

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
      <div className="w-full border border-solid">
        <div className="flex flex-col gap-[47px] pb-[100px]">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-[34px] self-stretch bg-customcyan p-[47px] md:p-5 sn:flex-col h-[180px]">
              <button
                onClick={handleButtonClick}
                className="p-5 cursor-pointer"
              >
                <img src="/images/backbtn.png" alt="arrowleft" />
              </button>
              <Text
                size="3xl"
                as="p"
                className="!font-open-sans mb-1 self-end tracking-[4.50px] !text-white sm:mb-0 sm:self-auto"
              >
                Amount to Pay
              </Text>
            </div>
            <div className="container-xs flex flex-col items-center px-[129px] md:p-5 md:px-5">
              <Text
                size="s"
                as="p"
                className="tracking-[2.50px] text-customgraybg font-open-sans"
              >
                Please select the months consecutively, starting from the
                nearest month
              </Text>
            </div>
          </div>
          <div>
            <div className="relative mt-[-35px] flex flex-col">
              {months
                .filter((month) => !month.isPaid)
                .map((month, index) => (
                  <PayNowButtonRowOne
                    key={index}
                    month={month.month}
                    dueDate={month.dueDate}
                    price={month.price}
                    onCheck={(checked) => handleMonthCheck(month.key, checked)}
                    isChecked={month.isChecked}
                  />
                ))}
            </div>
          </div>
          <div>
            <div className="fixed bottom-0 left-0 right-0 leading-normal flex flex-col items-center justify-center border border-solid border-gray-400 bg-gray-300 p-2.5 h-[130px]">
              <div className="flex w-91% flex-col items-end gap-0 md:w-full">
                <div className="flex w-32% flex-wrap items-center justify-end gap-5 md:w-full mt-[-20px]">
                  <Text
                    size="md"
                    as="p"
                    className="self-end tracking-2.50px text-black-900 mt-2 !font-open-sans"
                  >
                    Amount Payable:
                  </Text>
                  <Text
                    as="p"
                    className="tracking-3.00px !text-customcyan mt-2 !font-open-sans"
                  >
                    ₱ {amountPayable.toFixed(2)}
                  </Text>
                </div>
              </div>
              <div className="container-xs flex justify-center px-[164px] mt-2">
                {hasUnpaidMonths ? (
                  <Button
                    size="sm"
                    shape="square"
                    className="w-[946px] md:w-full h-[74px] tracking-[4.50px] md:text-[41px] sm:text-[35px] bg-customcyan !text-white !font-open-sans"
                    onClick={() => setShowPaymentMethodModal(true)}
                  >
                    Pay Now
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    shape="square"
                    className="w-[946px] md:w-full h-[74px] tracking-[4.50px] md:text-[41px] sm:text-[35px] bg-customcyan !text-white !font-open-sans"
                    onClick={() => setShowPaymentMethodModal(true)}
                  >
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentMethodModal && (
        <PaymentMethodModal
          onClose={() => setShowPaymentMethodModal(false)}
          onPaymentMethodSelect={handlePaymentMethodSelect}
        />
      )}

      {showCashPaymentModal && tenantId && (
        <CashPaymentModal
          tenantId={tenantId}
          amountPayable={amountPayable}
          selectedMonths={selectedMonths}
          onClose={() => handleModalClose()}
          onPaymentSuccess={(paidMonthKeys) =>
            handlePaymentSuccess(paidMonthKeys)
          }
        />
      )}
      {showGcashPaymentModalPage && tenantId && (
        <GcashPaymentModalPage
          tenantId={tenantId}
          amountPayable={amountPayable}
          selectedMonths={selectedMonths}
          onClose={() => handleModalClose()}
          onPaymentSuccess={(paidMonthKeys) =>
            handlePaymentSuccess(paidMonthKeys)
          }
        />
      )}
    </>
  );
};

export default PayNow;
