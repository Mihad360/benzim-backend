/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { sendEmail } from "../../utils/sendEmail";
import KLZHFormDataModel from "./klzh.model";

export const generateUniqueBusinessNumber = async (): Promise<string> => {
  try {
    // Step 1: Find the last business number in the database (based on descending order)
    const lastKLZH = await KLZHFormDataModel.findOne()
      .sort({ betriebsnummer: -1 })
      .exec();

    let newBusinessNumber: string = "CHE-001.000.001"; // Default fallback value

    if (lastKLZH) {
      // Step 2: Extract the numeric part of the last business number (CHE-123.456.789)
      const lastNumber = lastKLZH.betriebsnummer;
      const numberParts = lastNumber && lastNumber?.split("-")[1]; // Split by CHE- and get the last part (123.456.789)

      const parts = numberParts && numberParts?.split("."); // Split further by dot to get the three sections
      const newNumber = parts && parseInt(parts[2]) + 1; // Increment the last part (789 -> 790)

      // Step 3: Format the new number into the correct format
      const newParts =
        parts &&
        `${parts[0]}.${parts[1]}.${newNumber?.toString().padStart(3, "0")}`;
      newBusinessNumber = `CHE-${newParts}`; // Assign the new business number
    }

    return newBusinessNumber; // Return the newly generated business number
  } catch (error) {
    console.error("Error generating business number:", error);
    throw new Error("Failed to generate business number");
  }
};

// Function to send business number to user's email
export const sendBusinessNumberEmail = async (
  userEmail: string,
  businessNumber: string,
): Promise<boolean> => {
  const emailContent = `
    <p>Your Swiss business number (UID) is: ${businessNumber}</p>
    <p>This is your registration confirmation for KLZH.</p>
  `;

  const emailResponse = await sendEmail(
    userEmail,
    "KLZH Registration Confirmation",
    emailContent,
  );
  if (!emailResponse.success) {
    console.error("Failed to send email:", emailResponse.message);
    return false;
  }

  return true;
};

// Helper function to generate PDF
const ORANGE = rgb(253 / 255, 186 / 255, 116 / 255); // Tailwind orange-300
const ORANGE_LIGHT = rgb(254 / 255, 237 / 255, 200 / 255); // Tailwind orange-100
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.15, 0.15, 0.15);
const MEDIUM_GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.92, 0.92, 0.92);
const WHITE = rgb(1, 1, 1);

interface DrawTextOptions {
  x: number;
  y: number;
  size: number;
  color?: typeof BLACK;
  bold?: boolean;
}

