import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
    country: { type: String, required: true },
    state: { type: String },
    lga_region: { type: String },   // LGA / Region
    town: { type: String },
    city: { type: String },
    neighbourhood: { type: String },
    facility_name: { type: String, required: true },
    address: { type: String },
    hours: { type: String },
    phone_number: { type: String },
    website: { type: String },
    contact_name: { type: String },
    services: { type: String },   // e.g. Hospitals, Pharmacies, Labs, etc.
    place_id: { type: String },
    source: { type: String },

    // GeoJSON location (keep as it is ✅)
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
});

// ✅ 2dsphere index for geospatial queries
hospitalSchema.index({ location: "2dsphere" });

export default mongoose.model("Hospital", hospitalSchema);
