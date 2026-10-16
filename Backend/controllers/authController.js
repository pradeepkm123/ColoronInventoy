// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
// const SALT_ROUNDS = 10;

// const normalizeEmail = (e) => (e || '').toLowerCase().trim();

// // POST /api/auth/signup
// exports.signUp = async (req, res) => {
//   try {
//     let { name, email, password, confirmpassword, role } = req.body;

//     if (!name || !email || !password || !role) {
//       return res
//         .status(400)
//         .json({ error: 'All fields (name, email, password, role) are required.' });
//     }

//     if (confirmpassword !== undefined && confirmpassword !== password) {
//       return res.status(400).json({ error: 'Passwords do not match.' });
//     }

//     email = normalizeEmail(email);
//     role = String(role).trim();

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(409).json({ error: 'Email already registered.' });

//     const hash = await bcrypt.hash(password, SALT_ROUNDS);
//     const user = await User.create({ name: String(name).trim(), email, password: hash, role });

//     return res.status(201).json({
//       message: 'User created',
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('SIGNUP ERROR', err);
//     return res.status(500).json({ error: 'Server error.' });
//   }
// };

// // POST /api/auth/login
// exports.login = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required.' });
//     }

//     const user = await User.findOne({ email: normalizeEmail(email) });
//     if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(400).json({ error: 'Invalid credentials.' });

//     // If a role is provided on login, check case-insensitively
//     if (
//       role &&
//       String(role).trim().toLowerCase() !== String(user.role).trim().toLowerCase()
//     ) {
//       return res
//         .status(400)
//         .json({ error: 'Role does not match the registered role for this email.' });
//     }

//     const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
//     return res.json({
//       token,
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('LOGIN ERROR', err);
//     return res.status(500).json({ error: 'Server error.' });
//   }
// };

// // GET /api/auth/roles?email=someone@example.com
// // Returns only the role(s) for the provided email. If email missing/not found -> { roles: [] }.
// exports.getRoles = async (req, res) => {
//   try {
//     const email = req.query.email ? normalizeEmail(req.query.email) : '';

//     if (!email) {
//       // Do NOT expose global roles
//       return res.json({ roles: [] });
//     }

//     // With unique emails, this will be a single user; still future-proof
//     const user = await User.findOne({ email }, 'role');
//     const roles = user && user.role ? [String(user.role).trim()] : [];

//     // sort case-insensitively just in case
//     const sorted = roles.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
//     return res.json({ roles: sorted });
//   } catch (err) {
//     console.error('GET ROLES ERROR', err);
//     return res.status(500).json({ error: 'Failed to fetch roles' });
//   }
// };

// /* ---- Optional backward-compat alias ---- */

// // Some code might still import `signup` (lowercase n)
// exports.signup = exports.signUp;


const User = require('../models/User');
const Notification = require('../models/Notification');
const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const StoreCustomer = require('../models/StoreCustomer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getInitials = (name = '') => {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  );
};

const getRandomColor = (role = '') => {
  const roleLower = (role || '').toLowerCase();
  if (roleLower.includes('admin')) return '#7c3aed';
  if (roleLower.includes('warehouse')) return '#0284c7';
  if (roleLower.includes('service')) return '#059669';
  if (roleLower.includes('store') || roleLower.includes('cctv')) return '#ea580c';
  if (roleLower.includes('staff')) return '#0d9488';
  return '#1976d2';
};

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const SALT_ROUNDS = 10;

const normalizeEmail = (e) => (e || '').toLowerCase().trim();

