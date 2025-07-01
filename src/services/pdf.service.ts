import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";
import { chromiumConfig } from "../config/chromium.config.js";
import { FinanceReportInput } from "../schemas/financeReport.schema.js";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Interfaz para datos parseados del header del reporte
interface ParsedReportHeader {
  generationDate: string;
  periodicity: string;
  analysisPeriod: string;
}

// Interfaz para datos parseados de ingresos y gastos
interface ParsedIncomeExpensesData {
  income: string;
  income_variation: string;
  expenses: string;
  expenses_variation: string;
  cash_flow: string;
  cash_flow_variation: string;
}

export class PDFService {
  private static readonly TEMPLATE_PATH = resolve(
    process.cwd(),
    process.env.NODE_ENV === "development" ? "src/template" : "template",
    "template.html"
  );

  /**
   * Genera un PDF a partir de los datos del reporte financiero
   * @param reportData - Datos validados del reporte financiero
   * @returns Buffer del PDF generado
   */
  async generateFinanceReportPDF(
    reportData: FinanceReportInput
  ): Promise<Buffer> {
    try {
      // Leer el template HTML
      const htmlTemplate = this.loadTemplate();

      // Procesar los datos y generar HTML
      const htmlContent = this.processTemplate(htmlTemplate, reportData);

      // Generar PDF usando Puppeteer
      const pdfBuffer = await this.renderPDF(htmlContent);

      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Carga el template HTML desde el archivo
   * @returns Contenido del template HTML
   */
  private loadTemplate(): string {
    try {
      console.log(`Loading template from: ${PDFService.TEMPLATE_PATH}`);
      const template = readFileSync(PDFService.TEMPLATE_PATH, "utf-8");
      console.log(`Template loaded successfully, length: ${template.length}`);
      return template;
    } catch (error) {
      console.error(
        `Failed to load template from ${PDFService.TEMPLATE_PATH}:`,
        error
      );
      throw new Error(
        `Failed to load template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extrae información específica del header del reporte
   * @param reportHeader - Header del reporte con información estructurada
   * @returns Objeto con datos parseados del header
   */
  private parseReportHeader(reportHeader: string): ParsedReportHeader {
    try {
      // Valores por defecto en caso de no encontrar la información
      const defaultValues: ParsedReportHeader = {
        generationDate: new Date().toLocaleDateString("es-ES"),
        periodicity: "No especificada",
        analysisPeriod: "No especificado",
      };

      // Patrones de regex mejorados basados en el formato real de los datos
      const patterns = {
        generationDate: /Fecha de generación:\s*([^\n]+)/i,
        periodicity: /Periodicidad:\s*([^\n]+)/i,
        analysisPeriod: /Periodo analizado:\s*\n([^\n]+)/i, // Sin tilde en "Periodo"
      };

      const parsedData: ParsedReportHeader = { ...defaultValues };

      // Extraer fecha de generación
      const dateMatch = reportHeader.match(patterns.generationDate);
      if (dateMatch && dateMatch[1]) {
        parsedData.generationDate = dateMatch[1].trim();
      }

      // Extraer periodicidad
      const periodicityMatch = reportHeader.match(patterns.periodicity);
      if (periodicityMatch && periodicityMatch[1]) {
        parsedData.periodicity = periodicityMatch[1].trim();
      }

      // Extraer período analizado (puede tener formato especial)
      const periodMatch = reportHeader.match(patterns.analysisPeriod);
      if (periodMatch && periodMatch[1]) {
        parsedData.analysisPeriod = periodMatch[1].trim();
      }

      return parsedData;
    } catch (error) {
      console.warn("Error parsing report header:", error);
      // Retornar valores por defecto en caso de error
      return {
        generationDate: new Date().toLocaleDateString("es-ES"),
        periodicity: "No especificada",
        analysisPeriod: "No especificado",
      };
    }
  }

  /**
   * Extrae información del reporte de balances
   * @param balanceReport - Reporte de balances
   * @returns Objeto con datos calculados del balance
   */
  private parseBalanceData(balanceReport: FinanceReportInput["balanceReport"]) {
    try {
      // Calcular el número total de cuentas
      const totalAccounts = balanceReport.tables.reduce((total, table) => {
        return total + table.table.length;
      }, 0);

      // Obtener bancos únicos
      const uniqueBanks = new Set<string>();
      balanceReport.tables.forEach((table) => {
        table.table.forEach((row) => {
          uniqueBanks.add(row.bank);
        });
      });

      // Extraer datos del header del balance usando regex mejoradas
      const balanceHeader = balanceReport.header;

      // Patrones basados en el formato real: "- Saldo final: $35,714,556,119.43"
      const finalBalanceMatch = balanceHeader.match(
        /-\s*Saldo final:\s*([^\n]+)/i
      );

      // Patrón para: "- Variación porcentual: 11.24%"
      const variationMatch = balanceHeader.match(
        /-\s*Variación porcentual:\s*([^\n]+)/i
      );

      // También extraer conteos del texto cuando estén disponibles
      const accountCountMatch = balanceHeader.match(
        /(\d+)\s+cuentas\s+en\s+(\d+)\s+bancos/i
      );

      return {
        accountCount: accountCountMatch
          ? accountCountMatch[1]
          : totalAccounts.toString(),
        bankCount: accountCountMatch
          ? accountCountMatch[2]
          : uniqueBanks.size.toString(),
        finalBalance: finalBalanceMatch
          ? finalBalanceMatch[1].trim()
          : "No disponible",
        finalBalanceWords: "", // Podría implementarse la conversión a palabras si es necesario
        percentageVariation: variationMatch
          ? variationMatch[1].trim()
          : "No disponible",
      };
    } catch (error) {
      console.warn("Error parsing balance data:", error);
      return {
        accountCount: "0",
        bankCount: "0",
        finalBalance: "No disponible",
        finalBalanceWords: "",
        percentageVariation: "No disponible",
      };
    }
  }

  /**
   * Extrae información del reporte de ingresos y gastos
   * @param incomeExpensesHeader - Header del reporte de ingresos y gastos
   * @returns Objeto con datos parseados de ingresos, gastos y flujo de caja
   */
  private parseIncomeExpensesData(
    incomeExpensesHeader: string
  ): ParsedIncomeExpensesData {
    try {
      // Valores por defecto en caso de no encontrar la información
      const defaultValues: ParsedIncomeExpensesData = {
        income: "No disponible",
        income_variation: "0%",
        expenses: "No disponible",
        expenses_variation: "0%",
        cash_flow: "No disponible",
        cash_flow_variation: "0%",
      };

      // Patrones de regex para extraer datos del formato:
      // "- Ingresos: $28,936,170,246.55 (4.23%)"
      // "- Gastos: $25,327,136,699.57 (-50.5%)"
      // "- Flujo de caja: $3,609,033,546.98 (115.42%)"
      const patterns = {
        income: /-\s*Ingresos:\s*([^(]+)\s*\(([^)]+)\)/i,
        expenses: /-\s*Gastos:\s*([^(]+)\s*\(([^)]+)\)/i,
        cashFlow: /-\s*Flujo de caja:\s*([^(]+)\s*\(([^)]+)\)/i,
      };

      const parsedData: ParsedIncomeExpensesData = { ...defaultValues };

      // Extraer ingresos y su variación
      const incomeMatch = incomeExpensesHeader.match(patterns.income);
      if (incomeMatch && incomeMatch[1] && incomeMatch[2]) {
        parsedData.income = incomeMatch[1].trim();
        parsedData.income_variation = incomeMatch[2].trim();
      }

      // Extraer gastos y su variación
      const expensesMatch = incomeExpensesHeader.match(patterns.expenses);
      if (expensesMatch && expensesMatch[1] && expensesMatch[2]) {
        parsedData.expenses = expensesMatch[1].trim();
        parsedData.expenses_variation = expensesMatch[2].trim();
      }

      // Extraer flujo de caja y su variación
      const cashFlowMatch = incomeExpensesHeader.match(patterns.cashFlow);
      if (cashFlowMatch && cashFlowMatch[1] && cashFlowMatch[2]) {
        parsedData.cash_flow = cashFlowMatch[1].trim();
        parsedData.cash_flow_variation = cashFlowMatch[2].trim();
      }

      return parsedData;
    } catch (error) {
      console.warn("Error parsing income/expenses data:", error);
      // Retornar valores por defecto en caso de error
      return {
        income: "No disponible",
        income_variation: "0%",
        expenses: "No disponible",
        expenses_variation: "0%",
        cash_flow: "No disponible",
        cash_flow_variation: "0%",
      };
    }
  }

  /**
   * Procesa el template HTML reemplazando variables con datos del reporte
   * @param template - Template HTML
   * @param data - Datos del reporte financiero
   * @returns HTML procesado
   */
  private processTemplate(template: string, data: FinanceReportInput): string {
    let htmlContent = template;

    // Parsear datos del header del reporte
    const parsedHeader = this.parseReportHeader(data.reportHeader);

    // Parsear datos del balance
    const balanceData = this.parseBalanceData(data.balanceReport);

    // Parsear datos de ingresos y gastos
    const incomeExpensesData = this.parseIncomeExpensesData(
      data.incomeExpensesReport.header
    );

    // Parsear datos de rendimientos y costos
    const yieldsCostsData = this.parseYieldsCostsData(
      data.yieldsCostsReport.header
    );

    // Generar tabla de balances
    const balanceTableHTML = this.generateBalanceTable(data.balanceReport);

    // Generar tabla de ingresos
    const incomeTableHTML = this.generateIncomeTable(data.incomeExpensesReport);

    // Generar tabla de gastos
    const expenseTableHTML = this.generateExpenseTable(
      data.incomeExpensesReport
    );

    // Generar tabla de rendimientos y costos
    const yieldsCostsTableHTML = this.generateYieldsCostsTable(
      data.yieldsCostsReport
    );

    // Generar tarjetas de análisis por banco
    const bankAnalysisCardsHTML = this.generateBankAnalysisCards(
      data.aiResponse.bankAnalysis
    );

    // Reemplazar variables básicas
    const basicVariables = {
      reportHeader: data.reportHeader,
      balanceHeader: data.balanceReport.header,
      incomeExpensesHeader: data.incomeExpensesReport.header,
      yieldsHeader: data.yieldsCostsReport.header,
      predictionsHeader: data.predictionsReport.header,
      fecha: new Date().toLocaleDateString("es-ES"),
      periodo: parsedHeader.analysisPeriod, // Alias para compatibilidad
      balanceTable: balanceTableHTML, // Agregar tabla generada
      incomeTable: incomeTableHTML, // Agregar tabla de ingresos
      expenseTable: expenseTableHTML, // Agregar tabla de gastos
      yieldsCostsTable: yieldsCostsTableHTML, // Agregar tabla de rendimientos y costos
      bankAnalysisCards: bankAnalysisCardsHTML, // Agregar tarjetas de análisis por banco
      // Agregar datos parseados del header
      ...parsedHeader,
      // Agregar datos del balance
      ...balanceData,
      // Agregar datos de ingresos y gastos
      ...incomeExpensesData,
      // Agregar datos de rendimientos y costos
      ...yieldsCostsData,
    };

    // Reemplazar variables básicas
    Object.entries(basicVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      htmlContent = htmlContent.replace(regex, String(value));
    });

    // Procesar datos específicos para gráficos
    htmlContent = this.processChartData(htmlContent, data);

    // Procesar datos específicos para gráfico de predicciones
    htmlContent = this.processPredictionsChartData(htmlContent, data);

    // Procesar insights de AI Response
    htmlContent = this.processAIInsights(htmlContent, data);

    // Procesar observaciones importantes (positiveFindings y negativeFindings)
    htmlContent = this.processImportantObservations(htmlContent, data);

    return htmlContent;
  }

  /**
   * Procesa datos para gráficos
   * @param html - HTML content
   * @param data - Datos del reporte
   * @returns HTML con datos de gráficos procesados
   */
  private processChartData(html: string, data: FinanceReportInput): string {
    // Buscar datos para gráfico de ingresos y egresos
    const chartData = data.incomeExpensesReport.results.find(
      (r) => r.data && r.header.includes("gráfica")
    );

    if (chartData?.data) {
      // Procesar datos para la gráfica de barras horizontales (valores monetarios)
      const yAxisData: string[] = [];
      const incomeData: number[] = [];
      const expenseData: number[] = [];

      // Procesar datos para la segunda gráfica (número de transacciones)
      const yAxisData2: string[] = [];
      const incomeCountData: number[] = [];
      const expenseCountData: number[] = [];

      chartData.data.forEach((account) => {
        // Crear etiqueta resumida para el eje Y - primeros 12 caracteres + ...
        const bankName =
          account.accountName.length > 12
            ? account.accountName.substring(0, 12) + "..."
            : account.accountName;
        const lastFour = account.accountNumber.slice(-4);
        const label = `${bankName}\n...${lastFour}`;

        // Para la primera gráfica (valores monetarios)
        yAxisData.push(label);
        const income = this.parseMoneyString(account.income);
        const expense = this.parseMoneyString(account.expense);
        incomeData.push(income);
        expenseData.push(-expense); // Negativos para mostrar hacia la izquierda

        // Para la segunda gráfica (número de transacciones)
        yAxisData2.push(label);
        incomeCountData.push(account.countIncome);
        expenseCountData.push(-account.countExpense); // Negativos para mostrar hacia la izquierda
      });

      // Reemplazar variables en el HTML para la primera gráfica
      html = html.replace(/{{yAxisData}}/g, JSON.stringify(yAxisData));
      html = html.replace(/{{incomeData}}/g, JSON.stringify(incomeData));
      html = html.replace(/{{expenseData}}/g, JSON.stringify(expenseData));

      // Reemplazar variables en el HTML para la segunda gráfica
      html = html.replace(/{{yAxisData2}}/g, JSON.stringify(yAxisData2));
      html = html.replace(
        /{{incomeCountData}}/g,
        JSON.stringify(incomeCountData)
      );
      html = html.replace(
        /{{expenseCountData}}/g,
        JSON.stringify(expenseCountData)
      );
    }

    // Procesar datos para la tercera gráfica (rendimientos y costos por banco)
    const yieldsChartData = data.yieldsCostsReport.results.find(
      (r) => r.data && r.header.includes("gráfica")
    );

    if (yieldsChartData?.data) {
      const bankNames: string[] = [];
      const yieldsData: number[] = [];
      const costsData: number[] = [];

      yieldsChartData.data.forEach((bank) => {
        // Procesar nombre del banco - primeros 12 caracteres + "..."
        const bankName =
          bank.bank.length > 12
            ? bank.bank.substring(0, 12) + "..."
            : bank.bank;
        bankNames.push(bankName);

        // Convertir yields y costs a números
        const yields = this.parseMoneyString(bank.yields);
        const costs = this.parseMoneyString(bank.costs);

        yieldsData.push(yields);
        costsData.push(costs);
      });

      // Determinar la clase CSS basada en la cantidad de bancos
      const chartClass =
        bankNames.length <= 4
          ? "chart-container-yields-small"
          : "chart-container-yields-large";

      // Reemplazar variables en el HTML para la tercera gráfica
      html = html.replace(/{{bankNames}}/g, JSON.stringify(bankNames));
      html = html.replace(/{{yieldsData}}/g, JSON.stringify(yieldsData));
      html = html.replace(/{{costsData}}/g, JSON.stringify(costsData));
      html = html.replace(/{{yieldsChartClass}}/g, chartClass);

      // Procesar datos para la cuarta gráfica (rentabilidad neta por banco)
      const netRevenueBankNames: string[] = [];
      const positiveNetRevenueData: (number | null)[] = [];
      const negativeNetRevenueData: (number | null)[] = [];

      yieldsChartData.data.forEach((bank) => {
        // Procesar nombre del banco con rentabilidad neta - primeros 12 caracteres + "..."
        const bankName =
          bank.bank.length > 12
            ? bank.bank.substring(0, 12) + "..."
            : bank.bank;

        // Agregar información de rentabilidad neta al nombre
        const netRevenue = bank.netRevenue;
        const bankNameWithRevenue = `${bankName}\n${netRevenue}`;
        netRevenueBankNames.push(bankNameWithRevenue);

        // Convertir netRevenueRate a número (eliminar % y convertir)
        const rate = parseFloat(bank.netRevenueRate.replace("%", ""));

        // Separar valores positivos y negativos
        if (rate >= 0) {
          positiveNetRevenueData.push(rate);
          negativeNetRevenueData.push(null);
        } else {
          positiveNetRevenueData.push(null);
          negativeNetRevenueData.push(rate);
        }
      });

      // Determinar la clase CSS para la cuarta gráfica
      const netRevenueChartClass =
        netRevenueBankNames.length <= 4
          ? "chart-container-yields-small"
          : "chart-container-yields-large";

      // Reemplazar variables en el HTML para la cuarta gráfica
      html = html.replace(
        /{{netRevenueBankNames}}/g,
        JSON.stringify(netRevenueBankNames)
      );
      html = html.replace(
        /{{positiveNetRevenueData}}/g,
        JSON.stringify(positiveNetRevenueData)
      );
      html = html.replace(
        /{{negativeNetRevenueData}}/g,
        JSON.stringify(negativeNetRevenueData)
      );
      html = html.replace(/{{netRevenueChartClass}}/g, netRevenueChartClass);
    } else {
      // Si no hay datos, usar la clase pequeña por defecto
      html = html.replace(
        /{{yieldsChartClass}}/g,
        "chart-container-yields-small"
      );
      html = html.replace(
        /{{netRevenueChartClass}}/g,
        "chart-container-yields-small"
      );
    }

    return html;
  }

  /**
   * Convierte string de dinero a número
   * @param moneyString - String con formato de dinero ($1,234,567)
   * @returns Número sin formato
   */
  private parseMoneyString(moneyString: string): number {
    try {
      return parseInt(moneyString.replace(/[$,]/g, ""), 10) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Genera HTML para la tabla de balance a partir de los datos
   * @param balanceReport - Datos del reporte de balance
   * @returns HTML de la tabla generada
   */
  private generateBalanceTable(
    balanceReport: FinanceReportInput["balanceReport"]
  ): string {
    try {
      let tableHTML = `
      <table class="bank-table">
        <thead>
          <tr>
            <th>Banco</th>
            <th>Núm. de cuenta</th>
            <th>Cuenta</th>
            <th>Tipo de cuenta</th>
            <th>Saldo actual</th>
            <th>% Variación</th>
            <th>% Total</th>
          </tr>
        </thead>
        <tbody>`;

      // Generar filas para cada tabla en el balance report
      balanceReport.tables.forEach((tableData) => {
        tableData.table.forEach((account) => {
          tableHTML += `
          <tr>
            <td>${account.bank}</td>
            <td>${account.accountNumber}</td>
            <td>${account.accountName}</td>
            <td>${account.accountType}</td>
            <td>${account.finalBalance}</td>
            <td>${account.percentVariation}</td>
            <td>${account.porcentajeSaldo}</td>
          </tr>`;
        });
      });

      tableHTML += `
        </tbody>
      </table>`;

      return tableHTML;
    } catch (error) {
      console.warn("Error generating balance table:", error);
      return "<p>Error generando tabla de balances</p>";
    }
  }

  /**
   * Genera HTML para la tabla de ingresos a partir de los datos
   * @param incomeExpensesReport - Datos del reporte de ingresos y gastos
   * @returns HTML de la tabla de ingresos generada
   */
  private generateIncomeTable(
    incomeExpensesReport: FinanceReportInput["incomeExpensesReport"]
  ): string {
    try {
      // Buscar la tabla de ingresos en los results
      const incomeResult = incomeExpensesReport.results.find(
        (result) => result.table && result.table.some((row) => row.income)
      );

      if (!incomeResult || !incomeResult.table) {
        return "<p>No hay datos de ingresos disponibles</p>";
      }

      let tableHTML = `
      <table class="bank-table mb-14">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Núm. de cuenta</th>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Ingreso</th>
            <th>% Total</th>
          </tr>
        </thead>
        <tbody>`;

      // Generar filas para cada ingreso
      incomeResult.table.forEach((income) => {
        if (income.income) {
          tableHTML += `
          <tr>
            <td>${income.accountName}</td>
            <td>${income.accountNumber}</td>
            <td>${income.transactionDate}</td>
            <td>${income.detail}</td>
            <td>${income.income}</td>
            <td>${income.percentTotal}</td>
          </tr>`;
        }
      });

      tableHTML += `
        </tbody>
      </table>`;

      return tableHTML;
    } catch (error) {
      console.warn("Error generating income table:", error);
      return "<p>Error generando tabla de ingresos</p>";
    }
  }

  /**
   * Genera HTML para la tabla de gastos a partir de los datos
   * @param incomeExpensesReport - Datos del reporte de ingresos y gastos
   * @returns HTML de la tabla de gastos generada
   */
  private generateExpenseTable(
    incomeExpensesReport: FinanceReportInput["incomeExpensesReport"]
  ): string {
    try {
      // Buscar la tabla de gastos en los results
      const expenseResult = incomeExpensesReport.results.find(
        (result) => result.table && result.table.some((row) => row.expense)
      );

      if (!expenseResult || !expenseResult.table) {
        return "<p>No hay datos de gastos disponibles</p>";
      }

      let tableHTML = `
      <table class="bank-table mb-14">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Núm. de cuenta</th>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Gastos</th>
            <th>% Total</th>
          </tr>
        </thead>
        <tbody>`;

      // Generar filas para cada gasto
      expenseResult.table.forEach((expense) => {
        if (expense.expense) {
          tableHTML += `
          <tr>
            <td>${expense.accountName}</td>
            <td>${expense.accountNumber}</td>
            <td>${expense.transactionDate}</td>
            <td>${expense.detail}</td>
            <td>${expense.expense}</td>
            <td>${expense.percentTotal}</td>
          </tr>`;
        }
      });

      tableHTML += `
        </tbody>
      </table>`;

      return tableHTML;
    } catch (error) {
      console.warn("Error generating expense table:", error);
      return "<p>Error generando tabla de gastos</p>";
    }
  }

  /**
   * Genera HTML para la tabla de rendimientos y costos a partir de los datos
   * @param yieldsCostsReport - Datos del reporte de rendimientos y costos
   * @returns HTML de la tabla de rendimientos y costos generada
   */
  private generateYieldsCostsTable(
    yieldsCostsReport: FinanceReportInput["yieldsCostsReport"]
  ): string {
    try {
      // Buscar la tabla de rendimientos y costos en los results
      const yieldsCostsResult = yieldsCostsReport.results.find(
        (result) => result.table && result.header.includes("tabla")
      );

      if (!yieldsCostsResult || !yieldsCostsResult.table) {
        return "<p>No hay datos de rendimientos y costos disponibles</p>";
      }

      let tableHTML = `
      <table class="bank-table mb-14">
        <thead>
          <tr>
            <th>Cuenta</th>
            <th>Núm. de cuenta</th>
            <th>Rendimiento</th>
            <th>Costos</th>
            <th>Rentabilidad neta</th>
            <th>% Rentabilidad neta</th>
          </tr>
        </thead>
        <tbody>`;

      // Generar filas para cada cuenta
      yieldsCostsResult.table.forEach((account) => {
        tableHTML += `
        <tr>
          <td>${account.accountName}</td>
          <td>${account.accountNumber}</td>
          <td>${account.yields}</td>
          <td>${account.costs}</td>
          <td>${account.netRevenue}</td>
          <td>${account.netRevenueRate}</td>
        </tr>`;
      });

      tableHTML += `
        </tbody>
      </table>`;

      return tableHTML;
    } catch (error) {
      console.warn("Error generating yields costs table:", error);
      return "<p>Error generando tabla de rendimientos y costos</p>";
    }
  }

  /**
   * Genera HTML para las tarjetas de análisis por banco
   * @param bankAnalysis - Array con análisis por banco
   * @returns HTML de las tarjetas generadas
   */
  private generateBankAnalysisCards(
    bankAnalysis: Array<{ bankId?: string; bankName: string; analysis: string }>
  ): string {
    try {
      if (!bankAnalysis || bankAnalysis.length === 0) {
        return "<p>No hay datos de análisis por banco disponibles</p>";
      }

      // Mapeo de bankId a clase de gradiente
      const gradientMap: Record<string, string> = {
        "9001143468": "orange-gradient",
        "9007689338": "yellow-gradient",
        "8909039388": "yellow-gradient",
        "8600259715": "green-gradient",
        "8600073354": "blue-gradient",
        "8600518946": "red-gradient",
        "8909039370": "blue-gradient",
        "8600358275": "red-gradient",
        "8600077389": "green-gradient",
        "8600030201": "blue-gradient",
        "8600431866": "pink-gradient",
        "8600343137": "red-gradient",
        "8000378008": "green-gradient",
        "9004061505": "green-gradient",
        "8903002794": "blue-gradient",
        "8600067979": "blue-gradient",
        "9002009609": "purple-gradient",
        "8600507501": "green-gradient",
        "9002150711": "red-gradient",
        "8600511354": "blue-gradient",
        "8600029644": "blue-gradient",
        "9006281103": "red-gradient",
        "8902030889": "blue-gradient",
        "8902007567": "yellow-gradient",
        "9014915510": "blue-gradient",
        "8600345941": "red-gradient",
        "9003782122": "orange-gradient",
        "9000479818": "green-gradient",
      };

      // Mapeo de bankId a URL de logo
      const logoMap: Record<string, string> = {
        "9001143468":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749763706/fintrace/reports/bancos/2211.w018.n002.1415A.p30.1415_cqmg20.jpg",
        "9007689338":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760167/fintrace/reports/bancos/9007689338_xwuesw.svg",
        "8909039388":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760165/fintrace/reports/bancos/8909039388_hmvwfl.svg",
        "8600259715":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760185/fintrace/reports/bancos/8600259715_rzgrdv.svg",
        "8600073354":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760154/fintrace/reports/bancos/8600073354_oai5tt.svg",
        "8600518946":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760160/fintrace/reports/bancos/8600518946_uro40m.svg",
        "8909039370":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760183/fintrace/reports/bancos/8909039370_eruwy7.svg",
        "8600358275":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760152/fintrace/reports/bancos/8600358275_hv1se4.svg",
        "8600077389":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760172/fintrace/reports/bancos/8600077389_e3u0k2.svg",
        "8600030201":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760180/fintrace/reports/bancos/8600030201_v6wgo9.svg",
        "8600431866":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760176/fintrace/reports/bancos/8600431866_h1khnz.svg",
        "8600343137":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760181/fintrace/reports/bancos/8600343137_aiejje.svg",
        "8000378008":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760150/fintrace/reports/bancos/8000378008_yhq3ii.svg",
        "9004061505":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760168/fintrace/reports/bancos/9004061505_mquaoj.svg",
        "8903002794":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760158/fintrace/reports/bancos/8903002794_ln4snk.svg",
        "8600067979":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760178/fintrace/reports/bancos/8600067979_lo75ni.svg",
        "9002009609":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760147/fintrace/reports/bancos/9002009609_dtf7ag.svg",
        "8600507501":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760161/fintrace/reports/bancos/8600507501_gpka9h.svg",
        "9002150711":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760149/fintrace/reports/bancos/9002150711_jutuyq.svg",
        "8600511354":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749763706/fintrace/reports/bancos/2211.w018.n002.1415A.p30.1415_cqmg20.jpg",
        "8600029644":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760157/fintrace/reports/bancos/8600029644_f38quk.svg",
        "9006281103":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760174/fintrace/reports/bancos/9006281103_dx7pak.svg",
        "8902030889":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760155/fintrace/reports/bancos/8902030889_dkv8jm.svg",
        "8902007567":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760170/fintrace/reports/bancos/8902007567_jyphtc.svg",
        "9014915510":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749763706/fintrace/reports/bancos/2211.w018.n002.1415A.p30.1415_cqmg20.jpg",
        "8600345941":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760144/fintrace/reports/bancos/8600345941_vd3qnm.svg",
        "9003782122":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760146/fintrace/reports/bancos/9003782122_rariei.svg",
        "9000479818":
          "https://res.cloudinary.com/dtqnooo38/image/upload/v1749760145/fintrace/reports/bancos/9000479818_tenwnk.svg",
      };
      const defaultLogo =
        "https://res.cloudinary.com/dtqnooo38/image/upload/v1749654460/fintrace/reports/logo_xmiwkk.svg";

      let cardsHTML = "";

      bankAnalysis.forEach((bank) => {
        const gradientClass =
          bank.bankId && gradientMap[bank.bankId]
            ? gradientMap[bank.bankId]
            : "grey-gradient";
        const logoUrl =
          bank.bankId && logoMap[bank.bankId]
            ? logoMap[bank.bankId]
            : defaultLogo;
        cardsHTML += `<div class="content-bank-analytics ${gradientClass}">
          <div class="content-bank-analytics-logo">
            <img src="${logoUrl}" alt="${bank.bankName}" style="width: 94.177px; height: 25.948px; flex-shrink: 0;" />
          </div>
          <div class="content-bank-analytics-text">
            <p>${bank.analysis}</p>
          </div>
        </div>`;
      });

      return cardsHTML;
    } catch (error) {
      console.warn("Error generating bank analysis cards:", error);
      return "<p>Error generando análisis por banco</p>";
    }
  }

  /**
   * Parsea los datos de rendimientos y costos desde el header
   * @param yieldsCostsHeader - Header con información de rendimientos y costos
   * @returns Objeto con los datos parseados
   */
  private parseYieldsCostsData(yieldsCostsHeader: string): {
    performance: string;
    costs: string;
    net_profit: string;
  } {
    try {
      // Extraer rendimientos
      const performanceMatch = yieldsCostsHeader.match(
        /Rendimientos:\s*\$([0-9,]+\.?\d*)/
      );
      const performance = performanceMatch
        ? `$${performanceMatch[1]}`
        : "No disponible";

      // Extraer costos
      const costsMatch = yieldsCostsHeader.match(/Costos:\s*\$([0-9,]+\.?\d*)/);
      const costs = costsMatch ? `$${costsMatch[1]}` : "No disponible";

      // Extraer rentabilidad neta
      const netProfitMatch = yieldsCostsHeader.match(
        /Rentabilidad neta:\s*\$([0-9,]+\.?\d*)/
      );
      const net_profit = netProfitMatch
        ? `$${netProfitMatch[1]}`
        : "No disponible";

      return {
        performance,
        costs,
        net_profit,
      };
    } catch (error) {
      console.warn("Error parsing yields costs data:", error);
      return {
        performance: "Error al procesar",
        costs: "Error al procesar",
        net_profit: "Error al procesar",
      };
    }
  }

  /**
   * Procesa los datos de predicciones para generar variables del gráfico
   * @param html - HTML template
   * @param data - Datos del reporte financiero
   * @returns HTML con variables de predicciones reemplazadas
   */
  private processPredictionsChartData(
    html: string,
    data: FinanceReportInput
  ): string {
    try {
      // Extraer datos de predicciones
      const predictions = data.predictionsReport.predictions;

      // Buscar métricas específicas
      const incomeData = predictions.find((p) => p.metric === "income");
      const expenseData = predictions.find((p) => p.metric === "expense");

      if (!incomeData || !expenseData) {
        return html;
      }

      // Extraer períodos (excluyendo 'metric' y 'precision')
      const periods = Object.keys(incomeData).filter(
        (key) => key !== "metric" && key !== "precision"
      );

      // Procesar datos de ingresos
      const incomeValues: number[] = [];
      const expenseValues: number[] = [];
      const cashFlowValues: number[] = [];

      periods.forEach((period) => {
        const income = this.parseMoneyString(
          (incomeData as any)[period] as string
        );
        const expense = this.parseMoneyString(
          (expenseData as any)[period] as string
        );
        const cashFlow = income - expense;

        incomeValues.push(income);
        expenseValues.push(expense);
        cashFlowValues.push(cashFlow);
      });

      // Crear etiquetas de la leyenda con precisión
      const incomeLabel = `Ingresos\nPrecisión: ${incomeData.precision}`;
      const expenseLabel = `Egresos\nPrecisión: ${expenseData.precision}`;
      const cashFlowLabel = `Flujo de Caja\nPrecisión: 99.88%`; // Valor fijo como en el ejemplo

      // Reemplazar variables en el HTML
      html = html.replace(/{{predictionPeriods}}/g, JSON.stringify(periods));
      html = html.replace(
        /{{predictionIncomeData}}/g,
        JSON.stringify(incomeValues)
      );
      html = html.replace(
        /{{predictionExpenseData}}/g,
        JSON.stringify(expenseValues)
      );
      html = html.replace(
        /{{predictionCashFlowData}}/g,
        JSON.stringify(cashFlowValues)
      );
      html = html.replace(/{{incomeLabel}}/g, JSON.stringify(incomeLabel));
      html = html.replace(/{{expenseLabel}}/g, JSON.stringify(expenseLabel));
      html = html.replace(/{{cashFlowLabel}}/g, JSON.stringify(cashFlowLabel));

      // Procesar datos para la sexta gráfica (predicciones de rendimientos, costos y rentabilidad neta)
      const yieldsData = predictions.find((p) => p.metric === "yield");
      const costsData = predictions.find((p) => p.metric === "costs");
      const netProfitData = predictions.find((p) => p.metric === "netRevenue");

      if (yieldsData && costsData && netProfitData) {
        // Procesar valores de rendimientos, costos y rentabilidad neta
        const yieldsValues: number[] = [];
        const costsValues: number[] = [];
        const netProfitValues: number[] = [];

        periods.forEach((period) => {
          const yields = this.parseMoneyString(
            (yieldsData as any)[period] as string
          );
          const costs = this.parseMoneyString(
            (costsData as any)[period] as string
          );
          const netProfit = this.parseMoneyString(
            (netProfitData as any)[period] as string
          );

          yieldsValues.push(yields);
          costsValues.push(costs);
          netProfitValues.push(netProfit);
        });

        // Crear etiquetas de la leyenda con precisión para la sexta gráfica
        const yieldsLabel = `Rendimientos\nPresición: ${yieldsData.precision}`;
        const costsLabel = `Costos\nPresición: ${costsData.precision}`;
        const netProfitLabel = `Rentabilidad Neta\nPresición: ${netProfitData.precision}`;

        // Reemplazar variables en el HTML para la sexta gráfica
        html = html.replace(
          /{{yieldsPredictionPeriods}}/g,
          JSON.stringify(periods)
        );
        html = html.replace(
          /{{yieldsPredictionData}}/g,
          JSON.stringify(yieldsValues)
        );
        html = html.replace(
          /{{costsPredictionData}}/g,
          JSON.stringify(costsValues)
        );
        html = html.replace(
          /{{netProfitPredictionData}}/g,
          JSON.stringify(netProfitValues)
        );
        html = html.replace(/{{yieldsLabel}}/g, JSON.stringify(yieldsLabel));
        html = html.replace(/{{costsLabel}}/g, JSON.stringify(costsLabel));
        html = html.replace(
          /{{netProfitLabel}}/g,
          JSON.stringify(netProfitLabel)
        );
      }

      return html;
    } catch (error) {
      console.warn("Error processing predictions chart data:", error);
      return html;
    }
  }

  /**
   * Procesa los insights del AI Response para generar HTML
   * @param html - HTML template
   * @param data - Datos del reporte financiero
   * @returns HTML con insights del AI procesados
   */
  private processAIInsights(html: string, data: FinanceReportInput): string {
    try {
      // Extraer insights del aiResponse
      const insights = data.aiResponse?.insights || [];
      const recommendations = data.aiResponse?.recommendations || [];

      // Generar HTML para los insights
      let insightsHTML = "";
      insights.forEach((insight: string) => {
        insightsHTML += `        <p>${insight}</p>\n`;
      });

      // Generar HTML para las recomendaciones
      let recommendationsHTML = "";
      recommendations.forEach((recommendation: string) => {
        recommendationsHTML += `        <p>${recommendation}</p>\n`;
      });

      // Reemplazar variables en el HTML
      html = html.replace(/{{ aiInsights }}/g, insightsHTML);
      html = html.replace(/{{ aiRecommendations }}/g, recommendationsHTML);

      return html;
    } catch (error) {
      console.warn("Error processing AI insights:", error);
      // En caso de error, mostrar mensajes por defecto
      const defaultInsightsMessage =
        "<p>Las perspectivas de análisis están siendo procesadas.</p>";
      const defaultRecommendationsMessage =
        "<p>Las recomendaciones están siendo procesadas.</p>";
      html = html.replace(/{{ aiInsights }}/g, defaultInsightsMessage);
      html = html.replace(
        /{{ aiRecommendations }}/g,
        defaultRecommendationsMessage
      );
      return html;
    }
  }

  /**
   * Procesa las observaciones importantes (positiveFindings y negativeFindings) del AI Response
   * @param html - HTML template
   * @param data - Datos del reporte financiero
   * @returns HTML con observaciones importantes procesadas
   */
  private processImportantObservations(
    html: string,
    data: FinanceReportInput
  ): string {
    try {
      // Extraer positiveFindings y negativeFindings del aiResponse
      const positiveFindings = data.aiResponse?.positiveFindings || [];
      const negativeFindings = data.aiResponse?.negativeFindings || [];

      // Generar HTML para los hallazgos positivos
      let positiveFindingsHTML = "";
      positiveFindings.forEach((finding: string) => {
        positiveFindingsHTML += `          <p>${finding}</p>\n`;
      });

      // Generar HTML para los hallazgos negativos
      let negativeFindingsHTML = "";
      negativeFindings.forEach((finding: string) => {
        negativeFindingsHTML += `          <p>${finding}</p>\n`;
      });

      // Reemplazar variables en el HTML
      html = html.replace(/{{ aiPositiveFindings }}/g, positiveFindingsHTML);
      html = html.replace(/{{ aiNegativeFindings }}/g, negativeFindingsHTML);

      return html;
    } catch (error) {
      console.warn("Error processing important observations:", error);
      // En caso de error, mostrar mensajes por defecto
      const defaultPositiveMessage =
        "<p>Los hallazgos positivos están siendo procesados.</p>";
      const defaultNegativeMessage =
        "<p>Los hallazgos negativos están siendo procesados.</p>";
      html = html.replace(/{{ aiPositiveFindings }}/g, defaultPositiveMessage);
      html = html.replace(/{{ aiNegativeFindings }}/g, defaultNegativeMessage);
      return html;
    }
  }

  /**
   * Renderiza el HTML a PDF usando Puppeteer
   * @param htmlContent - HTML procesado
   * @returns Buffer del PDF
   */
  private async renderPDF(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: chromiumConfig.args,
      defaultViewport: chromiumConfig.defaultViewport,
      executablePath: chromiumConfig.executablePath,
      headless: chromiumConfig.headless,
    });

    try {
      const page = await browser.newPage();

      // Cargar el HTML
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
      });

      // Esperar a que los gráficos se rendericen
      await page.waitForFunction(() => (window as any).chartReady === true, {
        timeout: 10000,
      });

      // Tiempo adicional para asegurar renderizado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera el HTML del reporte para preview (sin generar PDF)
   * @param reportData - Datos validados del reporte financiero
   * @returns HTML procesado
   */
  async generatePreviewHTML(reportData: FinanceReportInput): Promise<string> {
    try {
      // Leer el template HTML
      const htmlTemplate = this.loadTemplate();

      // Procesar los datos y generar HTML
      const htmlContent = this.processTemplate(htmlTemplate, reportData);

      return htmlContent;
    } catch (error) {
      console.error("Error generating preview HTML:", error);
      throw new Error(
        `Failed to generate preview HTML: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Genera el nombre del archivo PDF basado en los datos del reporte
   * @param reportData - Datos del reporte
   * @returns Nombre del archivo
   */
  generateFileName(reportData: FinanceReportInput): string {
    const date = new Date().toISOString().split("T")[0];
    return `reporte-financiero-${date}.pdf`;
  }
}
