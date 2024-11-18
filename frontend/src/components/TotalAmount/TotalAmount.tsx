// calculateTotalAmount.ts

export const bill = [
  { description: "Monthly Rent", amount: 1500 },
  { description: "Electric Fan", amount: 100 },
  { description: "Laptop", amount: 100 },
];

export const totalAmount = bill.reduce((total, item) => total + item.amount, 0);


interface TotalAmountProps {
  total: number;
}

const TotalAmount: React.FC<TotalAmountProps> = ({ total }) => {
  return (
    <>
        {total.toFixed(2)}
    </>
  );
}

export default TotalAmount;
