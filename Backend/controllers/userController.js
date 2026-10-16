const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const StoreCustomer = require('../models/StoreCustomer');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERMISSION_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes (120,000 ms)

async function signup(req, res, next) {
  try {
    const {
      name, role, email, password, confirmPassword,
      warehouseName, serviceCenter, staffLocation, customerStore,
      locationTag,
    } = req.body || {};

    if (!name || !name.trim()) return res.status(400).json({ error: 'Full Name is required' });
    if (!role || !role.trim()) return res.status(400).json({ error: 'Role is required' });

    if (!email || !emailRegex.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords must match' });
    }

    const exists = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hash = await bcrypt.hash(password, saltRounds);

    const cleanRole = role.trim();
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

    // Derive assignedLocation
    const assignedLocation =
      resolvedWarehouse ||
      resolvedServiceCenter ||
      resolvedStaffLocation ||
      resolvedCustomerStore ||
      '';

    // Save to User collection
    const user = await User.create({
      name: name.trim(),
      role: cleanRole,
      email: String(email).trim().toLowerCase(),
      password: hash,
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
            customerName: name.trim(),
            phoneNo: '0000000000',
          });
        }
      }
    } catch (dbSyncErr) {
      console.warn('Auxiliary collection sync warning:', dbSyncErr.message);
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        warehouseName: user.warehouseName,
        serviceCenter: user.serviceCenter,
        staffLocation: user.staffLocation,
        customerStore: user.customerStore,
        assignedLocation: user.assignedLocation,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
}

