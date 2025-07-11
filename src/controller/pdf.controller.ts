import { Context } from "hono";
import { PDFService } from "../services/pdf.service.js";
import axios from "axios";
import { envs } from "../config/envs.js";
import { generateServiceToken } from "../config/encrypt-key.js";

export class PDFController {
  private pdfService: PDFService;

  constructor() {
    this.pdfService = new PDFService();
  }

  /**
   * Genera un PDF del reporte financiero
   * @param c - Contexto de Hono con datos validados
   * @returns Response con el PDF generado
   */
  async generateFinanceReport(c: Context) {
    const frequency = c.req.query("frequency") as
      | "monthly"
      | "quarterly"
      | "annual"
      | undefined;
    const year = c.req.query("year")
      ? parseInt(c.req.query("year") as string)
      : undefined;
    const month = c.req.query("month")
      ? parseInt(c.req.query("month") as string)
      : undefined;
    const quarter = c.req.query("quarter")
      ? parseInt(c.req.query("quarter") as string)
      : undefined;

    // Validar los parámetros si es necesario
    if (frequency && !["monthly", "quarterly", "annual"].includes(frequency)) {
      return c.json({ error: "Invalid frequency parameter" }, 400);
    }

    if (year && (year < 2000 || year > 2100)) {
      return c.json({ error: "Invalid year parameter" }, 400);
    }

    if (month && (month < 1 || month > 12)) {
      return c.json({ error: "Invalid month parameter" }, 400);
    }

    if (quarter && (quarter < 1 || quarter > 4)) {
      return c.json({ error: "Invalid quarter parameter" }, 400);
    }
    try {
      // Obtener datos validados del middleware
      const reportData = {
        reportHeader:
          "Reporte financiero FinTrace\n\nFecha de generación: 06/06/2025\n\nPeriodicidad: mensual\n\nPeriodo analizado:\n01/05/2025 - 31/05/2025\n",
        balanceReport: {
          header:
            "\nReporte de saldos:\nA continuación se presenta el resumen del saldo consolidado de 23 cuentas en 4 bancos y la respectiva variación porcentual respecto al periodo anterior:\n- Saldo final: $35,714,556,119.43 (treinta y cinco mil setecientos catorce millones quinientos cincuenta y seis mil ciento diecinueve)\n- Variación porcentual: 11.24%\n",
          tables: [
            {
              header:
                "En la siguiente tabla se presenta información de los saldos de las principales cuentas:",
              table: [
                {
                  bank: "BANCO DE OCCIDENTE",
                  accountNumber: "7795929886",
                  accountName: "BANCO DE OCCIDENTE Prueba 7795929886",
                  accountType: "AHORROS",
                  finalBalance: "$5,967,178,670",
                  percentVariation: "11.17%",
                  porcentajeSaldo: "16.71%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  accountNumber: "1651825769",
                  accountName: "BANCO DAVIVIENDA Prueba 1651825769",
                  accountType: "AHORROS",
                  finalBalance: "$5,404,969,742",
                  percentVariation: "66.27%",
                  porcentajeSaldo: "15.13%",
                },
                {
                  bank: "BANCO BBVA",
                  accountNumber: "4427215605",
                  accountName: "BANCO BBVA Prueba 4427215605",
                  accountType: "AHORROS",
                  finalBalance: "$5,156,608,190",
                  percentVariation: "-6.20%",
                  porcentajeSaldo: "14.44%",
                },
                {
                  bank: "BANCOLOMBIA",
                  accountNumber: "0559768962",
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountType: "AHORROS",
                  finalBalance: "$4,984,030,498",
                  percentVariation: "48.06%",
                  porcentajeSaldo: "13.96%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  accountNumber: "4959246307",
                  accountName: "BANCO DAVIVIENDA Prueba 4959246307",
                  accountType: "AHORROS",
                  finalBalance: "$4,963,016,512",
                  percentVariation: "35.13%",
                  porcentajeSaldo: "13.90%",
                },
              ],
            },
          ],
        },
        incomeExpensesReport: {
          header:
            "A continuación se presenta el resumen consolidado de ingresos, gastos y flujo de caja, con sus respectivas variaciones porcentuales, respecto al periodo anterior:\n- Ingresos: $28,936,170,246.55 (4.23%)\n- Gastos: $25,327,136,699.57 (-50.5%)\n- Flujo de caja: $3,609,033,546.98 (115.42%)\n",
          results: [
            {
              header:
                "En la siguiente tabla se presentan los ingresos más altos del periodo:",
              table: [
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  transactionDate: "2025-05-12",
                  detail: "Prestación de servicios",
                  income: "$6,498,600,182",
                  percentTotal: "22.46%",
                },
                {
                  accountName: "BANCO BBVA Prueba 4427215605",
                  accountNumber: "4427215605",
                  transactionDate: "2025-05-29",
                  detail: "Comisiones por ventas",
                  income: "$3,648,624,008",
                  percentTotal: "12.61%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  transactionDate: "2025-05-30",
                  detail: "Cobros de facturas",
                  income: "$2,817,909,093",
                  percentTotal: "9.74%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 2883237783",
                  accountNumber: "2883237783",
                  transactionDate: "2025-05-05",
                  detail: "Prestación de servicios",
                  income: "$2,425,523,229",
                  percentTotal: "8.38%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 2883237783",
                  accountNumber: "2883237783",
                  transactionDate: "2025-05-05",
                  detail: "Recaudos",
                  income: "$2,021,269,357",
                  percentTotal: "6.99%",
                },
              ],
            },
            {
              header:
                "En la siguiente tabla se presentan los gastos más altos del periodo:",
              table: [
                {
                  accountName: "BANCOLOMBIA Prueba 2883237783",
                  accountNumber: "2883237783",
                  transactionDate: "2025-05-12",
                  detail: "Retención en la fuente",
                  expense: "$6,468,061,943",
                  percentTotal: "25.54%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  transactionDate: "2025-05-12",
                  detail: "Publicidad y marketing",
                  expense: "$2,956,851,710",
                  percentTotal: "11.67%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  transactionDate: "2025-05-12",
                  detail: "Alquiler de oficinas",
                  expense: "$2,879,074,839",
                  percentTotal: "11.37%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  transactionDate: "2025-05-05",
                  detail: "Mantenimiento y reparaciones",
                  expense: "$2,436,975,068",
                  percentTotal: "9.62%",
                },
                {
                  accountName: "BANCO BBVA Prueba 4427215605",
                  accountNumber: "4427215605",
                  transactionDate: "2025-05-29",
                  detail: "Seguros",
                  expense: "$2,196,323,038",
                  percentTotal: "8.67%",
                },
              ],
            },
            {
              header:
                "En la siguiente gráfica se presentan las cuentas con mayor cantidad de transacciones:",
              data: [
                {
                  accountName: "BANCOLOMBIA Prueba 0559768962",
                  accountNumber: "0559768962",
                  countExpense: 149,
                  countIncome: 25,
                  expense: "$10,198,510,535",
                  income: "$11,816,280,128",
                },
                {
                  accountName: "BANCO DAVIVIENDA Prueba 4484052696",
                  accountNumber: "4484052696",
                  countExpense: 59,
                  countIncome: 4,
                  expense: "$820,953,970",
                  income: "$740,130,519",
                },
                {
                  accountName: "BANCO BBVA Prueba 4427215605",
                  accountNumber: "4427215605",
                  countExpense: 48,
                  countIncome: 15,
                  expense: "$4,017,416,249",
                  income: "$3,676,348,958",
                },
                {
                  accountName: "BANCO DE OCCIDENTE Prueba 4306843983",
                  accountNumber: "4306843983",
                  countExpense: 21,
                  countIncome: 30,
                  expense: "$2,435,403,272",
                  income: "$2,790,058,803",
                },
                {
                  accountName: "BANCO BBVA Prueba 9974833604",
                  accountNumber: "9974833604",
                  countExpense: 16,
                  countIncome: 5,
                  expense: "$49,604,193",
                  income: "$213,017,183",
                },
              ],
            },
          ],
        },
        yieldsCostsReport: {
          header:
            "A continuación se presenta el resumen consolidado de rendimientos y costos para el periodo analizado:\n- Rendimientos: $101,207,578.89\n- Costos: $51,233,991.65\n- Rentabilidad neta: $49,973,587.24\n",
          results: [
            {
              header:
                "En la siguiente gráfica se presentan los rendimientos y costos por banco:",
              data: [
                {
                  bank: "BANCO DE OCCIDENTE",
                  yields: "$35,668,005",
                  costs: "$1,611,158",
                  netRevenue: "$34,056,847",
                  netRevenueRate: "2.00%",
                },
                {
                  bank: "BANCO BBVA",
                  yields: "$37,030,206",
                  costs: "$17,531,220",
                  netRevenue: "$19,498,986",
                  netRevenueRate: "0.99%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  yields: "$9,400,944",
                  costs: "$1,187,292",
                  netRevenue: "$8,213,652",
                  netRevenueRate: "0.30%",
                },
                {
                  bank: "BANCOLOMBIA",
                  yields: "$19,108,424",
                  costs: "$30,904,322",
                  netRevenue: "-$11,795,898",
                  netRevenueRate: "-1.47%",
                },
                {
                  bank: "BANCO DE OCCIDENTE",
                  yields: "$35,668,005",
                  costs: "$1,611,158",
                  netRevenue: "$34,056,847",
                  netRevenueRate: "2.00%",
                },
                {
                  bank: "BANCO BBVA",
                  yields: "$37,030,206",
                  costs: "$17,531,220",
                  netRevenue: "$19,498,986",
                  netRevenueRate: "0.99%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  yields: "$9,400,944",
                  costs: "$1,187,292",
                  netRevenue: "$8,213,652",
                  netRevenueRate: "0.30%",
                },
                {
                  bank: "BANCOLOMBIA",
                  yields: "$19,108,424",
                  costs: "$30,904,322",
                  netRevenue: "-$11,795,898",
                  netRevenueRate: "-1.47%",
                },
                {
                  bank: "BANCO DE OCCIDENTE",
                  yields: "$35,668,005",
                  costs: "$1,611,158",
                  netRevenue: "$34,056,847",
                  netRevenueRate: "2.00%",
                },
                {
                  bank: "BANCO BBVA",
                  yields: "$37,030,206",
                  costs: "$17,531,220",
                  netRevenue: "$19,498,986",
                  netRevenueRate: "0.99%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  yields: "$9,400,944",
                  costs: "$1,187,292",
                  netRevenue: "$8,213,652",
                  netRevenueRate: "0.30%",
                },
                {
                  bank: "BANCOLOMBIA",
                  yields: "$19,108,424",
                  costs: "$30,904,322",
                  netRevenue: "-$11,795,898",
                  netRevenueRate: "-1.47%",
                },
                {
                  bank: "BANCO DAVIVIENDA",
                  yields: "$9,400,944",
                  costs: "$1,187,292",
                  netRevenue: "$8,213,652",
                  netRevenueRate: "0.30%",
                },
                {
                  bank: "BANCOLOMBIA",
                  yields: "$19,108,424",
                  costs: "$30,904,322",
                  netRevenue: "-$11,795,898",
                  netRevenueRate: "-1.47%",
                },
              ],
            },
            {
              header:
                "En la siguiente tabla se presentan las cuentas con mejores tasas de rentabilidad neta:",
              table: [
                {
                  accountName: "BANCOLOMBIA Prueba 2883237783",
                  accountNumber: "2883237783",
                  yields: "$15,085,435",
                  costs: "$0",
                  netRevenue: "$15,085,435",
                  netRevenueRate: "4.02%",
                },
                {
                  accountName: "BANCO DE OCCIDENTE Prueba 7795929886",
                  accountNumber: "7795929886",
                  yields: "$35,652,605",
                  costs: "$9,983",
                  netRevenue: "$35,642,622",
                  netRevenueRate: "0.60%",
                },
                {
                  accountName: "BANCO DE OCCIDENTE Prueba 5417890089",
                  accountNumber: "5417890089",
                  yields: "$9,829",
                  costs: "$0",
                  netRevenue: "$9,829",
                  netRevenueRate: "0.55%",
                },
                {
                  accountName: "BANCO BBVA Prueba 7809134482",
                  accountNumber: "7809134482",
                  yields: "$14,762,814",
                  costs: "$1,440,237",
                  netRevenue: "$13,322,576",
                  netRevenueRate: "0.36%",
                },
                {
                  accountName: "BANCO BBVA Prueba 4427215605",
                  accountNumber: "4427215605",
                  yields: "$22,201,266",
                  costs: "$15,893,355",
                  netRevenue: "$6,307,911",
                  netRevenueRate: "0.12%",
                },
                {
                  accountName: "BANCO DAVIVIENDA Prueba 1651825769",
                  accountNumber: "1651825769",
                  yields: "$4,749,892",
                  costs: "$0",
                  netRevenue: "$4,749,892",
                  netRevenueRate: "0.09%",
                },
                {
                  accountName: "BANCO DAVIVIENDA Prueba 4959246307",
                  accountNumber: "4959246307",
                  yields: "$4,637,406",
                  costs: "$0",
                  netRevenue: "$4,637,406",
                  netRevenueRate: "0.09%",
                },
                {
                  accountName: "BANCO BBVA Prueba 5627829388",
                  accountNumber: "5627829388",
                  yields: "$56,539",
                  costs: "$0",
                  netRevenue: "$56,539",
                  netRevenueRate: "0.04%",
                },
                {
                  accountName: "BANCO BBVA Prueba 0629682496",
                  accountNumber: "0629682496",
                  yields: "$9,587",
                  costs: "$0",
                  netRevenue: "$9,587",
                  netRevenueRate: "0.01%",
                },
                {
                  accountName: "BANCOLOMBIA Prueba 3526402628",
                  accountNumber: "3526402628",
                  yields: "$6,219",
                  costs: "$0",
                  netRevenue: "$6,219",
                  netRevenueRate: "0.01%",
                },
              ],
            },
          ],
        },
        predictionsReport: {
          header:
            "A continuación se presentan las predicciones para periodos futuros, basadas en el comportamiento histórico de los datos.\n*Tenga en cuenta que las predicciones son estimaciones y no garantizan resultados exactos, aún con un alto nivel de precisión.\n\n{predictions}\n",
          predictions: [
            {
              metric: "income",
              "Jun-2025": "$21,106,507,776",
              "Jul-2025": "$19,566,114,816",
              "Ago-2025": "$19,973,058,560",
              "Sep-2025": "$19,633,068,032",
              "Oct-2025": "$20,427,995,136",
              "Nov-2025": "$20,474,091,520",
              precision: "92.53%",
            },
            {
              metric: "expense",
              "Jun-2025": "$24,261,120,000",
              "Jul-2025": "$28,278,865,920",
              "Ago-2025": "$28,251,734,016",
              "Sep-2025": "$28,460,195,840",
              "Oct-2025": "$28,470,474,752",
              "Nov-2025": "$28,736,411,648",
              precision: "88.88%",
            },
            {
              metric: "yield",
              "Jun-2025": "$153,415,184",
              "Jul-2025": "$152,941,648",
              "Ago-2025": "$154,910,768",
              "Sep-2025": "$154,392,640",
              "Oct-2025": "$157,177,120",
              "Nov-2025": "$165,440,736",
              precision: "88.64%",
            },
            {
              metric: "costs",
              "Jun-2025": "$31,310,912",
              "Jul-2025": "$28,524,020",
              "Ago-2025": "$28,198,078",
              "Sep-2025": "$29,171,670",
              "Oct-2025": "$29,682,022",
              "Nov-2025": "$29,886,610",
              precision: "78.30%",
            },
            {
              metric: "netRevenue",
              "Jun-2025": "$81,898,544",
              "Jul-2025": "$93,685,168",
              "Ago-2025": "$97,548,720",
              "Sep-2025": "$91,711,600",
              "Oct-2025": "$102,905,880",
              "Nov-2025": "$135,073,168",
              precision: "79.38%",
            },
          ],
        },
        aiResponse: {
          positiveFindings: [
            "El saldo consolidado creció 11.24% respecto al periodo anterior, alcanzando $35,714,556,119.43, lo que refleja una sólida posición de liquidez.",
            "El flujo de caja consolidado fue positivo y se incrementó 115.42%, impulsado por una reducción significativa de los gastos (-50.5%).",
            "Varias cuentas principales, como BANCO DAVIVIENDA Prueba 1651825769 y BANCOLOMBIA Prueba 0559768962, presentaron crecimientos de saldo superiores al 35%.",
            "El rendimiento neto consolidado fue positivo ($49,973,587.24), con BANCO DE OCCIDENTE liderando en rentabilidad neta y tasa de rentabilidad.",
          ],
          negativeFindings: [
            "BANCOLOMBIA presentó una rentabilidad neta negativa (-$11,795,898), afectada por altos costos operativos ($30,904,322).",
            "Algunas cuentas, como BANCO BBVA Prueba 4427215605, mostraron disminución de saldo (-6.20%) y baja rentabilidad neta (0.12%).",
            "Los gastos más altos estuvieron concentrados en retención en la fuente, publicidad y alquiler, impactando el flujo de caja de BANCOLOMBIA.",
            "Las predicciones muestran que los gastos superarán consistentemente a los ingresos en los próximos meses, lo que podría presionar la liquidez.",
          ],
          insights: [
            "El crecimiento del saldo consolidado se explica principalmente por el aumento de ingresos y la fuerte reducción de gastos en el periodo.",
            "Las cuentas con mayor actividad transaccional (BANCOLOMBIA Prueba 0559768962) concentran tanto ingresos como egresos significativos, lo que las hace críticas para la gestión de liquidez.",
            "La rentabilidad neta varía considerablemente entre bancos, destacando la eficiencia de BANCO DE OCCIDENTE frente a los altos costos de BANCOLOMBIA.",
            "La concentración de gastos en conceptos no operativos (retención, publicidad, alquiler) sugiere oportunidades de optimización en la estructura de costos.",
          ],
          recommendations: [
            "Revisar y renegociar los principales rubros de gasto, especialmente en BANCOLOMBIA, para reducir costos operativos y mejorar la rentabilidad.",
            "Redistribuir fondos hacia cuentas y bancos con mejor desempeño en rentabilidad neta, como BANCO DE OCCIDENTE y cuentas específicas de BANCOLOMBIA con alta tasa de rentabilidad.",
            "Implementar controles y seguimiento sobre los gastos recurrentes de alto impacto, priorizando la eficiencia en publicidad, alquiler y mantenimiento.",
            "Monitorear de cerca las proyecciones de ingresos y gastos para anticipar posibles déficits de liquidez y tomar medidas preventivas.",
          ],
          bankAnalysis: [
            {
              bankId: "8000378008",
              bankName: "BANCO AGRARIO",
              analysis:
                "Presenta una rentabilidad neta positiva aunque baja (0.17%), con rendimientos y costos operativos mínimos. Su impacto en el consolidado es marginal, pero estable.",
            },
            {
              bankId: "8600358275",
              bankName: "BANCO AV VILLAS",
              analysis:
                "No se reportan datos destacados de rentabilidad o costos, lo que sugiere un bajo volumen de operaciones o impacto financiero menor en el periodo.",
            },
            {
              bankId: "8600030201",
              bankName: "BANCO BBVA",
              analysis:
                "A pesar de altos saldos y volumen de transacciones, presenta rentabilidad neta negativa (-1.05%) debido a costos operativos elevados. Requiere revisión de condiciones y optimización de costos.",
            },
            {
              bankId: "8600345941",
              bankName: "BANCO COLPATRIA",
              analysis:
                "Rentabilidad neta positiva aunque baja (0.39%), con rendimientos y costos bajos. Su contribución al consolidado es limitada pero eficiente.",
            },
            {
              bankId: "8600343137",
              bankName: "BANCO DAVIVIENDA",
              analysis:
                "Rentabilidad neta positiva (0.3%) y crecimiento significativo en saldos, especialmente en cuentas de ahorros. Buen desempeño general, aunque con margen de mejora en eficiencia de costos.",
            },
            {
              bankId: "8600029644",
              bankName: "BANCO DE BOGOTA",
              analysis:
                "Rentabilidad neta positiva (2.15%), la más alta entre los bancos principales. Costos operativos bajos y rendimientos adecuados, lo que lo posiciona como un banco eficiente en el portafolio.",
            },
            {
              bankId: "8903002794",
              bankName: "BANCO DE OCCIDENTE",
              analysis:
                "Rentabilidad neta positiva (2.03%) y alto saldo final, con crecimiento relevante. Destaca por su eficiencia y generación de rendimientos, siendo uno de los bancos más sólidos del periodo.",
            },
            {
              bankId: "8600077389",
              bankName: "BANCO POPULAR",
              analysis:
                "Rentabilidad neta negativa (-1.67%) debido a costos operativos elevados frente a los rendimientos. Requiere acciones correctivas para mejorar su desempeño financiero.",
            },
            {
              bankId: "8600507501",
              bankName: "BANCO SUDAMERIS",
              analysis:
                "No se reportan datos destacados de rentabilidad o costos, lo que indica un impacto financiero menor o bajo volumen de operaciones en el periodo.",
            },
            {
              bankId: "8909039388",
              bankName: "BANCOLOMBIA",
              analysis:
                "Rentabilidad neta negativa (-1.94%) por altos costos operativos, a pesar de manejar altos volúmenes de ingresos y egresos. Es necesario revisar la estructura de costos y optimizar la gestión de fondos en este banco.",
            },
          ],
        },
      };

      // Generar PDF usando el service
      const pdfBuffer = await this.pdfService.generateFinanceReportPDF(
        reportData
      );

      // Generar nombre del archivo
      const fileName = this.pdfService.generateFileName(reportData);

      // Configurar headers para descarga
      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="${fileName}"`);

      console.log("enviando pdf........................");

      return c.body(pdfBuffer);
    } catch (error) {
      console.error("Error in PDF controller:", error);

      return c.json(
        {
          success: false,
          error: "Internal server error",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        500
      );
    }
  }

  async getData(c: Context) {
    const clientId = c.req.param("clientId");

    const token = await generateServiceToken(
      { service: "ia-ms" },
      envs.SECRET_AES_IA_MS,
      envs.SECRET_JWT_IA_MS
    );

    const headers = token ? { "x-token": token } : {};

    const response = await axios.get(
      `${envs.FINTRACE_API_IA_MS_URL}/report/${clientId}`,
      { headers }
    );

    console.log("response", response);

    return c.json({ data: response.data });
  }
}

// Instancia singleton del controlador
export const pdfController = new PDFController();
