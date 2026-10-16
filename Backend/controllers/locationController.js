// const Location = require('../models/Location');

// // Create a new location
// exports.createLocation = async (req, res) => {
//   const location = new Location({
//     locationName: req.body.locationName,
//     createdOn: req.body.createdOn,
//     status: req.body.status,
//   });

//   try {
//     const newLocation = await location.save();
//     res.status(201).json(newLocation);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // Get all locations
// exports.getAllLocations = async (req, res) => {
//   try {
//     const locations = await Location.find();
//     res.json(locations);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Update a location
// exports.updateLocation = async (req, res) => {
//   try {
//     const updatedLocation = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updatedLocation);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // Delete a location
// exports.deleteLocation = async (req, res) => {
//   try {
//     await Location.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Location deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const Location = require('../models/Location');

// Create a new location
exports.createLocation = async (req, res) => {
  const location = new Location({
    locationName: req.body.locationName,
    createdOn: req.body.createdOn,
    status: req.body.status,
  });

  try {
    const newLocation = await location.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a location
exports.updateLocation = async (req, res) => {
  try {
    const updatedLocation = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a location
exports.deleteLocation = async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
