export type Balance = {
  userId: string;
  amount: number; // positive means they are owed money, negative means they owe money
};

export type CalculatedSettlement = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export function calculateSettlements(balances: Balance[]): CalculatedSettlement[] {
  const creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount); // most negative first

  const settlements: CalculatedSettlement[] = [];

  let i = 0; // creditors index
  let j = 0; // debtors index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amountToSettle = Math.min(creditor.amount, Math.abs(debtor.amount));

    if (amountToSettle > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Number(amountToSettle.toFixed(2)),
      });
    }

    creditor.amount -= amountToSettle;
    debtor.amount += amountToSettle;

    if (Math.abs(creditor.amount) < 0.01) i++;
    if (Math.abs(debtor.amount) < 0.01) j++;
  }

  return settlements;
}

export function calculateEqualSplits(totalAmount: number, userIds: string[]) {
    if (userIds.length === 0) return [];
    
    const splitAmount = Number((totalAmount / userIds.length).toFixed(2));
    const splits = userIds.map(userId => ({
        userId,
        amountOwed: splitAmount
    }));

    // Adjust for rounding errors
    const totalSplit = splitAmount * userIds.length;
    const difference = Number((totalAmount - totalSplit).toFixed(2));
    
    if (Math.abs(difference) > 0) {
        splits[0].amountOwed = Number((splits[0].amountOwed + difference).toFixed(2));
    }

    return splits;
}
