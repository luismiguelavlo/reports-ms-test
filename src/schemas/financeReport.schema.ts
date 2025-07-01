import { z } from "zod";

// Schema para tabla de balance
const balanceTableRowSchema = z.object({
  bank: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountType: z.string().min(1, "Account type is required"),
  finalBalance: z.string().min(1, "Final balance is required"),
  percentVariation: z.string().min(1, "Percent variation is required"),
  porcentajeSaldo: z.string().min(1, "Balance percentage is required"),
});

const balanceTableSchema = z.object({
  header: z.string().min(1, "Table header is required"),
  table: z
    .array(balanceTableRowSchema)
    .min(1, "At least one balance record is required"),
});

// Schema para reporte de balance
const balanceReportSchema = z.object({
  header: z.string().min(1, "Balance report header is required"),
  tables: z
    .array(balanceTableSchema)
    .min(1, "At least one balance table is required"),
});

// Schema para tabla de ingresos
const incomeTableRowSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  detail: z.string().min(1, "Transaction detail is required"),
  income: z.string().min(1, "Income amount is required"),
  percentTotal: z.string().min(1, "Percent total is required"),
});

// Schema para tabla de gastos
const expenseTableRowSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  detail: z.string().min(1, "Transaction detail is required"),
  expense: z.string().min(1, "Expense amount is required"),
  percentTotal: z.string().min(1, "Percent total is required"),
});

// Schema para datos de gráfico de transacciones
const transactionDataSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  countExpense: z.number().int().min(0, "Expense count must be non-negative"),
  countIncome: z.number().int().min(0, "Income count must be non-negative"),
  expense: z.string().min(1, "Expense amount is required"),
  income: z.string().min(1, "Income amount is required"),
});

// Schema unificado para filas de tabla (ingresos o gastos)
const tableRowSchema = z
  .object({
    accountName: z.string().min(1, "Account name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    transactionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    detail: z.string().min(1, "Transaction detail is required"),
    income: z.string().min(1, "Income amount is required").optional(),
    expense: z.string().min(1, "Expense amount is required").optional(),
    percentTotal: z.string().min(1, "Percent total is required"),
  })
  .refine((data) => data.income || data.expense, {
    message: "Either income or expense must be provided",
  });

// Schema para resultados de ingresos y gastos
const incomeExpenseResultSchema = z
  .object({
    header: z.string().min(1, "Result header is required"),
    table: z.array(tableRowSchema).optional(),
    data: z.array(transactionDataSchema).optional(),
  })
  .refine((data) => data.table || data.data, {
    message: "Either table or data must be provided",
  });

// Schema para reporte de ingresos y gastos
const incomeExpensesReportSchema = z.object({
  header: z.string().min(1, "Income expenses report header is required"),
  results: z
    .array(incomeExpenseResultSchema)
    .min(1, "At least one result is required"),
});

// Schema para datos de rendimientos y costos por banco
const yieldCostDataSchema = z.object({
  bank: z.string().min(1, "Bank name is required"),
  yields: z.string().min(1, "Yields amount is required"),
  costs: z.string().min(1, "Costs amount is required"),
  netRevenue: z.string().min(1, "Net revenue is required"),
  netRevenueRate: z.string().min(1, "Net revenue rate is required"),
});

// Schema para tabla de rendimientos por cuenta
const yieldTableRowSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  yields: z.string().min(1, "Yields amount is required"),
  costs: z.string().min(1, "Costs amount is required"),
  netRevenue: z.string().min(1, "Net revenue is required"),
  netRevenueRate: z.string().min(1, "Net revenue rate is required"),
});

// Schema para resultados de rendimientos y costos
const yieldCostResultSchema = z
  .object({
    header: z.string().min(1, "Result header is required"),
    data: z.array(yieldCostDataSchema).optional(),
    table: z.array(yieldTableRowSchema).optional(),
  })
  .refine((data) => data.data || data.table, {
    message: "Either data or table must be provided",
  });

// Schema para reporte de rendimientos y costos
const yieldsCostsReportSchema = z.object({
  header: z.string().min(1, "Yields costs report header is required"),
  results: z
    .array(yieldCostResultSchema)
    .min(1, "At least one result is required"),
});

// Schema para predicciones
const predictionSchema = z.object({
  metric: z.enum(["income", "expense", "yield", "costs", "netRevenue"], {
    errorMap: () => ({
      message:
        "Metric must be one of: income, expense, yield, costs, netRevenue",
    }),
  }),
  "Jun-2025": z.string().min(1, "June prediction is required"),
  "Jul-2025": z.string().min(1, "July prediction is required"),
  "Ago-2025": z.string().min(1, "August prediction is required"),
  "Sep-2025": z.string().min(1, "September prediction is required"),
  "Oct-2025": z.string().min(1, "October prediction is required"),
  "Nov-2025": z.string().min(1, "November prediction is required"),
  precision: z.string().min(1, "Precision is required"),
});

// Schema para reporte de predicciones
const predictionsReportSchema = z.object({
  header: z.string().min(1, "Predictions report header is required"),
  predictions: z
    .array(predictionSchema)
    .min(1, "At least one prediction is required"),
});

// Schema para análisis por banco
const bankAnalysisSchema = z.object({
  bankId: z.string().min(1, "Bank ID is required"),
  bankName: z.string().min(1, "Bank name is required"),
  analysis: z.string().min(1, "Analysis is required"),
});

// Schema para respuesta de IA
const aiResponseSchema = z.object({
  positiveFindings: z
    .array(z.string().min(1, "Finding cannot be empty"))
    .min(1, "At least one positive finding is required"),
  negativeFindings: z
    .array(z.string().min(1, "Finding cannot be empty"))
    .min(1, "At least one negative finding is required"),
  insights: z
    .array(z.string().min(1, "Insight cannot be empty"))
    .min(1, "At least one insight is required"),
  recommendations: z
    .array(z.string().min(1, "Recommendation cannot be empty"))
    .min(1, "At least one recommendation is required"),
  bankAnalysis: z
    .array(bankAnalysisSchema)
    .min(1, "At least one bank analysis is required"),
});

// Schema principal del reporte financiero
export const financeReportSchema = z.object({
  reportHeader: z.string().min(1, "Report header is required"),
  balanceReport: balanceReportSchema,
  incomeExpensesReport: incomeExpensesReportSchema,
  yieldsCostsReport: yieldsCostsReportSchema,
  predictionsReport: predictionsReportSchema,
  aiResponse: aiResponseSchema,
});

// Tipos TypeScript derivados del schema
export type FinanceReportInput = z.infer<typeof financeReportSchema>;
export type BalanceTableRow = z.infer<typeof balanceTableRowSchema>;
export type IncomeTableRow = z.infer<typeof incomeTableRowSchema>;
export type ExpenseTableRow = z.infer<typeof expenseTableRowSchema>;
export type TableRow = z.infer<typeof tableRowSchema>;
export type TransactionData = z.infer<typeof transactionDataSchema>;
export type YieldCostData = z.infer<typeof yieldCostDataSchema>;
export type YieldTableRow = z.infer<typeof yieldTableRowSchema>;
export type Prediction = z.infer<typeof predictionSchema>;
export type BankAnalysis = z.infer<typeof bankAnalysisSchema>;
export type AIResponse = z.infer<typeof aiResponseSchema>;
