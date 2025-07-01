export interface PDFOptions {
  format?: "A4" | "A3" | "Letter" | "Legal";
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}
