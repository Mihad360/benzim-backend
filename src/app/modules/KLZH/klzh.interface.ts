// import { Types } from "mongoose";

// export interface KLZHFormData {
//   userId: Types.ObjectId;
//   // Type of Registration
//   artDerMeldung: {
//     typ: "Neuanmeldung" | "Mutation" | "Abmeldung"; // New registration | Change | Deregistration
//     datumDerEroeffnung?: string; // Date of opening (for Neuanmeldung) - OPTIONAL
//     mutationGueltigAb?: string; // Change valid from date (for Mutation) - OPTIONAL
//     abmeldungBetrieb?: string; // Deregistration date (for Abmeldung) - OPTIONAL
//   };

//   // Business Number (if known) - OPTIONAL
//   betriebsnummer?: string;

//   // Responsible Person (with previous and new information)
//   verantwortlichePerson: {
//     bisher?: {
//       // Previous information - OPTIONAL (not needed for Neuanmeldung)
//       geschlecht?: "Frau" | "Herr" | "";
//       geburtsdatum?: string;
//       name?: string;
//       vorname?: string;
//       ahvNr?: string;
//     };
//     neueAngaben: {
//       // New information - REQUIRED
//       geschlecht: "Frau" | "Herr";
//       geburtsdatum: string;
//       name: string;
//       vorname: string;
//       ahvNr: string;
//     };
//   };

//   // Business Address (location of business or name of establishment)
//   betriebsadresse: {
//     bisher?: {
//       // Previous information - OPTIONAL (not needed for Neuanmeldung)
//       firma?: string;
//       abteilung?: string;
//       strasseNr?: string;
//       plz?: string;
//       ort?: string;
//     };
//     neueAngaben: {
//       // New information - REQUIRED
//       firma: string;
//       abteilung?: string; // OPTIONAL
//       strasseNr: string;
//       plz: string;
//       ort: string;
//     };
//   };

//   // Correspondence Address (if different from business address) - OPTIONAL
//   korrespondenzadresse?: {
//     bisher?: {
//       firma?: string;
//     };
//     neueAngaben?: {
//       firma?: string;
//     };
//   };

//   // VAT-compliant Billing Address (if different from business address) - OPTIONAL
//   rechnungsadresseMehrwertsteuerkonforme?: {
//     bisher?: {
//       firma?: string;
//       name?: string;
//       abteilung?: string;
//       strasseNr?: string;
//       postfach?: string;
//       plz?: string;
//       ort?: string;
//     };
//     neueAngaben?: {
//       firma?: string;
//       name?: string;
//       abteilung?: string;
//       strasseNr?: string;
//       postfach?: string;
//       plz?: string;
//       ort?: string;
//     };
//   };

//   // Type of Business - REQUIRED
//   betriebsart: string;

//   // Sale of tobacco or tobacco trade - REQUIRED
//   abgabeVonTabakOderHandelMitTabak: boolean;

//   // Certifications - OPTIONAL
//   zertifizierungen?: {
//     bio?: boolean;
//     fssc22000?: boolean;
//     ifs?: boolean;
//     brc?: boolean;
//     andere?: string;
//   };

//   // Company Identification Number (Swiss UID) - REQUIRED
//   uid: string;
//   isDeleted?: boolean;
// }

import { Types } from "mongoose";

export interface IKLZH {
  userId: Types.ObjectId;
  pdfUrl: string;
  isDeleted?: boolean;
}
