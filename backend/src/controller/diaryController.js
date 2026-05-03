import DiaryEntry from "../models/DiaryEntry.js";

// Create a new diary entry
export const createDiaryEntry = async (req, res) => {
  try {
    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/pets/${req.file.filename}`;
    }

    const entry = await DiaryEntry.create({
      ...req.body,
      user: req.user._id,
      photoUrl,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error creating diary entry", error: error.message });
  }
};

// Get public feed
export const getPublicFeed = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ isPublic: true })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public feed", error: error.message });
  }
};

// Get user's own entries
export const getMyEntries = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ user: req.user._id })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching my entries", error: error.message });
  }
};

// Update diary entry
export const updateDiaryEntry = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.photoUrl = `/uploads/pets/${req.file.filename}`;
    }

    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!entry) return res.status(404).json({ message: "Entry not found or unauthorized" });
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error updating diary entry", error: error.message });
  }
};

// Delete diary entry
export const deleteDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ message: "Entry not found or unauthorized" });
    res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting diary entry", error: error.message });
  }
};
