import DiaryEntry from "../models/DiaryEntry.js";

export const getDiaryEntries = async (req, res) => {
  try {
    const entries = await DiaryEntry.find({ userId: req.user._id })
      .populate("petId", "name breed")
      .sort({ date: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching diary entries", error: error.message });
  }
};

export const createDiaryEntry = async (req, res) => {
  try {
    const { petId, title, content, mood } = req.body;
    const imageUrl = req.file ? `/uploads/pets/${req.file.filename}` : null;

    const entry = await DiaryEntry.create({
      userId: req.user._id,
      petId,
      title,
      content,
      mood,
      imageUrl,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Error creating diary entry", error: error.message });
  }
};