export async function generateKLZHRegistrationPDF(data: any, email: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 35;
  const contentWidth = width - 2 * margin;
  let yPosition = height - 30;

  const drawText = (text: string, options: DrawTextOptions) => {
    const { x, y, size, color = BLACK, bold = false } = options;
    page.drawText(text, {
      x,
      y,
      font: bold ? boldFont : font,
      size,
      color,
    });
  };

  const drawSectionHeader = (title: string, y: number) => {
    // Draw light orange background
    page.drawRectangle({
      x: margin,
      y: y - 22,
      width: contentWidth,
      height: 24,
      color: ORANGE_LIGHT,
      borderColor: ORANGE,
      borderWidth: 1.5,
    });
    // Draw orange text
    drawText(title, {
      x: margin + 10,
      y: y - 17,
      size: 11,
      color: DARK_GRAY,
      bold: true,
    });
    return y - 30;
  };

  const drawKeyValue = (key: string, value: string | undefined, y: number) => {
    if (!value) return y;
    drawText(`${key}:`, {
      x: margin + 10,
      y,
      size: 9,
      bold: true,
      color: MEDIUM_GRAY,
    });
    drawText(value, { x: margin + 150, y, size: 9, color: BLACK });
    return y - 14;
  };

  // Draw header background
  page.drawRectangle({
    x: 0,
    y: height - 60,
    width: width,
    height: 60,
    color: ORANGE,
  });

  // Draw title in header
  drawText("KLZH Registrierungsbestätigung", {
    x: margin,
    y: height - 35,
    size: 22,
    color: WHITE,
    bold: true,
  });

  yPosition = height - 75;

  const registrationType = data.artDerMeldung.typ;
  const registrationDate =
    data.artDerMeldung.datumDerEroeffnung ||
    data.artDerMeldung.mutationGueltigAb ||
    data.artDerMeldung.abmeldungBetrieb ||
    new Date().toISOString().split("T")[0];

  drawText(`Meldungstyp: ${registrationType}`, {
    x: margin,
    y: yPosition,
    size: 9,
    color: MEDIUM_GRAY,
  });
  drawText(`Datum: ${registrationDate}`, {
    x: margin + 250,
    y: yPosition,
    size: 9,
    color: MEDIUM_GRAY,
  });
  yPosition -= 18;

  // General Information Section
  yPosition = drawSectionHeader("Allgemeine Informationen", yPosition);
  yPosition = drawKeyValue("Betriebsnummer", data.betriebsnummer, yPosition);
  yPosition = drawKeyValue("UID", data.uid, yPosition);
  yPosition = drawKeyValue("Betriebsart", data.betriebsart, yPosition);
  yPosition -= 8;

  // Responsible Person Section
  yPosition = drawSectionHeader("Verantwortliche Person", yPosition);
  const person = data.verantwortlichePerson.neueAngaben;
  yPosition = drawKeyValue(
    "Name",
    `${person.vorname} ${person.name}`,
    yPosition,
  );
  yPosition = drawKeyValue("Geschlecht", person.geschlecht, yPosition);
  yPosition = drawKeyValue("Geburtsdatum", person.geburtsdatum, yPosition);
  yPosition = drawKeyValue("AHV-Nummer", person.ahvNr, yPosition);
  yPosition -= 8;

  // Business Address Section
  yPosition = drawSectionHeader("Betriebsadresse", yPosition);
  const address = data.betriebsadresse.neueAngaben;
  yPosition = drawKeyValue("Firma", address.firma, yPosition);
  if (address.abteilung) {
    yPosition = drawKeyValue("Abteilung", address.abteilung, yPosition);
  }
  yPosition = drawKeyValue("Strasse/Nr.", address.strasseNr, yPosition);
  yPosition = drawKeyValue(
    "PLZ/Ort",
    `${address.plz} ${address.ort}`,
    yPosition,
  );
  yPosition -= 8;

  // Correspondence Address Section (if different)
  if (data.korrespondenzadresse?.neueAngaben?.firma) {
    yPosition = drawSectionHeader("Korrespondenzadresse", yPosition);
    yPosition = drawKeyValue(
      "Firma",
      data.korrespondenzadresse.neueAngaben.firma,
      yPosition,
    );
    yPosition -= 8;
  }

  // Billing Address Section (if present)
  if (data.rechnungsadresseMehrwertsteuerkonforme?.neueAngaben) {
    const billAddr = data.rechnungsadresseMehrwertsteuerkonforme.neueAngaben;
    if (billAddr.firma || billAddr.strasseNr) {
      yPosition = drawSectionHeader("Rechnungsadresse", yPosition);
      if (billAddr.firma)
        yPosition = drawKeyValue("Firma", billAddr.firma, yPosition);
      if (billAddr.name)
        yPosition = drawKeyValue("Name", billAddr.name, yPosition);
      if (billAddr.abteilung)
        yPosition = drawKeyValue("Abteilung", billAddr.abteilung, yPosition);
      if (billAddr.strasseNr)
        yPosition = drawKeyValue("Strasse/Nr.", billAddr.strasseNr, yPosition);
      if (billAddr.postfach)
        yPosition = drawKeyValue("Postfach", billAddr.postfach, yPosition);
      if (billAddr.plz || billAddr.ort)
        yPosition = drawKeyValue(
          "PLZ/Ort",
          `${billAddr.plz || ""} ${billAddr.ort || ""}`,
          yPosition,
        );
      yPosition -= 8;
    }
  }

  // Certifications Section
  if (
    data.zertifizierungen &&
    Object.values(data.zertifizierungen).some((v) => v)
  ) {
    yPosition = drawSectionHeader("Zertifizierungen", yPosition);
    const certs = data.zertifizierungen;
    if (certs.bio)
      yPosition = drawKeyValue("Bio-Zertifizierung", "Ja", yPosition);
    if (certs.fssc22000)
      yPosition = drawKeyValue("FSSC 22000", "Ja", yPosition);
    if (certs.ifs) yPosition = drawKeyValue("IFS", "Ja", yPosition);
    if (certs.brc) yPosition = drawKeyValue("BRC", "Ja", yPosition);
    if (certs.andere)
      yPosition = drawKeyValue(
        "Weitere Zertifizierungen",
        certs.andere,
        yPosition,
      );
    yPosition -= 8;
  }

  // Additional Information Section
  yPosition = drawSectionHeader("Zusätzliche Informationen", yPosition);
  yPosition = drawKeyValue(
    "Abgabe von Tabak oder Handel mit Tabak",
    data.abgabeVonTabakOderHandelMitTabak ? "Ja" : "Nein",
    yPosition,
  );

  const footerY = 25;
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: width - margin, y: footerY + 15 },
    color: LIGHT_GRAY,
    thickness: 1,
  });
  drawText(
    "Dieses Dokument wurde automatisch generiert und ist gültig ohne Unterschrift.",
    {
      x: margin,
      y: footerY + 5,
      size: 7,
      color: MEDIUM_GRAY,
    },
  );
  drawText(`Generiert am: ${new Date().toLocaleDateString("de-CH")}`, {
    x: width - margin - 100,
    y: footerY + 5,
    size: 7,
    color: MEDIUM_GRAY,
  });

  // Save PDF and send email
  const pdfBytes = await pdfDoc.save();

  const emailResponse = await sendEmail(
    email,
    "KLZH Registrierungsbestätigung",
    "Im Anhang finden Sie Ihr KLZH Registrierungsdokument.",
    [
      {
        filename: `KLZH-Registrierung-${data.betriebsnummer}.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  );

  return emailResponse;
}
