import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Saving file to: public/uploads/");  
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const fileExt = path.extname(file.originalname);
        const fileName = file.originalname
            .replace(/\s+/g, "_") // Convert spaces to underscores
            .replace(/[^a-zA-Z0-9_.-]/g, ""); // Remove special characters
        console.log("Saving file as:", fileName);  
        cb(null, fileName);
    }
});

export const upload = multer({ storage });
