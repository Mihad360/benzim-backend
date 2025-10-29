import mongoose, { Schema } from "mongoose";
import { KLZHFormData } from "./klzh.interface";

const KLZHFormDataSchema: Schema = new Schema<KLZHFormData>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    artDerMeldung: {
      typ: {
        type: String,
        required: true,
        enum: ["Neuanmeldung", "Mutation", "Abmeldung"],
      },
      datumDerEroeffnung: { type: String },
      mutationGueltigAb: { type: String },
      abmeldungBetrieb: { type: String },
    },

    betriebsnummer: { type: String },

    verantwortlichePerson: {
      bisher: {
        geschlecht: {
          type: String,
          enum: ["Frau", "Herr", ""],
          required: false,
        },
        geburtsdatum: { type: String },
        name: { type: String },
        vorname: { type: String },
        ahvNr: { type: String },
      },
      neueAngaben: {
        geschlecht: { type: String, enum: ["Frau", "Herr"], required: true },
        geburtsdatum: { type: String, required: true },
        name: { type: String, required: true },
        vorname: { type: String, required: true },
        ahvNr: { type: String, required: true },
      },
    },

    betriebsadresse: {
      bisher: {
        firma: { type: String },
        abteilung: { type: String },
        strasseNr: { type: String },
        plz: { type: String },
        ort: { type: String },
      },
      neueAngaben: {
        firma: { type: String, required: true },
        abteilung: { type: String },
        strasseNr: { type: String, required: true },
        plz: { type: String, required: true },
        ort: { type: String, required: true },
      },
    },

    korrespondenzadresse: {
      bisher: {
        firma: { type: String },
      },
      neueAngaben: {
        firma: { type: String },
      },
    },

    rechnungsadresseMehrwertsteuerkonforme: {
      bisher: {
        firma: { type: String },
        name: { type: String },
        abteilung: { type: String },
        strasseNr: { type: String },
        postfach: { type: String },
        plz: { type: String },
        ort: { type: String },
      },
      neueAngaben: {
        firma: { type: String },
        name: { type: String },
        abteilung: { type: String },
        strasseNr: { type: String },
        postfach: { type: String },
        plz: { type: String },
        ort: { type: String },
      },
    },

    betriebsart: { type: String, required: true },

    abgabeVonTabakOderHandelMitTabak: { type: Boolean, required: true },

    zertifizierungen: {
      bio: { type: Boolean },
      fssc22000: { type: Boolean },
      ifs: { type: Boolean },
      brc: { type: Boolean },
      andere: { type: String },
    },

    uid: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

const KLZHModel = mongoose.model<KLZHFormData>(
  "KLZHRegistration",
  KLZHFormDataSchema,
);

export default KLZHModel;
