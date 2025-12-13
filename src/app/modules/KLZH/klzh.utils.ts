import { sendEmail } from "../../utils/sendEmail";
import KLZHFormDataModel from "./klzh.model";
/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import { KLZHFormData } from "./klzh.interface";

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

export const sendKlzhPdfEmail = async (
  userEmail: string,
  pdfBlob: Blob,
): Promise<boolean> => {
  // Convert Blob → ArrayBuffer → Buffer
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  const emailContent = `
    <p>This is your registration confirmation for KLZH.</p>
  `;

  const emailResponse = await sendEmail(
    userEmail,
    "KLZH Registration Confirmation",
    emailContent,
    [
      {
        filename: "KLZH-Registration.pdf",
        content: pdfBuffer, // BUFFER INSTEAD OF PATH
        contentType: "application/pdf",
      },
    ],
  );

  if (!emailResponse.success) {
    console.error("Failed to send email:", emailResponse.message);
    return false;
  }

  return true;
};

export async function generateKLZHRegistrationPDFs(
  klzhData: KLZHFormData,
  userEmail: string,
): Promise<Blob> {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    let yPosition = margin;

    const primaryColor = [20, 80, 130]; // Deeper, more sophisticated teal
    const accentColor = [230, 100, 10]; // Warm accent for key info
    const darkText = [35, 45, 65]; // Deeper gray for better readability
    const lightBorder = [235, 240, 245]; // Subtle light border

    const drawSectionHeader = (text: string, y: number) => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, y, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin + 4, y + 5.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      return y + 12; // Increased spacing after headers (from 9 to 12)
    };

    const drawLabelValue = (label: string, value: any, y: number) => {
      const valueX = margin + 38;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${label}`, margin + 3, y);

      const maxWidth = contentWidth - (valueX - margin) - 2;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.setFontSize(8.8);
      const valueText =
        value !== undefined && value !== null ? value.toString() : "-";
      const lines = doc.splitTextToSize(valueText, maxWidth);
      doc.text(lines, valueX, y);

      return y + lines.length * 4.5 + 2.5; // Better spacing between rows (from 4.2 to 4.5, +2.5 gap)
    };

    const drawDivider = (y: number) => {
      doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      return y + 5; // Increased divider spacing (from 3 to 5)
    };

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("KANTONALES LABOR ZÜRICH", margin, yPosition + 6);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("Lebensmittelkontrolle", margin, yPosition + 11.5);

    yPosition += 18;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    const titleText = "BETRIEBSREGISTRATION";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPosition);

    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const emailWidth = doc.getTextWidth(userEmail);
    doc.text(userEmail, (pageWidth - emailWidth) / 2, yPosition);

    yPosition += 9;
    yPosition = drawDivider(yPosition);

    // Section 1: Art der Meldung
    yPosition = drawSectionHeader("ART DER MELDUNG", yPosition);

    yPosition = drawLabelValue(
      "Typ",
      klzhData.artDerMeldung?.typ || "Nicht angegeben",
      yPosition,
    );

    if (
      klzhData.artDerMeldung?.typ === "Neuanmeldung" &&
      klzhData.artDerMeldung?.datumDerEroeffnung
    ) {
      yPosition = drawLabelValue(
        "Datum der Eröffnung",
        klzhData.artDerMeldung.datumDerEroeffnung,
        yPosition,
      );
    }

    if (
      klzhData.artDerMeldung?.typ === "Mutation" &&
      klzhData.artDerMeldung?.mutationGueltigAb
    ) {
      yPosition = drawLabelValue(
        "Mutation gültig ab",
        klzhData.artDerMeldung.mutationGueltigAb,
        yPosition,
      );
    }

    if (
      klzhData.artDerMeldung?.typ === "Abmeldung" &&
      klzhData.artDerMeldung?.abmeldungBetrieb
    ) {
      yPosition = drawLabelValue(
        "Abmeldung Betrieb",
        klzhData.artDerMeldung.abmeldungBetrieb,
        yPosition,
      );
    }

    yPosition = drawDivider(yPosition);

    // Section 2: Verantwortliche Person
    yPosition = drawSectionHeader("VERANTWORTLICHE PERSON", yPosition);

    if (klzhData.verantwortlichePerson?.neueAngaben) {
      const person = klzhData.verantwortlichePerson.neueAngaben;
      yPosition = drawLabelValue("Geschlecht", person.geschlecht, yPosition);
      yPosition = drawLabelValue("Name", person.name, yPosition);
      yPosition = drawLabelValue("Vorname", person.vorname, yPosition);
      yPosition = drawLabelValue(
        "Geburtsdatum",
        person.geburtsdatum,
        yPosition,
      );
      yPosition = drawLabelValue("AHV-Nummer", person.ahvNr, yPosition);
    } else if (klzhData.verantwortlichePerson?.bisher) {
      const person = klzhData.verantwortlichePerson.bisher;
      yPosition = drawLabelValue("Geschlecht", person.geschlecht, yPosition);
      yPosition = drawLabelValue("Name", person.name, yPosition);
      yPosition = drawLabelValue("Vorname", person.vorname, yPosition);
      yPosition = drawLabelValue(
        "Geburtsdatum",
        person.geburtsdatum,
        yPosition,
      );
      yPosition = drawLabelValue("AHV-Nummer", person.ahvNr, yPosition);
    }

    yPosition = drawDivider(yPosition);

    // Section 3: Betriebsadresse
    yPosition = drawSectionHeader("BETRIEBSADRESSE", yPosition);

    if (klzhData.betriebsadresse?.neueAngaben) {
      const addr = klzhData.betriebsadresse.neueAngaben;
      yPosition = drawLabelValue("Firma", addr.firma, yPosition);
      if (addr.abteilung) {
        yPosition = drawLabelValue("Abteilung", addr.abteilung, yPosition);
      }
      yPosition = drawLabelValue("Strasse/Nr", addr.strasseNr, yPosition);
      yPosition = drawLabelValue("PLZ", addr.plz, yPosition);
      yPosition = drawLabelValue("Ort", addr.ort, yPosition);
    } else if (klzhData.betriebsadresse?.bisher) {
      const addr = klzhData.betriebsadresse.bisher;
      yPosition = drawLabelValue("Firma", addr.firma, yPosition);
      if (addr.abteilung) {
        yPosition = drawLabelValue("Abteilung", addr.abteilung, yPosition);
      }
      yPosition = drawLabelValue("Strasse/Nr", addr.strasseNr, yPosition);
      yPosition = drawLabelValue("PLZ", addr.plz, yPosition);
      yPosition = drawLabelValue("Ort", addr.ort, yPosition);
    }

    yPosition = drawDivider(yPosition);

    // Section 4: Betriebsinformationen
    yPosition = drawSectionHeader("BETRIEBSINFORMATIONEN", yPosition);
    yPosition = drawLabelValue("Betriebsart", klzhData.betriebsart, yPosition);
    yPosition = drawLabelValue(
      "UID (Mehrwertsteuernummer)",
      klzhData.uid,
      yPosition,
    );
    yPosition = drawLabelValue(
      "Abgabe von Tabak",
      klzhData.abgabeVonTabakOderHandelMitTabak ? "Ja" : "Nein",
      yPosition,
    );

    yPosition = drawDivider(yPosition);

    // Section 5: Zertifizierungen
    yPosition = drawSectionHeader("ZERTIFIZIERUNGEN", yPosition);

    if (klzhData.zertifizierungen) {
      const certs = klzhData.zertifizierungen;
      yPosition = drawLabelValue("Bio", certs.bio ? "Ja" : "Nein", yPosition);
      yPosition = drawLabelValue(
        "FSSC 22000",
        certs.fssc22000 ? "Ja" : "Nein",
        yPosition,
      );
      yPosition = drawLabelValue("IFS", certs.ifs ? "Ja" : "Nein", yPosition);
      yPosition = drawLabelValue("BRC", certs.brc ? "Ja" : "Nein", yPosition);
      if (certs.andere) {
        yPosition = drawLabelValue(
          "Andere Zertifizierungen",
          certs.andere,
          yPosition,
        );
      }
    }

    const currentDate = new Date().toLocaleDateString("de-CH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    yPosition = pageHeight - 11;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightBorder[0], lightBorder[1], lightBorder[2]);

    doc.text(`Erstellt: ${currentDate}`, margin, yPosition);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(lightBorder[0], lightBorder[1], lightBorder[2]);
      doc.text(
        `Seite ${i} von ${totalPages}`,
        pageWidth - margin - 15,
        yPosition,
      );
    }

    const pdfBlob = doc.output("blob");
    resolve(pdfBlob);
  });
}
