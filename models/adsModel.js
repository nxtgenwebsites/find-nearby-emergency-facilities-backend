import mongoose from "mongoose";

const AdSchema = new mongoose.Schema(
    {
        sponsorName: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },

        // 🔹 Owner (simple string field for user ID or username)
        owner: { type: String, required: true, trim: true },

        impressionDays: { type: Number },
        link: { type: String, required: true, trim: true },
        imageUrl: { type: String, required: true },
        imagePublicId: { type: String },

        status: {
            type: String,
            enum: ["pending", "active", "inactive"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// 🔹 Auto-calculate impression days before saving
AdSchema.pre("save", function (next) {
    if (this.startDate && this.endDate) {
        const diff = this.endDate.getTime() - this.startDate.getTime();
        this.impressionDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    next();
});

export default mongoose.model("Ads", AdSchema);
