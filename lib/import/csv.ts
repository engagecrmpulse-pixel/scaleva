import { CSV_COLUMNS, type ImportedCustomer } from "./types";

/**
 * Minimal CSV parser (no external dependency). Handles quoted fields,
 * escaped double-quotes ("") and commas/newlines inside quotes. Good enough
 * for customer import; not a full RFC-4180 implementation.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Handle \r\n by skipping the paired \n.
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Flush the trailing field/row if the file did not end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Parses CSV text into ImportedCustomer rows. The first row may be a header
 * (detected if it contains a "name" column); columns are matched by header
 * name when present, otherwise by position (name, phone, email, last_purchase,
 * spend_amount).
 */
export function parseCustomersCsv(text: string): ImportedCustomer[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.includes("name");

  const indexOf = (col: string, fallback: number): number => {
    if (!hasHeader) return fallback;
    const idx = header.indexOf(col);
    return idx === -1 ? fallback : idx;
  };

  const colName = indexOf("name", 0);
  const colPhone = indexOf("phone", 1);
  const colEmail = indexOf("email", 2);
  const colLast = indexOf("last_purchase", 3);
  const colSpend = indexOf("spend_amount", 4);

  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((cells): ImportedCustomer => {
      const get = (i: number) => (cells[i] ?? "").trim();
      const spendRaw = get(colSpend).replace(/[^0-9.\-]/g, "");
      const spend = Number.parseFloat(spendRaw);
      return {
        name: get(colName),
        phone: get(colPhone),
        email: get(colEmail),
        last_purchase: get(colLast),
        spend_amount: Number.isFinite(spend) ? spend : 0,
      };
    })
    .filter((c) => c.name !== "");
}

export { CSV_COLUMNS };
