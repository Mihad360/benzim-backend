import { z } from "zod";

// Define the schema for validating `artDerMeldung`
const ArtDerMeldungSchema = z.object({
  typ: z.enum(["Neuanmeldung", "Mutation", "Abmeldung"]),
  datumDerEroeffnung: z.string().optional(),
  mutationGueltigAb: z.string().optional(),
  abmeldungBetrieb: z.string().optional(),
});

// Define the schema for `verantwortlichePerson`
const VerantwortlichePersonSchema = z.object({
  bisher: z
    .object({
      geschlecht: z.enum(["Frau", "Herr", ""]).optional(),
      geburtsdatum: z.string().optional(),
      name: z.string().optional(),
      vorname: z.string().optional(),
      ahvNr: z.string().optional(),
    })
    .optional(),
  neueAngaben: z.object({
    geschlecht: z.enum(["Frau", "Herr"]),
    geburtsdatum: z.string(),
    name: z.string(),
    vorname: z.string(),
    ahvNr: z.string(),
  }),
});

// Define the schema for `betriebsadresse`
const BetriebsadresseSchema = z.object({
  bisher: z
    .object({
      firma: z.string().optional(),
      abteilung: z.string().optional(),
      strasseNr: z.string().optional(),
      plz: z.string().optional(),
      ort: z.string().optional(),
    })
    .optional(),
  neueAngaben: z.object({
    firma: z.string(),
    abteilung: z.string().optional(),
    strasseNr: z.string(),
    plz: z.string(),
    ort: z.string(),
  }),
});

// Define the schema for `korrespondenzadresse`
const KorrespondenzadresseSchema = z.object({
  bisher: z
    .object({
      firma: z.string().optional(),
    })
    .optional(),
  neueAngaben: z.object({
    firma: z.string(),
  }),
});

// Define the schema for `rechnungsadresseMehrwertsteuerkonforme`
const RechnungsadresseMehrwertsteuerkonformeSchema = z.object({
  bisher: z
    .object({
      firma: z.string().optional(),
      name: z.string().optional(),
      abteilung: z.string().optional(),
      strasseNr: z.string().optional(),
      postfach: z.string().optional(),
      plz: z.string().optional(),
      ort: z.string().optional(),
    })
    .optional(),
  neueAngaben: z.object({
    firma: z.string(),
    name: z.string(),
    abteilung: z.string().optional(),
    strasseNr: z.string(),
    postfach: z.string().optional(),
    plz: z.string(),
    ort: z.string(),
  }),
});

// Define the schema for `zertifizierungen`
const ZertifizierungenSchema = z.object({
  bio: z.boolean().optional(),
  fssc22000: z.boolean().optional(),
  ifs: z.boolean().optional(),
  brc: z.boolean().optional(),
  andere: z.string().optional(),
});

// Define the main schema for `KLZHFormData`
const KLZHFormDataSchema = z.object({
  artDerMeldung: ArtDerMeldungSchema,
  betriebsnummer: z.string().optional(),
  verantwortlichePerson: VerantwortlichePersonSchema,
  betriebsadresse: BetriebsadresseSchema,
  korrespondenzadresse: KorrespondenzadresseSchema,
  rechnungsadresseMehrwertsteuerkonforme:
    RechnungsadresseMehrwertsteuerkonformeSchema,
  betriebsart: z.string(),
  abgabeVonTabakOderHandelMitTabak: z.boolean(),
  zertifizierungen: ZertifizierungenSchema,
  uid: z.string(),
});

// Type inference from Zod schema
type KLZHFormDataType = z.infer<typeof KLZHFormDataSchema>;

export { KLZHFormDataSchema, KLZHFormDataType };
