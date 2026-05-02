import { Readable } from "node:stream";
import DiaryEntry from "../models/DiaryEntry.js";
import cloudinary from "../config/cloudinary.js";

const uploadImageToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "wmt-base/diary",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });

const uploadBase64ImageToCloudinary = (base64, mimeType = "image/jpeg") =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64}`,
      {
        folder: "wmt-base/diary",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );
  });

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";

  return fallback;
};

// CREATE – Post a new diary entry
export const createDiaryEntry = async (req, res) => {
  try {
    console.log('CreateDiaryEntry request headers:', req.headers && Object.keys(req.headers).length ? { contentType: req.headers['content-type'] } : {});
    console.log('CreateDiaryEntry body keys:', Object.keys(req.body || {}));
    console.log('CreateDiaryEntry file:', !!req.file);
    const { petName, petType, title, content, rating, serviceDate, photoUrl, photoBase64, photoMimeType } = req.body;
    const isPublic = parseBoolean(req.body.isPublic, true);
    let uploadedPhotoUrl = photoUrl || null;

    if (!petName || !title || !content || !rating || !serviceDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (req.file) {
      const uploadResult = await uploadImageToCloudinary(req.file);
      uploadedPhotoUrl = uploadResult.secure_url;
    } else if (photoBase64) {
      const uploadResult = await uploadBase64ImageToCloudinary(photoBase64, photoMimeType || "image/jpeg");
      uploadedPhotoUrl = uploadResult.secure_url;
    }

    const entry = await DiaryEntry.create({
      user: req.user._id,
      petName,
      petType: petType || "dog",
      title,
      content,
      rating: Number(rating),
      serviceDate: new Date(serviceDate),
      photoUrl: uploadedPhotoUrl,
      isPublic,
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Create diary entry error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error creating diary entry", error: error?.message || String(error) });
  }
};

// READ – Get public diary feed (all users)
export const getDiaryFeed = async (_req, res) => {
  try {
    const entries = await DiaryEntry.find({ isPublic: true })
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(entries);
  } catch (error) {
    console.error("Get diary feed error:", error);
    res.status(500).json({ message: "Server error fetching diary feed" });
  }
};

// READ – Get current user's diary entries
export const getMyDiaryEntries = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    console.error("Get my diary entries error:", error);
    res.status(500).json({ message: "Server error fetching your diary entries" });
  }
};

// READ – Get a single diary entry by ID
export const getDiaryEntryById = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id).populate("user", "fullName");

    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Get diary entry error:", error);
    res.status(500).json({ message: "Server error fetching diary entry" });
  }
};

// UPDATE – Edit a diary entry (owner only)
export const updateDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this entry" });
    }

    const { petName, petType, title, content, rating, serviceDate, photoUrl, photoBase64, photoMimeType } = req.body;
    const isPublic = req.body.isPublic !== undefined ? parseBoolean(req.body.isPublic, entry.isPublic) : undefined;
    let uploadedPhotoUrl = photoUrl;

    if (req.file) {
      const uploadResult = await uploadImageToCloudinary(req.file);
      uploadedPhotoUrl = uploadResult.secure_url;
    } else if (photoBase64) {
      const uploadResult = await uploadBase64ImageToCloudinary(photoBase64, photoMimeType || "image/jpeg");
      uploadedPhotoUrl = uploadResult.secure_url;
    }

    if (petName !== undefined) entry.petName = petName;
    if (petType !== undefined) entry.petType = petType;
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content;
    if (rating !== undefined) entry.rating = Number(rating);
    if (serviceDate !== undefined) entry.serviceDate = new Date(serviceDate);
    if (uploadedPhotoUrl !== undefined) entry.photoUrl = uploadedPhotoUrl;
    if (isPublic !== undefined) entry.isPublic = isPublic;

    const updated = await entry.save();
    res.json(updated);
  } catch (error) {
    console.error("Update diary entry error:", error && error.stack ? error.stack : error);
    res.status(500).json({ message: "Server error updating diary entry", error: error?.message || String(error) });
  }
};

// DELETE – Remove a diary entry (owner only)
export const deleteDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this entry" });
    }

    await DiaryEntry.findByIdAndDelete(req.params.id);
    res.json({ message: "Diary entry deleted successfully" });
  } catch (error) {
    console.error("Delete diary entry error:", error);
    res.status(500).json({ message: "Server error deleting diary entry" });
  }
};
