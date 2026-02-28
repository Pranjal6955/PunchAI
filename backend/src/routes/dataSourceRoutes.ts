import express from "express";
import { protect } from "../middleware/authMiddleware";
import upload from "../middleware/uploadMiddleware";
import {
    getSources,
    addWebsiteSource,
    uploadDocumentSource,
    addFaqSource,
    deleteDataSource,
    updateDataSource,
    updateFaqSource,
    updateWebsiteSource,
    updateDocumentSource,
    updateDataSourceText,
    downloadDocument
} from "../controllers/dataSourceController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.get("/", getSources);
router.get("/:id/download", downloadDocument);

// Create routes
router.post("/website", addWebsiteSource);
router.post("/document", upload.single("document"), uploadDocumentSource);
router.post("/faq", addFaqSource);

// Update routes
router.put("/:id", updateDataSource); // generic top-level info (like name)
router.put("/website/:id", updateWebsiteSource);
router.put("/document/:id", upload.single("document"), updateDocumentSource);
router.put("/faq/:id", updateFaqSource);
router.put("/text/:id", updateDataSourceText);

// Delete routes
router.delete("/:id", deleteDataSource);

export default router;
