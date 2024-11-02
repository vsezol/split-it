export type Person = {
  name: string;
  paid: number;
};

export function calculateTransfers(
  people: Person[]
): { from: string; to: string; amount: number }[] {
  const totalAmount = people.reduce((sum, person) => sum + person.paid, 0);
  const equalShare = totalAmount / people.length;

  // Расчёт долга или переплаты для каждого человека
  const balances = people.map((person) => ({
    name: person.name,
    balance: person.paid - equalShare,
  }));

  // Разделяем тех, кто должен получить деньги (creditors) и тех, кто должен заплатить (debtors)
  const creditors = balances.filter((person) => person.balance > 0);
  const debtors = balances.filter((person) => person.balance < 0);

  const transfers: { from: string; to: string; amount: number }[] = [];

  // Выполняем переводы от должников к кредиторам
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const transferAmount = Math.min(-debtor.balance, creditor.balance);

    transfers.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(transferAmount * 100) / 100,
    });

    debtor.balance += transferAmount;
    creditor.balance -= transferAmount;

    // Переход к следующему должнику или кредитору, если баланс обнулён
    if (debtor.balance === 0) i++;
    if (creditor.balance === 0) j++;
  }

  return transfers;
}