// POST /api/auth/signup
exports.signUp = async (req, res) => {
  try {
    let {
      name, email, password, confirmpassword, role,
      warehouseName, serviceCenter, staffLocation, customerStore,
      locationTag,
    } = req.body || {};

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: 'All fields (name, email, password, role) are required.' });
    }

    if (confirmpassword !== undefined && confirmpassword !== password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    email = normalizeEmail(email);
    const cleanRole = String(role).trim();
    const locVal = (locationTag || '').trim();
    const resolvedWarehouse = (warehouseName || (cleanRole === 'Warehouse' ? locVal : '') || '').trim();
    const resolvedServiceCenter = (serviceCenter || (cleanRole === 'Service Person' ? locVal : '') || '').trim();
    const resolvedStaffLocation = (staffLocation || (cleanRole === 'Staff' ? locVal : '') || '').trim();
    const resolvedCustomerStore = (customerStore || (cleanRole === 'Customer' ? locVal : '') || '').trim();

    // Enforce required fields per role
    if (cleanRole === 'Service Person' && !resolvedServiceCenter) {
      return res.status(400).json({ error: 'Service Center is required for Service Person role.' });
    }
    if (cleanRole === 'Warehouse' && !resolvedWarehouse) {
      return res.status(400).json({ error: 'Warehouse Name is required for Warehouse role.' });
    }
    if (cleanRole === 'Staff' && !resolvedStaffLocation) {
      return res.status(400).json({ error: 'Staff Location is required for Staff role.' });
    }
    if (cleanRole === 'Customer' && !resolvedCustomerStore) {
      return res.status(400).json({ error: 'Store Name is required for Customer role.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const assignedLocation =
      resolvedWarehouse ||
      resolvedServiceCenter ||
      resolvedStaffLocation ||
      resolvedCustomerStore ||
      '';

    const user = await User.create({
      name: String(name).trim(),
      email,
      password: hash,
      role: cleanRole,
      warehouseName: resolvedWarehouse,
      serviceCenter: resolvedServiceCenter,
      staffLocation: resolvedStaffLocation,
      customerStore: resolvedCustomerStore,
      assignedLocation,
      locationTag: locVal || assignedLocation,
    });

    // Also ensure Service Center / Location is saved to the Location collection in DB
    try {
      if (resolvedServiceCenter) {
        const locExists = await Location.findOne({
          locationName: { $regex: new RegExp(`^${resolvedServiceCenter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (!locExists) {
          await Location.create({ locationName: resolvedServiceCenter });
        }
      }
      if (resolvedStaffLocation) {
        const locExists = await Location.findOne({
          locationName: { $regex: new RegExp(`^${resolvedStaffLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (!locExists) {
          await Location.create({ locationName: resolvedStaffLocation });
        }
      }
      if (resolvedWarehouse) {
        const whExists = await Warehouse.findOne({
          warehouse: { $regex: new RegExp(`^${resolvedWarehouse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (!whExists) {
          await Warehouse.create({ warehouse: resolvedWarehouse });
        }
      }
      if (resolvedCustomerStore) {
        const storeExists = await StoreCustomer.findOne({
          storeName: { $regex: new RegExp(`^${resolvedCustomerStore.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (!storeExists) {
          await StoreCustomer.create({
            storeName: resolvedCustomerStore,
            customerName: String(name).trim(),
            phoneNo: '0000000000',
          });
        }
      }
    } catch (dbSyncErr) {
      console.warn('Auxiliary collection sync warning:', dbSyncErr.message);
    }

    return res.status(201).json({
      message: 'User created',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        warehouseName: user.warehouseName,
        serviceCenter: user.serviceCenter,
        staffLocation: user.staffLocation,
        customerStore: user.customerStore,
        assignedLocation: user.assignedLocation,
      },
    });
  } catch (err) {
    console.error('SIGNUP ERROR', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      locationTag,
      staffLocation,
      serviceCenter,
      customerStore,
      warehouseName,
      assignedLocation,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials.' });

    // 1. Role verification
    if (
      role &&
      String(role).trim().toLowerCase() !== String(user.role).trim().toLowerCase()
    ) {
      return res
        .status(401)
        .json({ error: 'Role does not match the registered role for this email.' });
    }

    const effectiveRole = String(role || user.role).trim();
    const locTag = String(locationTag || '').trim();

    // 2. Staff check
    if (effectiveRole.toLowerCase() === 'staff') {
      const inputVal = String(staffLocation || locTag || assignedLocation || '').trim();
      const dbVal = String(user.staffLocation || user.assignedLocation || user.locationTag || '').trim();
      if (!inputVal) {
        return res.status(400).json({ error: 'Staff Location is required to login.' });
      }
      if (inputVal.toLowerCase() !== dbVal.toLowerCase()) {
        return res.status(401).json({
          error: `Staff Location '${inputVal}' does not match registered staff location for this account.`,
        });
      }
    }

    // 3. Service Person check
    if (effectiveRole.toLowerCase() === 'service person') {
      const inputVal = String(serviceCenter || locTag || assignedLocation || '').trim();
      const dbVal = String(user.serviceCenter || user.assignedLocation || user.locationTag || '').trim();
      if (!inputVal) {
        return res.status(400).json({ error: 'Service Center is required to login.' });
      }
      if (inputVal.toLowerCase() !== dbVal.toLowerCase()) {
        return res.status(401).json({
          error: `Service Center '${inputVal}' does not match registered service center for this account.`,
        });
      }
    }

    // 4. Warehouse check
    if (effectiveRole.toLowerCase() === 'warehouse') {
      const inputVal = String(warehouseName || locTag || assignedLocation || '').trim();
      const dbVal = String(user.warehouseName || user.assignedLocation || user.locationTag || '').trim();
      if (!inputVal) {
        return res.status(400).json({ error: 'Warehouse Name is required to login.' });
      }
      if (inputVal.toLowerCase() !== dbVal.toLowerCase()) {
        return res.status(401).json({
          error: `Warehouse Name '${inputVal}' does not match registered warehouse for this account.`,
        });
      }
    }

    // 5. Customer check
    if (effectiveRole.toLowerCase() === 'customer') {
      const inputVal = String(customerStore || locTag || assignedLocation || '').trim();
      const dbVal = String(user.customerStore || user.assignedLocation || user.locationTag || '').trim();
      if (!inputVal) {
        return res.status(400).json({ error: 'Store Name is required to login.' });
      }
      if (inputVal.toLowerCase() !== dbVal.toLowerCase()) {
        return res.status(401).json({
          error: `Store Name '${inputVal}' does not match registered store for this account.`,
        });
      }
    }

    const resolvedUserLoc =
      user.warehouseName ||
      user.serviceCenter ||
      user.staffLocation ||
      user.customerStore ||
      user.assignedLocation ||
      user.locationTag ||
      locTag ||
      '';

    // 🔔 Create Targeted Login Notification
    try {
      const superAdminUser = await User.findOne({
        role: { $regex: /super admin|admin/i }
      }).lean();

      const isSuperAdminLogin = effectiveRole.toLowerCase().includes('admin');
      const locLabel = resolvedUserLoc ? ` (${resolvedUserLoc})` : '';

      await Notification.create({
        category: 'AUTH',
        type: 'LOGIN',
        senderId: user._id,
        senderName: user.name,
        senderEmail: user.email,
        senderRole: user.role,
        recipientId: superAdminUser?._id || null,
        recipientRole: 'SUPER_ADMIN',
        recipientName: superAdminUser?.name || 'Super Admin',
        storeId: resolvedUserLoc,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        userLocation: resolvedUserLoc,
        actionText: 'logged into the system',
        targetText: `${user.role}${locLabel}`,
        title: `🔐 Login: ${user.name}`,
        message: `${user.name} (${user.role}${locLabel}) logged in successfully.`,
        read: false,
        isRead: false,
        avatarInitials: getInitials(user.name),
        avatarColor: getRandomColor(user.role),
        metadata: {
          loginTime: new Date(),
          role: user.role,
          storeLocation: resolvedUserLoc,
          isSuperAdmin: isSuperAdminLogin,
        },
      });
      console.log(`🔐 [Notification] Created login notification for: ${user.name} (${user.role}${locLabel})`);
    } catch (notifErr) {
      console.warn('Login notification creation warning:', notifErr.message);
    }

    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        warehouseName: user.warehouseName || '',
        serviceCenter: user.serviceCenter || '',
        staffLocation: user.staffLocation || '',
        customerStore: user.customerStore || '',
        assignedLocation: user.assignedLocation || '',
        locationTag: user.locationTag || user.assignedLocation || '',
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/auth/roles?email=someone@example.com
// Returns only the role(s) for the provided email. If email missing/not found -> { roles: [] }.
exports.getRoles = async (req, res) => {
  try {
    const email = req.query.email ? normalizeEmail(req.query.email) : '';

    if (!email) {
      // Do NOT expose global roles
      return res.json({ roles: [] });
    }

    // With unique emails, this will be a single user; still future-proof
    const user = await User.findOne({ email });
    const roles = user && user.role ? [String(user.role).trim()] : [];
    const locationTag = user
      ? (user.serviceCenter || user.staffLocation || user.customerStore || user.warehouseName || user.assignedLocation || '')
      : '';

    // sort case-insensitively just in case
    const sorted = roles.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return res.json({ roles: sorted, locationTag });
  } catch (err) {
    console.error('GET ROLES ERROR', err);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub || decoded.id || decoded.userId;
    let user = null;
    if (userId && String(userId).match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId).select('-password');
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: normalizeEmail(decoded.email) }).select('-password');
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      warehouseName: user.warehouseName || '',
      serviceCenter: user.serviceCenter || '',
      staffLocation: user.staffLocation || '',
      customerStore: user.customerStore || '',
      assignedLocation: user.assignedLocation || '',
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/* ---- Optional backward-compat alias ---- */

// Some code might still import `signup` (lowercase n)
exports.signup = exports.signUp;
