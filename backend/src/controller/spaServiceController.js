
  }
};

export const createService = async (req, res) => {
  try {

    });

    res.status(201).json(booking);
  } catch (error) {

  }
};

export const verifyBooking = async (req, res) => {
  try {
    const booking = await SpaBooking.findByIdAndUpdate(
      req.params.id,
      { status: "Confirmed" },

  }
};
