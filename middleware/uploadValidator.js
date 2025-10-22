import multer from "multer";
import sharp from "sharp";

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"), false);
        }
        cb(null, true);
    },
}).single("image");

export async function validateDimensions(buffer) {
    const metadata = await sharp(buffer).metadata();
    const requiredWidth = 1100;
    const requiredHeight = 620;
    if (metadata.width !== requiredWidth || metadata.height !== requiredHeight) {
        throw new Error(
            `Image must be exactly ${requiredWidth}x${requiredHeight}px (uploaded: ${metadata.width}x${metadata.height})`
        );
    }
}