// ✅ UPDATED: roles come from SignUp data (User collection)
async function getRolesForEmail(req, res, next) {
  try {
    const { email } = req.query;
    const DEFAULT_ROLES = [
      'Super Admin',
      'Admin',
      'Manager',
      'Warehouse',
      'Service Person',
      'Staff',
      'Customer'
    ];

    // If email provided: return that user's role and registered locationTag if exists
    if (email) {
      const user = await User.findOne({ email: String(email).trim().toLowerCase() }).lean();
      if (user) {
        const locationTag =
          user.serviceCenter ||
          user.staffLocation ||
          user.customerStore ||
          user.warehouseName ||
          user.assignedLocation ||
          '';
        return res.json({ roles: [user.role], locationTag });
      }
    }

    // No email (or email not found): return DISTINCT roles from DB merged with DEFAULT_ROLES
    const roles = await User.distinct('role');
    const merged = [...new Set([...roles, ...DEFAULT_ROLES].map((r) => String(r).trim()))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return res.json({ roles: merged });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
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
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // 1. Role verification
    if (role && String(role).trim().toLowerCase() !== String(user.role).trim().toLowerCase()) {
      return res.status(401).json({ error: `Role '${role}' does not match registered role for this account.` });
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

    const token = jwt.sign(
      { sub: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
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
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, newPassword } = req.body || {};

    if (!id) return res.status(400).json({ error: 'User ID is required' });

    let user = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id).select('+password');
    }

    if (!user && email) {
      user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // Check 1: Exact Super Admin no one to change to Account Super Admin
    const isTargetSuperAdmin = (user.role || '').toLowerCase().includes('admin') || (user.name || '').toLowerCase().includes('lookman ho');
    const isRequestedRoleSuperAdmin = (role || '').trim().toLowerCase() === 'super admin';
    const isRequesterSuperAdmin = (req.body.requesterRole || '').toLowerCase().includes('admin') ||
                                  (req.body.requesterName || '').toLowerCase().includes('lookman ho') ||
                                  isTargetSuperAdmin;

    if (isRequestedRoleSuperAdmin && !isTargetSuperAdmin && !isRequesterSuperAdmin) {
      return res.status(403).json({
        error: 'Permission Denied: No one except the exact Super Admin can assign or change to the Super Admin role.',
      });
    }

    // Check 2: If the user is NOT Super Admin, they need permission from Super Admin to edit the account
    if (!isTargetSuperAdmin && !isRequesterSuperAdmin) {
      if (user.editPermissionStatus !== 'approved' && req.body.editPermissionStatus !== 'approved') {
        return res.status(403).json({
          error: 'Permission Required: You must obtain permission from Super Admin before editing this account. Please request edit access first.',
        });
      }

      // Check 2-minute expiration limit
      const grantedTime = user.editPermissionGrantedAt ? new Date(user.editPermissionGrantedAt).getTime() : 0;
      if (grantedTime && (Date.now() - grantedTime > PERMISSION_EXPIRY_MS)) {
        user.editPermissionStatus = 'expired';
        await user.save();
        return res.status(403).json({
          error: 'Permission Expired: Your edit permission was valid for only 2 minutes and has now expired. Please request permission from Super Admin again.',
        });
      }

      // One-time permission consumed upon update: reset to 'none'
      user.editPermissionStatus = 'none';
    }

    // Update fields if provided
    if (name && name.trim()) user.name = name.trim();
    if (role && role.trim()) {
      const cleanRole = role.trim();
      if (cleanRole.toLowerCase() === 'super admin' && !isTargetSuperAdmin && !isRequesterSuperAdmin) {
        return res.status(403).json({
          error: 'Permission Denied: Only Super Admin can hold the Super Admin role.',
        });
      }
      user.role = cleanRole;
    }

    // Clear old locations if role changes or if locations are passed
    user.warehouseName = '';
    user.serviceCenter = '';
    user.staffLocation = '';
    user.customerStore = '';
    user.assignedLocation = '';
    user.locationTag = '';

    if (req.body.warehouseName) {
      user.warehouseName = req.body.warehouseName;
      user.assignedLocation = req.body.warehouseName;
      user.locationTag = req.body.warehouseName;
    } else if (req.body.serviceCenter) {
      user.serviceCenter = req.body.serviceCenter;
      user.assignedLocation = req.body.serviceCenter;
      user.locationTag = req.body.serviceCenter;
    } else if (req.body.staffLocation) {
      user.staffLocation = req.body.staffLocation;
      user.assignedLocation = req.body.staffLocation;
      user.locationTag = req.body.staffLocation;
    } else if (req.body.customerStore) {
      user.customerStore = req.body.customerStore;
      user.assignedLocation = req.body.customerStore;
      user.locationTag = req.body.customerStore;
    } else if (req.body.assignedLocation || req.body.locationTag) {
      user.assignedLocation = req.body.assignedLocation || req.body.locationTag;
      user.locationTag = req.body.locationTag || req.body.assignedLocation;
    }

    if (email && emailRegex.test(String(email).trim().toLowerCase())) {
      const targetEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: targetEmail });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(409).json({ error: 'Email already in use by another account' });
      }
      user.email = targetEmail;
    }

    // Update password if provided
    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
      user.password = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    // Also sync to Location collection if serviceCenter is updated
    try {
      if (user.serviceCenter) {
        const locExists = await Location.findOne({
          locationName: { $regex: new RegExp(`^${user.serviceCenter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (!locExists) {
          await Location.create({ locationName: user.serviceCenter });
        }
      }
    } catch (locErr) {
      console.warn('Location sync warning:', locErr.message);
    }

    return res.json({
      message: 'Account updated successfully in database',
      user: {
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
        editPermissionStatus: user.editPermissionStatus || 'none',
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }
    next(err);
  }
}

async function requestEditPermission(req, res, next) {
  try {
    const { id } = req.params;
    let user = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user && req.body.email) {
      user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.editPermissionStatus = 'pending';
    user.editPermissionRequestedAt = new Date();
    await user.save();

    // Create real-time notification for Super Admin
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        category: 'COMMUNICATION',
        type: 'account_edit_request',
        title: `🔐 Account Edit Request: ${user.name}`,
        actionText: 'Requested permission to edit account details:',
        targetText: `${user.name} (${user.role}) is requesting Super Admin approval to edit account profile details and credentials.`,
        storeId: user.assignedLocation || user.warehouseName || user.customerStore || 'Store',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        userLocation: user.assignedLocation || user.warehouseName || user.customerStore || 'Branch',
        read: false,
        isRead: false,
      });
    } catch (notifErr) {
      console.warn('Notification creation warning:', notifErr.message);
    }

    return res.json({
      success: true,
      message: 'Edit permission request sent to Super Admin.',
      editPermissionStatus: 'pending',
    });
  } catch (err) {
    next(err);
  }
}

async function grantEditPermission(req, res, next) {
  try {
    const { id } = req.params;
    let user = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user && req.body.email) {
      user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.editPermissionStatus = 'approved';
    user.editPermissionGrantedAt = new Date();
    user.editPermissionGrantedBy = req.body.adminName || 'Super Admin';
    await user.save();

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        category: 'COMMUNICATION',
        type: 'account_edit_approved',
        title: `✅ Account Edit Access Granted (Valid 2 Mins)`,
        actionText: 'Super Admin granted you permission to edit your account (Valid for 2 minutes):',
        targetText: `Super Admin has granted permission to update your account details and password. This permission is valid for 2 minutes.`,
        storeId: user.assignedLocation || user.warehouseName || user.customerStore || 'Store',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        recipient: user.name,
        recipientId: String(user._id),
        read: false,
        isRead: false,
      });
    } catch (notifErr) {
      console.warn('Notification creation warning:', notifErr.message);
    }

    return res.json({
      success: true,
      message: `Edit access granted to ${user.name} (Valid for 2 minutes).`,
      editPermissionStatus: 'approved',
      grantedAt: user.editPermissionGrantedAt,
      expiresInMs: PERMISSION_EXPIRY_MS,
    });
  } catch (err) {
    next(err);
  }
}

async function rejectEditPermission(req, res, next) {
  try {
    const { id } = req.params;
    let user = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user && req.body.email) {
      user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.editPermissionStatus = 'rejected';
    await user.save();

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        category: 'COMMUNICATION',
        type: 'account_edit_rejected',
        title: `❌ Account Edit Request Declined`,
        actionText: 'Super Admin declined account edit request:',
        targetText: `Your request to edit account details was declined by Super Admin.`,
        storeId: user.assignedLocation || user.warehouseName || user.customerStore || 'Store',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        recipient: user.name,
        recipientId: String(user._id),
        read: false,
        isRead: false,
      });
    } catch (notifErr) {
      console.warn('Notification creation warning:', notifErr.message);
    }

    return res.json({
      success: true,
      message: `Edit request declined for ${user.name}.`,
      editPermissionStatus: 'rejected',
    });
  } catch (err) {
    next(err);
  }
}

async function getEditPermissionStatus(req, res, next) {
  try {
    const { id } = req.params;
    let user = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user && req.query.email) {
      user = await User.findOne({ email: String(req.query.email).trim().toLowerCase() });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    let status = user.editPermissionStatus || 'none';
    let remainingMs = 0;
    if (status === 'approved') {
      const grantedTime = user.editPermissionGrantedAt ? new Date(user.editPermissionGrantedAt).getTime() : 0;
      const elapsed = Date.now() - grantedTime;
      if (!grantedTime || elapsed > PERMISSION_EXPIRY_MS) {
        status = 'expired';
        user.editPermissionStatus = 'expired';
        await user.save();
      } else {
        remainingMs = Math.max(0, PERMISSION_EXPIRY_MS - elapsed);
      }
    }

    return res.json({
      success: true,
      editPermissionStatus: status,
      requestedAt: user.editPermissionRequestedAt,
      grantedAt: user.editPermissionGrantedAt,
      expiresInMs: remainingMs,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const userId = decoded.sub || decoded.id || decoded.userId;
    let user = null;
    if (userId && String(userId).match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId).select('-password');
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: String(decoded.email).trim().toLowerCase() }).select('-password');
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    let status = user.editPermissionStatus || 'none';
    if (status === 'approved') {
      const grantedTime = user.editPermissionGrantedAt ? new Date(user.editPermissionGrantedAt).getTime() : 0;
      if (!grantedTime || (Date.now() - grantedTime > PERMISSION_EXPIRY_MS)) {
        status = 'expired';
        user.editPermissionStatus = 'expired';
        await user.save();
      }
    }

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
      editPermissionStatus: user.editPermissionStatus || 'none',
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({}, '-password').lean();
    return res.json({ users });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  getRolesForEmail,
  login,
  updateUser,
  getAllUsers,
  getMe,
  requestEditPermission,
  grantEditPermission,
  rejectEditPermission,
  getEditPermissionStatus,
};
