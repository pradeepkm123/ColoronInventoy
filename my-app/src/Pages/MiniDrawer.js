import * as React from 'react';
import { useUser } from './UserContext';
import Spinner from '../Components/Spinner';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// Material Icons for AppBar
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LogoutIcon from '@mui/icons-material/Logout';
import CircleIcon from '@mui/icons-material/Circle';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ColoronLogo from '../assets/img/coloron.png';
import Fav from '../assets/img/fav.png';

// Lucide Line Icons matching Reference Image 1 & 2
import {
  LayoutDashboard,
  Box as BoxIcon,
  PackagePlus,
  Clock,
  TrendingDown,
  LayoutList,
  GitFork,
  Award,
  Barcode,
  QrCode,
  Layers,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  History as HistoryIconLucide,
  ShoppingCart,
  FileText,
  Users,
  UserCheck,
  Warehouse,
  MapPin,
  Store,
  Building,
  Package,
  Boxes,
  Wrench,
  Settings,
  BarChart3,
  Truck,
  UserPlus,
  Bell,
  ChevronRight,
  ChevronDown,
  Search,
  Tag,
  Cpu,
  CheckCircle2,
  Scan,
  PlusCircle,
  CircuitBoard,
  X,
  SearchX,
} from 'lucide-react';

import logo from '../assets/img/Lookman.png';
import EditAccountModal from '../Components/EditAccountModal';

// Pages
import Home from './Home';
import SignUp from './Signup';
import Master from './Master';
import AddProduct from './AddProduct';
import ExpiredProductsView from './ExpiredProductsView';
import LowStockView from './LowStockView';
import CategoryManagement from './CategoryManagement';
import SubCategoryManagement from './SubCategoryManagement';
import Brand from './Brand';
import Accessories from './Accessories';
import Spares from './Spares';
import SparePartsManagement from './SparePartsManagement';
import PrintBarcodeView from './PrintBarcodeView';
import CartonBoxView from './CartonBoxView';
import ProductLabelView from './ProductLabelView';
import PurchaseOrders from './PurchaseOrders';

import Inventorys from './Inventorys';
import StockAdjustmentView from './StockAdjustmentView';
import StockInward from './StockInward';
import StockOutward from './StockOutward';
import History from './History';

import SalesInvoice from './SalesInvoice';
import Invoice from './Invoice';
import SalesPerson from './SalesPerson';
import Customer from './Customer';

import Warehouses from './Warehouses';
import Location from './Location';
import WarehouseStoreDetails from './WarehouseStoreDetails';
import StoreDetails from './StoreDetails';
import StoreManagement from './Storemanagement';
import StoreHome from './StoreHome';
import StoreInward from './StoreInward';
import StoreDispatched from './StoreDispatched';
import StoreCustomer from './StoreCustomer';

import PackingItem from './PackingItem';
import Rawmaterial from './Rawmaterials';
import ServiceDashboard from './ServiceDashboard';
import OurServices from './OurServices';
import RaiseService from './RaiseService';
import ServiceRequests from './ServiceRequests';
import RMAListPage from './RMAListPage';
import ServiceTracking from './ServiceTracking';

import Reports from './Reports';
import Notifications, { getNotificationStartDate, formatNotificationTime } from './Notifications';
import {
  fetchLiveNotifications,
  getUserNotificationSummary,
  markItemAsRead,
  markAllItemsAsRead,
  formatNotificationCount,
} from '../services/notificationService';
import { initSocketClient } from '../services/socketService';

// Auxiliary views
import RecentInwardsView from './RecentInwardsView';
import RecentOutwardView from './RecentOutwardView';
import DispatchAnalyticsView from './DispatchAnalyticsView';
import TotalProductsView from './TotalProductsView';
import TopSellingProductsView from './TopSellingProductsView';
import TopCustomersView from './TopCustomersView';
import WarrantyCheckModal from '../Components/WarrantyCheckModal';

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #eef2f6',
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: collapsedDrawerWidth,
  backgroundColor: '#ffffff',
  borderRight: '1px solid #eef2f6',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  minHeight: 64,
  borderBottom: '1px solid #f1f5f9',
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: '#0f2b48',
  boxShadow: '0 2px 10px rgba(15, 43, 72, 0.15)',
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerComponent = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

// Real Working Clock Icon with smoothly animated rotating hands
const WorkingClockIcon = () => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: 20,
      height: 20,
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      color: '#e2e8f0',
      '@keyframes secondHandSpin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      '@keyframes minuteHandSpin': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      '@keyframes hourHandSpin': {
        from: { transform: 'rotate(90deg)' },
        to: { transform: 'rotate(450deg)' },
      },
      '@keyframes centerPointPulse': {
        '0%, 100%': { opacity: 0.85, transform: 'scale(1)', filter: 'drop-shadow(0 0 0px #38bdf8)' },
        '50%': { opacity: 1, transform: 'scale(1.25)', filter: 'drop-shadow(0 0 2px #38bdf8)' },
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& .clock-second-hand, & .clock-minute-hand, & .clock-hour-hand, & .clock-center': {
          animation: 'none !important',
        },
      },
    }}
  >
    {/* Fixed Outer Clock Circle */}
    <circle
      cx="12"
      cy="12"
      r="9.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />

    {/* Hour Hand (starts at 3 o'clock / 90deg, moves smoothly 🕒 -> 🕓 -> 🕔) */}
    <g
      className="clock-hour-hand"
      style={{
        transformOrigin: '12px 12px',
        transformBox: 'view-box',
        animation: 'hourHandSpin 240s linear infinite',
      }}
    >
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </g>

    {/* Minute Hand (moves smoothly/progressively) */}
    <g
      className="clock-minute-hand"
      style={{
        transformOrigin: '12px 12px',
        transformBox: 'view-box',
        animation: 'minuteHandSpin 720s linear infinite',
      }}
    >
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>

    {/* Second Hand (rotates smoothly 360° every 60 seconds) */}
    <g
      className="clock-second-hand"
      style={{
        transformOrigin: '12px 12px',
        transformBox: 'view-box',
        animation: 'secondHandSpin 60s linear infinite',
      }}
    >
      <line
        x1="12"
        y1="13.5"
        x2="12"
        y2="4.2"
        stroke="#38bdf8"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </g>

    {/* Active Center Pivot with subtle 1s pulse/glow */}
    <circle
      className="clock-center"
      cx="12"
      cy="12"
      r="1.3"
      fill="#ffffff"
      style={{
        transformOrigin: '12px 12px',
        transformBox: 'view-box',
        animation: 'centerPointPulse 1s ease-in-out infinite',
      }}
    />
  </Box>
);

// Live Clock Display Component that continuously updates every second
const LiveClockDisplay = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = React.useMemo(() => {
    try {
      return time.toLocaleString('en-IN');
    } catch {
      return time.toLocaleString();
    }
  }, [time]);

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        mr: 2.5,
        gap: 1,
        color: '#e2e8f0',
      }}
      title="Current time (Asia/Kolkata)"
    >
      <WorkingClockIcon />
      <Typography variant="body2" sx={{ lineHeight: 1, fontWeight: 500, userSelect: 'none' }}>
        {timeString}
      </Typography>
    </Box>
  );
};


// Functional Fullscreen Icon with 4 corner brackets animating outward/inward
const FunctionalFullscreenIcon = ({ isFullscreen, isClicked }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: 20,
      height: 20,
      display: 'inline-block',
      verticalAlign: 'middle',
      overflow: 'visible',
      color: '#ffffff',
      '@keyframes fsExpandTL': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(-2.5px, -2.5px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsExpandTR': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(2.5px, -2.5px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsExpandBL': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(-2.5px, 2.5px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsExpandBR': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(2.5px, 2.5px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsContractTL': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(2px, 2px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsContractTR': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(-2px, 2px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsContractBL': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(2px, -2px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@keyframes fsContractBR': {
        '0%': { transform: 'translate(0, 0)' },
        '50%': { transform: 'translate(-2px, -2px)' },
        '100%': { transform: 'translate(0, 0)' },
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& g, & path': {
          animation: 'none !important',
          transition: 'none !important',
        },
      },
    }}
  >
    {!isFullscreen ? (
      <>
        <g
          className="fs-bracket-tl"
          style={{
            transformOrigin: '5px 5px',
            transform: isClicked ? 'translate(-2.5px, -2.5px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M5 9.5V5h4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-tr"
          style={{
            transformOrigin: '19px 5px',
            transform: isClicked ? 'translate(2.5px, -2.5px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M14.5 5H19v4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-bl"
          style={{
            transformOrigin: '5px 19px',
            transform: isClicked ? 'translate(-2.5px, 2.5px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M5 14.5V19h4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-br"
          style={{
            transformOrigin: '19px 19px',
            transform: isClicked ? 'translate(2.5px, 2.5px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M14.5 19H19v-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ) : (
      <>
        <g
          className="fs-bracket-exit-tl"
          style={{
            transformOrigin: '9px 9px',
            transform: isClicked ? 'translate(2px, 2px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M5 9h4V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-exit-tr"
          style={{
            transformOrigin: '15px 9px',
            transform: isClicked ? 'translate(-2px, 2px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M19 9h-4V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-exit-bl"
          style={{
            transformOrigin: '9px 15px',
            transform: isClicked ? 'translate(2px, -2px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M5 15h4v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g
          className="fs-bracket-exit-br"
          style={{
            transformOrigin: '15px 15px',
            transform: isClicked ? 'translate(-2px, -2px)' : 'translate(0, 0)',
            transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          <path
            d="M19 15h-4v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    )}
  </Box>
);

// Navigation Groups matching Reference Image 1 and Lookman system
const navigationSections = [
  {
    groupTitle: 'Dashboard',
    items: [
      { id: 'home', text: 'Home', content: <Home />, icon: LayoutDashboard },
    ],
  },
  {
    groupTitle: 'Inventory',
    items: [
      { id: 'products', text: 'Products', content: <Master />, icon: BoxIcon },
      { id: 'create_product', text: 'Create Product', content: <AddProduct />, icon: PackagePlus },
      { id: 'expired_products', text: 'Expired Products', content: <ExpiredProductsView />, icon: Clock, badge: 'Alert' },
      { id: 'low_stocks', text: 'Low Stocks', content: <LowStockView />, icon: TrendingDown, badge: 'Warning' },
      { id: 'category', text: 'Category', content: <CategoryManagement />, icon: LayoutList },
      { id: 'sub_category', text: 'Sub Category', content: <SubCategoryManagement />, icon: GitFork },
      { id: 'brands', text: 'Brands', content: <Brand />, icon: Award },
      { id: 'accessories', text: 'Accessories', content: <Accessories />, icon: Cpu },
      { id: 'spares', text: 'Spares Inventory', content: <Spares />, icon: Wrench },
      { id: 'spare_parts_management', text: 'Spare Parts Management', content: <SparePartsManagement />, icon: CircuitBoard },
      { id: 'purchase_orders', text: 'Purchase Orders', content: <PurchaseOrders />, icon: ShoppingCart },
      { id: 'print_barcode', text: 'Print Barcode', content: <PrintBarcodeView />, icon: Barcode },
      { id: 'carton_box', text: 'Carton Box', content: <CartonBoxView />, icon: BoxIcon },
      { id: 'product_label', text: 'Product Label', content: <ProductLabelView />, icon: Tag },
    ],
  },
  {
    groupTitle: 'Sales',
    items: [
      { id: 'invoices', text: 'Invoices', content: <Invoice />, icon: FileText },
      { id: 'sales_person', text: 'Sales Person', content: <SalesPerson />, icon: Users },
      { id: 'customer', text: 'Customer', content: <Customer />, icon: UserCheck },
    ],
  },
  {
    groupTitle: 'Store & Warehouses',
    items: [
      { id: 'warehouses', text: 'Warehouses', content: <Warehouses />, icon: Warehouse },
      { id: 'locations', text: 'Locations', content: <Location />, icon: MapPin },
      { id: 'warehouse_store_details', text: 'Warehouse Store Details', content: <WarehouseStoreDetails />, icon: Building },
      { id: 'store_details', text: 'Customer Store Details', content: <StoreDetails />, icon: Store },
      { id: 'store_management', text: 'Store Management', content: <StoreManagement />, icon: Building },
      { id: 'store_home', text: 'Store Home', content: <StoreHome />, icon: Store },
      { id: 'store_inward_details', text: 'StoreInward Details', content: <StoreInward />, icon: ArrowDownToLine },
      { id: 'store_dispatched', text: 'Dispatched Details', content: <StoreDispatched />, icon: Truck },
      { id: 'store_customer', text: 'StoreCustomer', content: <StoreCustomer />, icon: Users },
    ],
  },
  {
    groupTitle: 'Service & RMA',
    items: [
      { id: 'service_dashboard', text: 'Service Dashboard', content: <ServiceDashboard />, icon: Wrench },
      { id: 'raise_service', text: 'Raise Service', content: <RaiseService />, icon: PlusCircle },
      { id: 'service_requests', text: 'Service Requests', content: <ServiceRequests />, icon: Layers },
      { id: 'rma_lifecycle', text: 'RMA Control Hub', content: <RMAListPage />, icon: Settings },
      { id: 'service_tracking', text: 'Service Tracking', content: <ServiceTracking />, icon: Clock },
    ],
  },
  {
    groupTitle: 'Materials & Packaging',
    items: [
      { id: 'packaging_items', text: 'Packaging Items', content: <PackingItem />, icon: Package },
      { id: 'raw_materials', text: 'Raw Materials', content: <Rawmaterial />, icon: Boxes },
    ],
  },
  {
    groupTitle: 'Stock',
    items: [
      { id: 'manage_stock', text: 'Manage Stock', content: <Inventorys />, icon: Layers },
      { id: 'stock_adjustment', text: 'Stock Adjustment', content: <StockAdjustmentView />, icon: ArrowUpDown },
      { id: 'stock_inward', text: 'Stock Inward', content: <StockInward />, icon: ArrowDownToLine },
      { id: 'stock_outward', text: 'Stock Outward', content: <StockOutward />, icon: ArrowUpFromLine },
      { id: 'transfer_history', text: 'Transfer History', content: <History />, icon: HistoryIconLucide },
    ],
  },
  {
    groupTitle: 'Reports & Admin',
    items: [
      { id: 'reports', text: 'Reports', content: <Reports />, icon: BarChart3 },
      { id: 'register', text: 'Register', content: <SignUp />, icon: UserPlus },
      { id: 'notifications', text: 'Notifications', content: <Notifications />, icon: Bell },
    ],
  },
];

export default function MiniDrawer() {
  const { user, logout, updateUser } = useUser();
  const theme = useTheme();
  const roleLowerInitial = (user?.role || '').toLowerCase().trim();
  const isInitialAdmin = ['admin', 'super admin', 'manager'].includes(roleLowerInitial) || roleLowerInitial.includes('admin') || roleLowerInitial.includes('super admin');
  const isSuperAdmin = roleLowerInitial === 'super admin' || roleLowerInitial.includes('super admin');
  const isInitialService = roleLowerInitial.includes('service') || roleLowerInitial === 'engineer' || roleLowerInitial === 'technician';

  const [open, setOpen] = React.useState(true);
  const [activeItemId, setActiveItemId] = React.useState(
    isInitialService ? 'service_dashboard' : (isInitialAdmin ? 'home' : 'store_home')
  );
  const [selectedItem, setSelectedItem] = React.useState(
    isInitialService ? <ServiceDashboard /> : (isInitialAdmin ? <Home /> : <StoreHome />)
  );

  const [drawerSearchQuery, setDrawerSearchQuery] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);
  const [openLogoutDialog, setOpenLogoutDialog] = React.useState(false);
  const [openEditAccountModal, setOpenEditAccountModal] = React.useState(false);
  const [openScannerModal, setOpenScannerModal] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [storeSelected, setStoreSelected] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [pageLoading, setPageLoading] = React.useState(false);

  const [notifications, setNotifications] = React.useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = React.useState(0);
  const prevNotifCountRef = React.useRef(0);
  const [isNewNotificationArrived, setIsNewNotificationArrived] = React.useState(false);
  const [isFsClicked, setIsFsClicked] = React.useState(false);

  const refreshSummary = React.useCallback(
    (explicitList = null) => {
      if (!user) return;
      const summary = getUserNotificationSummary(user, explicitList);
      setNotifUnreadCount(summary.totalUnreadCount);
      setNotifications(summary.topNotifications);
    },
    [user]
  );

  const syncAll = React.useCallback(async () => {
    refreshSummary();
    const liveList = await fetchLiveNotifications();
    refreshSummary(liveList);
  }, [refreshSummary]);

  // Live real-time socket connection for instant notification & alert reception
  React.useEffect(() => {
    if (user) {
      initSocketClient(user, () => {
        syncAll();
      });
    }
  }, [user, syncAll]);

  React.useEffect(() => {
    syncAll();

    // Poll every 6 seconds for real-time live stock/inward/dispatch/messages sync
    const interval = setInterval(() => {
      syncAll();
    }, 6000);

    const handleSyncEvent = (e) => {
      refreshSummary(e.detail?.notifications || null);
    };

    const handleFocus = () => syncAll();
    const handleVisibility = () => {
      if (!document.hidden) syncAll();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('app_notifications_synced', handleSyncEvent);
    window.addEventListener('app_stock_alert_updated', syncAll);
    window.addEventListener('storage', syncAll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('app_notifications_synced', handleSyncEvent);
      window.removeEventListener('app_stock_alert_updated', syncAll);
      window.removeEventListener('storage', syncAll);
    };
  }, [syncAll, refreshSummary]);

  React.useEffect(() => {
    if (notifUnreadCount > prevNotifCountRef.current) {
      setIsNewNotificationArrived(true);
      const timer = setTimeout(() => setIsNewNotificationArrived(false), 2400);
      return () => clearTimeout(timer);
    }
    prevNotifCountRef.current = notifUnreadCount;
  }, [notifUnreadCount]);

  React.useEffect(() => {
    const handleAlertPulse = () => {
      setIsNewNotificationArrived(true);
      const timer = setTimeout(() => setIsNewNotificationArrived(false), 2400);
      return () => clearTimeout(timer);
    };
    window.addEventListener('app_stock_alert_updated', handleAlertPulse);
    return () => window.removeEventListener('app_stock_alert_updated', handleAlertPulse);
  }, []);

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  React.useEffect(() => {
    if (user?.role) {
      const roleLower = (user.role || '').toLowerCase().trim();
      const isStandardAdmin = ['admin', 'super admin', 'manager'].includes(roleLower) || roleLower.includes('admin') || roleLower.includes('super admin');
      const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';

      let savedTab = null;
      try {
        savedTab = sessionStorage.getItem('last_active_drawer_tab');
      } catch { }

      if (savedTab) {
        if (isStandardAdmin && savedTab === 'store_dispatched') {
          savedTab = null;
          try { sessionStorage.removeItem('last_active_drawer_tab'); } catch { }
        } else {
          for (const sec of navigationSections) {
            const found = sec.items.find((it) => it.id === savedTab);
            if (found) {
              setActiveItemId(found.id);
              setSelectedItem(found.content);
              return;
            }
          }
        }
      }

      if (isServicePerson) {
        setSelectedItem(<ServiceDashboard />);
        setActiveItemId('service_dashboard');
      } else {
        setSelectedItem(isStandardAdmin ? <Home /> : <StoreHome />);
        setActiveItemId(isStandardAdmin ? 'home' : 'store_home');
      }
    }
  }, [user?.role]);

  // If an admin currently has store_dispatched loaded, redirect them to Home
  React.useEffect(() => {
    if (!user) return;
    const roleLower = (user.role || '').toLowerCase().trim();
    const isStandardAdmin = ['admin', 'super admin', 'manager'].includes(roleLower) || roleLower.includes('admin') || roleLower.includes('super admin');
    if (isStandardAdmin && activeItemId === 'store_dispatched') {
      setActiveItemId('home');
      setSelectedItem(<Home />);
      try { sessionStorage.removeItem('last_active_drawer_tab'); } catch { }
    }
  }, [user, activeItemId]);

  // Filter sections by role and search
  const getFilteredSections = () => {
    if (!user) return [];
    const roleLower = (user.role || '').toLowerCase().trim();
    const isStandardAdmin = ['admin', 'super admin', 'manager'].includes(roleLower) || roleLower.includes('admin') || roleLower.includes('super admin');
    const isServicePerson = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';

    return navigationSections
      .filter((sec) => {
        if (isServicePerson) {
          // Service persons see Service & RMA and Inventory sidebar groups
          return sec.groupTitle === 'Service & RMA' || sec.groupTitle === 'Inventory';
        }
        return true;
      })
      .map((sec) => {
        let items = sec.items;

        if (isServicePerson && sec.groupTitle === 'Inventory') {
          // Only show Accessories, Spares Inventory and Spare Parts Management for Service Person inside Inventory group
          items = items.filter((item) => item.id === 'accessories' || item.id === 'spares' || item.id === 'spare_parts_management');
        }

        if (isServicePerson && sec.groupTitle === 'Service & RMA') {
          // Service Person does not raise service tickets; tickets are raised by Stores / Admins
          items = items.filter((item) => item.id !== 'raise_service');
        }

        if (isStandardAdmin) {
          // Standard admin sees all sections (including Accessories and Spares), except store specific duplicates, transfer history, and store_dispatched (shown only in Stores Login)
          items = items.filter(
            (item) =>
              ![
                'store_home',
                'store_management',
                'store_inward_details',
                'store_dispatched',
                'store_customer',
                'transfer_history',
              ].includes(item.id)
          );
        } else if (!isServicePerson) {
          // Stores Login: Only store users (e.g. CCTV Shoppee Avadi, store accounts) see store modules including Dispatched Details
          const allowedIds = [
            'store_home',
            'transfer_history',
            'store_inward_details',
            'store_dispatched',
            'store_customer',
            'service_dashboard',
            'raise_service',
            'service_requests',
            'rma_lifecycle',
            'service_tracking',
            'our_services',
          ];
          if (user.role === 'CCTV Shoppee Avadi') {
            if (!storeSelected) {
              // allow navigation
            }
          }
          items = items.filter((item) => allowedIds.includes(item.id));
        }

        // Apply search query filter if user typed in search box
        if (drawerSearchQuery.trim()) {
          items = items.filter(
            (item) =>
              item.text.toLowerCase().includes(drawerSearchQuery.toLowerCase()) ||
              sec.groupTitle.toLowerCase().includes(drawerSearchQuery.toLowerCase())
          );
        }

        return {
          ...sec,
          items,
        };
      })
      .filter((sec) => sec.items.length > 0);
  };

  const filteredSections = getFilteredSections();

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleToggleDrawer = () => setOpen((prev) => !prev);

  const handleMenuItemClick = (item) => {
    setPageLoading(true);
    setActiveItemId(item.id);
    setSelectedItem(item.content);
    try {
      sessionStorage.setItem('last_active_drawer_tab', item.id);
    } catch { }
    setRefreshKey((prev) => prev + 1);
    if (item.id === 'store_home') {
      setStoreSelected(false);
    }
    setTimeout(() => {
      setPageLoading(false);
    }, 300);
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleOpenNotifPopover = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleCloseNotifPopover = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAllAsRead = () => {
    const ids = notifications.map((n) => n.id || n._id);
    markAllItemsAsRead(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false, read: true, isRead: true })));
    setNotifUnreadCount(0);
    setTimeout(() => refreshSummary(), 100);
  };

  const handleNotificationClick = (notif) => {
    handleCloseNotifPopover();

    const notifId = notif.id || notif._id;
    if (notifId) {
      markItemAsRead(notifId);
    }

    // Remove from popover list immediately so it doesn't show anymore
    setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== notifId));
    setNotifUnreadCount((prev) => Math.max(0, prev - 1));

    const targetPayload = {
      id: notifId,
      accountName: notif.name || notif.userName || notif.location || notif.storeId,
      storeName: notif.storeName || notif.storeId || notif.userLocation || notif.location,
      category: notif.category || notif.type,
      title: notif.title || notif.name,
    };

    localStorage.setItem('app_target_notification', JSON.stringify(targetPayload));
    window.dispatchEvent(new CustomEvent('app_select_notification', { detail: targetPayload }));

    setPageLoading(true);
    setActiveItemId('notifications');
    try {
      sessionStorage.setItem('last_active_drawer_tab', 'notifications');
    } catch { }
    setSelectedItem(<Notifications initialTargetNotifId={notifId} targetPayload={targetPayload} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleDismissNotification = (e, notif) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const notifId = notif?.id || notif?._id;
    if (!notifId) return;

    markItemAsRead(notifId);
    setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== notifId));
    setNotifUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleGrantEditFromPopover = (e, notif) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const targetUserName = notif.userName || notif.name;
    const targetUserId = notif.userId || notif.id;
    const now = Date.now();
    if (targetUserName) {
      localStorage.setItem(`app_edit_permission_${targetUserName}`, 'approved');
      localStorage.setItem(`app_edit_permission_time_${targetUserName}`, String(now));
    }
    if (targetUserId) {
      localStorage.setItem(`app_edit_permission_${targetUserId}`, 'approved');
      localStorage.setItem(`app_edit_permission_time_${targetUserId}`, String(now));
    }

    const approvalNotif = {
      id: `edit_perm_approved_${Date.now()}_${targetUserId}`,
      category: 'COMMUNICATION',
      type: 'account_edit_approved',
      title: '🎉 Account Edit Permission Granted (Valid 2 Mins)',
      actionText: 'Permission Granted by Super Admin (Valid 2 Minutes):',
      targetText: `Super Admin has approved account edit access for ${targetUserName || 'your account'}. Valid for 2 minutes.`,
      storeId: 'All',
      userId: targetUserId,
      userName: targetUserName,
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      const notifCache = JSON.parse(localStorage.getItem('app_notifications_cache') || '[]');
      notifCache.unshift(approvalNotif);
      localStorage.setItem('app_notifications_cache', JSON.stringify(notifCache));
      window.dispatchEvent(new CustomEvent('app_notifications_synced', { detail: { notifications: notifCache } }));
    } catch { }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const API_BASE_PRIMARY = (process.env.REACT_APP_API_URL || 'http://localhost:5002/api').replace(/\/$/, '');
    fetch(`${API_BASE_PRIMARY}/users/${targetUserId}/grant-edit-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ adminName: user?.name || 'Super Admin' }),
    }).catch(() => { });

    handleDismissNotification(e, notif);
  };

  const handleViewAllNotifications = () => {
    handleCloseNotifPopover();
    setPageLoading(true);
    setActiveItemId('notifications');
    setSelectedItem(<Notifications />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToLowStock = () => {
    setPageLoading(true);
    setActiveItemId('low_stocks');
    setSelectedItem(<LowStockView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToRecentInwards = () => {
    setPageLoading(true);
    setActiveItemId('stock_inward');
    setSelectedItem(<RecentInwardsView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToRecentOutward = () => {
    setPageLoading(true);
    setActiveItemId('stock_outward');
    setSelectedItem(<RecentOutwardView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToDispatchValue = () => {
    setPageLoading(true);
    setActiveItemId('reports');
    setSelectedItem(<DispatchAnalyticsView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToTotalProducts = () => {
    setPageLoading(true);
    setActiveItemId('products');
    setSelectedItem(<TotalProductsView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToTopSelling = () => {
    setPageLoading(true);
    setActiveItemId('products');
    setSelectedItem(<TopSellingProductsView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleNavigateToTopCustomers = () => {
    setPageLoading(true);
    setActiveItemId('customer');
    setSelectedItem(<TopCustomersView onNavigateHome={() => handleMenuItemClick({ id: 'home', content: <Home /> })} />);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setPageLoading(false), 300);
  };

  React.useEffect(() => {
    const handleCustomNav = (e) => {
      const targetId = e.detail?.id;
      if (!targetId) return;
      for (const sec of navigationSections) {
        const found = sec.items.find((it) => it.id === targetId);
        if (found) {
          handleMenuItemClick(found);
          break;
        }
      }
    };
    window.addEventListener('NAVIGATE_DRAWER', handleCustomNav);
    return () => window.removeEventListener('NAVIGATE_DRAWER', handleCustomNav);
  }, []);

  const handleFullscreenToggle = () => {
    setIsFsClicked(true);
    setTimeout(() => setIsFsClicked(false), 400);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
      setIsFullscreen(false);
    }
  };

  const handleOpenEditAccount = () => {
    handleClose();
    setOpenEditAccountModal(true);
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
    handleClose();
  };
  const handleLogoutConfirm = () => {
    setOpenLogoutDialog(false);
    logout();
  };
  const handleLogoutCancel = () => setOpenLogoutDialog(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <CssBaseline />

      {/* Top AppBar */}
      <AppBar position="fixed" open={open} sx={{ backgroundColor: '#0f2b48' }}>
        <Toolbar sx={{ minHeight: 64, px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ marginRight: 3, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 0.5, color: '#ffffff' }}>
            COLORON Inventory POS
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Time Display (Continuously Running Clock) */}
          <LiveClockDisplay />

          {/* Header Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '@keyframes badgeBounce': {
                '0%, 70%, 100%': { transform: 'scale(1)' },
                '75%': { transform: 'scale(1.22)' },
                '85%': { transform: 'scale(0.92)' },
                '92%': { transform: 'scale(1.12)' },
              },
              '@keyframes bellRing': {
                '0%': { transform: 'rotate(0deg)' },
                '10%': { transform: 'rotate(16deg)' },
                '20%': { transform: 'rotate(-16deg)' },
                '30%': { transform: 'rotate(12deg)' },
                '40%': { transform: 'rotate(-12deg)' },
                '50%': { transform: 'rotate(6deg)' },
                '60%': { transform: 'rotate(-6deg)' },
                '70%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(0deg)' },
              },
              '@keyframes qrScan': {
                '0%': { top: '0%', opacity: 0 },
                '15%': { opacity: 1 },
                '85%': { opacity: 1 },
                '100%': { top: '100%', opacity: 0 },
              },
            }}
          >
            {/* Fullscreen Toggle with functional corner bracket expansion */}
            <IconButton
              color="inherit"
              onClick={handleFullscreenToggle}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'rgba(255,255,255,0.08)',
                transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                  '& .fs-bracket-tl': {
                    animation: 'fsExpandTL 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-tr': {
                    animation: 'fsExpandTR 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-bl': {
                    animation: 'fsExpandBL 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-br': {
                    animation: 'fsExpandBR 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-exit-tl': {
                    animation: 'fsContractTL 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-exit-tr': {
                    animation: 'fsContractTR 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-exit-bl': {
                    animation: 'fsContractBL 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                  '& .fs-bracket-exit-br': {
                    animation: 'fsContractBR 0.38s cubic-bezier(0.25, 1, 0.5, 1) 1',
                  },
                },
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <FunctionalFullscreenIcon isFullscreen={isFullscreen} isClicked={isFsClicked} />
            </IconButton>

            {/* Scan / Warranty Check (3D Format + QR Laser Animation) */}
            <IconButton
              color="inherit"
              onClick={() => setOpenScannerModal(true)}
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(145deg, #1a4066, #0d2238)',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.1)',
                border: '1px solid #1e3a8a',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  background: 'linear-gradient(145deg, #0d2238, #1a4066)',
                  boxShadow: '0 0 14px rgba(56, 189, 248, 0.45), inset 2px 2px 5px rgba(0,0,0,0.5)',
                  transform: 'scale(1.08)',
                },
                '&:active': {
                  transform: 'scale(0.92)',
                },
              }}
              title="Scan QR / Warranty"
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '3px',
                  p: 0.1,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #ffffff, #38bdf8, transparent)',
                    boxShadow: '0 0 6px #38bdf8, 0 0 10px #0284c7',
                    animation: 'qrScan 1.8s ease-in-out infinite',
                    pointerEvents: 'none',
                  },
                }}
              >
                <QrCodeScannerIcon sx={{ fontSize: 22, color: '#ffffff', filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }} />
              </Box>
            </IconButton>

            {/* Notifications Bell */}
            <IconButton
              color="inherit"
              onClick={handleOpenNotifPopover}
              sx={{
                position: 'relative',
                width: 38,
                height: 38,
                backgroundColor: 'rgba(255,255,255,0.08)',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  transform: 'scale(1.08)',
                  boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                  '& .bell-icon': {
                    animation: 'bellRing 0.8s ease-in-out',
                  },
                },
                '&:active': {
                  transform: 'scale(0.92)',
                },
              }}
              title="Notifications"
            >
              {notifUnreadCount > 0 ? (
                <NotificationsIcon
                  className="bell-icon"
                  sx={{
                    fontSize: 21,
                    color: '#ffffff',
                    transformOrigin: 'top center',
                    animation: 'bellRing 3.5s ease-in-out infinite',
                  }}
                />
              ) : (
                <NotificationsNoneIcon
                  className="bell-icon"
                  sx={{
                    fontSize: 21,
                    color: '#ffffff',
                    transformOrigin: 'top center',
                  }}
                />
              )}
              {notifUnreadCount > 0 && (
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    px: 0.4,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#e53935',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: 1,
                    border: '2px solid #0f2b48',
                    zIndex: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    animation: 'badgeBounce 2.5s infinite ease-in-out',
                  }}
                >
                  {formatNotificationCount(notifUnreadCount)}
                </Box>
              )}
            </IconButton>

            {/* User Account Role & Menu */}
            {(() => {
              const roleLower = (user?.role || '').toLowerCase().trim();
              const isServicePerson =
                roleLower === 'service person' ||
                roleLower.includes('service') ||
                roleLower === 'engineer' ||
                roleLower === 'technician';

              // Stacked role on top and person name below exclusively for Service Person
              if (isServicePerson) {
                return (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      ml: 1.5,
                      lineHeight: 1.2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#93c5fd',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        lineHeight: 1.1,
                      }}
                    >
                      {user?.role || 'Service Person'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {user?.name || 'Service Person'}
                    </Typography>
                  </Box>
                );
              }

              const loc =
                user?.assignedLocation ||
                user?.warehouseName ||
                user?.serviceCenter ||
                user?.staffLocation ||
                user?.customerStore;
              if (loc && loc.toLowerCase() !== (user?.role || '').toLowerCase()) {
                return (
                  <Typography variant="body2" sx={{ color: 'white', ml: 1.5, fontWeight: 600 }}>
                    {`${user?.role || 'User'} (${loc})`}
                  </Typography>
                );
              }
              return (
                <Typography variant="body2" sx={{ color: 'white', ml: 1.5, fontWeight: 600 }}>
                  {user?.role || 'Admin'}
                </Typography>
              );
            })()}

            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 170, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
            >
              <MenuItem onClick={handleOpenEditAccount}>
                <AccountBoxIcon sx={{ marginRight: 1.5, color: '#0284c7' }} />
                My Account
              </MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <LogoutIcon sx={{ marginRight: 1.5, color: '#ef4444' }} />
                Logout
              </MenuItem>
            </Menu>

            {/* Notifications Popover */}
            <Popover
              open={Boolean(notifAnchorEl)}
              anchorEl={notifAnchorEl}
              onClose={handleCloseNotifPopover}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: { width: 380, mt: 1, borderRadius: 2.5, boxShadow: '0px 8px 30px rgba(0,0,0,0.15)' },
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Notifications
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#0284c7', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Typography>
              </Box>
              <Divider />
              <List sx={{ p: 0, maxHeight: 350, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                      }}
                    >
                      <NotificationsOffIcon sx={{ fontSize: 30, color: '#94a3b8' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      No new notifications
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, maxWidth: 220 }}>
                      You're all caught up! No unread notifications.
                    </Typography>
                  </Box>
                ) : (
                  notifications.map((notif, index) => (
                    <React.Fragment key={notif.id || index}>
                      <ListItem
                        alignItems="flex-start"
                        onClick={() => handleNotificationClick(notif)}
                        sx={{
                          px: 2,
                          py: 1.4,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                        }}
                      >
                        {(() => {
                          const notifName = notif.userName || notif.name || notif.storeName || 'Lookman HO';
                          const notifInitials = notif.avatarInitials || (notifName ? notifName.slice(0, 2).toUpperCase() : 'LH');
                          return (
                            <>
                              <Box sx={{ mr: 1.5, mt: 0.5 }}>
                                {notif.avatar ? (
                                  <Avatar src={notif.avatar} alt={notifName} sx={{ width: 40, height: 40 }} />
                                ) : (
                                  <Tooltip title={notifName} arrow>
                                    <Avatar
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: notif.avatarColor || '#1e40af',
                                        color: '#ffffff',
                                        fontSize: '0.82rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.5px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                      }}
                                    >
                                      {notifInitials}
                                    </Avatar>
                                  </Tooltip>
                                )}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                {/* Account / User Name & Time */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.2 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.80rem' }}>
                                    {notifName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.70rem' }}>
                                      {notif.time}
                                    </Typography>
                                    <Tooltip title="Remove notification">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => handleDismissNotification(e, notif)}
                                        sx={{
                                          p: 0.2,
                                          color: '#94a3b8',
                                          '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' },
                                        }}
                                      >
                                        <CloseIcon sx={{ fontSize: 13 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>

                                {/* Notification Title */}
                                <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.3 }}>
                                  {notif.title || notif.name}
                                </Typography>

                                {/* Prominently Show Store Name */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4, mb: 0.3 }}>
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.4,
                                      px: 0.8,
                                      py: 0.15,
                                      bgcolor: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <StorefrontIcon sx={{ fontSize: 13, color: '#059669' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857', fontSize: '0.72rem' }}>
                                      Store: {notif.storeName || notif.storeId || notif.userLocation || notif.location || 'Main Store'}
                                    </Typography>
                                  </Box>
                                </Box>

                                {(notif.detail || notif.action) && (
                                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.78rem', lineHeight: 1.4, mt: 0.2, wordBreak: 'break-word' }}>
                                    {notif.detail || notif.action}
                                  </Typography>
                                )}

                                {isSuperAdmin && (notif.type === 'account_edit_request' || (notif.title || '').toLowerCase().includes('account edit request')) && (
                                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={(e) => handleGrantEditFromPopover(e, notif)}
                                      sx={{
                                        bgcolor: '#059669',
                                        '&:hover': { bgcolor: '#047857' },
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        py: 0.3,
                                        px: 1.2,
                                        borderRadius: '6px',
                                      }}
                                    >
                                      Grant Edit Access (2 Mins)
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </>
                          );
                        })()}
                        {notif.unread && (
                          <Box sx={{ width: 4, height: 36, backgroundColor: '#0284c7', borderRadius: 1, ml: 1 }} />
                        )}
                      </ListItem>
                      {index < notifications.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))
                )}
              </List>
              <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCloseNotifPopover}
                  sx={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#e2e8f0', boxShadow: 'none' },
                  }}
                >
                  Close
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    handleCloseNotifPopover();
                    handleViewAllNotifications();
                  }}
                  sx={{
                    backgroundColor: '#0f2b48',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#1e3a8a' },
                  }}
                >
                  View all
                </Button>
              </Box>
            </Popover>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Edit Account Modal */}
      <EditAccountModal
        open={openEditAccountModal}
        onClose={() => setOpenEditAccountModal(false)}
        user={user}
        onSaved={(updatedUser) => {
          if (updateUser) updateUser(updatedUser);
        }}
      />

      {/* Warranty Check Scanner Modal */}
      <WarrantyCheckModal
        open={openScannerModal}
        onClose={() => setOpenScannerModal(false)}
      />

      {/* Left Navigation Drawer */}
      <DrawerComponent variant="permanent" open={open}>
        {/* Drawer Header with Coloron Logo Branding */}
        <DrawerHeader
          sx={{
            px: open ? 2 : 1,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            minHeight: 64,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.5,
              transition: 'opacity 0.2s ease',
              '&:hover': { opacity: 0.85 },
            }}
            onClick={() => handleMenuItemClick({ id: 'home', content: <Home /> })}
          >
            {open ? (
              <img
                src={ColoronLogo}
                alt="Coloron"
                style={{
                  height: 44,
                  width: 'auto',
                  maxWidth: 175,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <img
                src={Fav}
                alt="Coloron"
                style={{
                  height: 32,
                  width: 32,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
          </Box>

          {/* Collapse / Expand Toggle Icon Button */}
          {open && (
            <IconButton
              onClick={handleToggleDrawer}
              size="small"
              sx={{
                color: '#64748b',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                p: 0.6,
                ml: 1,
                flexShrink: 0,
                '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          )}
        </DrawerHeader>

        {/* Optional Menu Search in expanded mode */}
        {open && (
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search menu..."
              value={drawerSearchQuery}
              onChange={(e) => setDrawerSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: drawerSearchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setDrawerSearchQuery('')}
                      edge="end"
                      title="Clear search"
                      sx={{
                        p: 0.5,
                        color: '#94a3b8',
                        '&:hover': {
                          color: '#0f172a',
                          backgroundColor: '#e2e8f0',
                        },
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  fontSize: '13px',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                },
              }}
            />
          </Box>
        )}

        {/* Navigation Sections with Scrollbar */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            py: 1,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: '#f8fafc' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
          }}
        >
          {filteredSections.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                px: 2,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  color: '#94a3b8',
                }}
              >
                <SearchX size={26} strokeWidth={1.8} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#475569',
                  fontSize: '14px',
                  letterSpacing: '-0.01em',
                }}
              >
                No Data
              </Typography>
              {drawerSearchQuery && open && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    mt: 0.5,
                    fontSize: '12px',
                    display: 'block',
                    maxWidth: 180,
                    wordBreak: 'break-word',
                  }}
                >
                  No matches for "{drawerSearchQuery}"
                </Typography>
              )}
            </Box>
          ) : (
            filteredSections.map((section, secIdx) => (
              <Box key={section.groupTitle} sx={{ mb: 1.5 }}>
                {/* Section Header Title matching Reference Image 1 */}
                {open ? (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2.5,
                      pt: secIdx === 0 ? 0.5 : 1.5,
                      pb: 0.8,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#0f2b48',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {section.groupTitle}
                  </Typography>
                ) : (
                  <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
                )}

                {/* Items in Section */}
                <Box sx={{ px: 1 }}>
                  {section.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeItemId === item.id;

                    const ItemButton = (
                      <Box
                        onClick={() => handleMenuItemClick(item)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: open ? 'space-between' : 'center',
                          px: open ? 1.8 : 1,
                          py: 1,
                          my: 0.3,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease-in-out',
                          backgroundColor: isActive ? '#eff6ff' : 'transparent',
                          borderLeft: isActive ? '3.5px solid #0284c7' : '3.5px solid transparent',
                          color: isActive ? '#0369a1' : '#334155',
                          '&:hover': {
                            backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                            color: '#0f172a',
                            '& .item-icon': {
                              color: '#0284c7',
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.6, minWidth: 0 }}>
                          <Box
                            className="item-icon"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isActive ? '#0284c7' : '#64748b',
                              transition: 'color 0.18s ease',
                            }}
                          >
                            <IconComponent size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                          </Box>
                          {open && (
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: isActive ? 600 : 500,
                                fontSize: '14px',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {item.text}
                            </Typography>
                          )}
                        </Box>

                        {/* Right Chevron arrow for expandable/sub-items matching Image 1 */}
                        {open && item.hasArrow && (
                          <ChevronRight size={15} color="#94a3b8" />
                        )}
                      </Box>
                    );

                    return !open ? (
                      <Tooltip key={item.id} title={`${section.groupTitle}: ${item.text}`} placement="right" arrow>
                        {ItemButton}
                      </Tooltip>
                    ) : (
                      <React.Fragment key={item.id}>
                        {ItemButton}
                      </React.Fragment>
                    );
                  })}
                </Box>

                {/* Subtle divider line matching Reference Image 1 */}
                {secIdx < filteredSections.length - 1 && (
                  <Divider sx={{ mt: 1.5, mb: 0.5, mx: 2, borderColor: '#f1f5f9' }} />
                )}
              </Box>
            )))}
        </Box>
      </DrawerComponent>

      {/* Main Content View Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
        key={refreshKey}
      >
        <Box sx={{ minHeight: 64 }} />
        {pageLoading ? (
          <Box sx={{ py: 8 }}>
            <Spinner message="" />
          </Box>
        ) : React.isValidElement(selectedItem) ? (
          React.cloneElement(selectedItem, {
            user,
            onStoreSelect: (owner) => setStoreSelected(owner === 'CCTV Shoppee'),
            onNavigateToLowStock: handleNavigateToLowStock,
            onNavigateToRecentInwards: handleNavigateToRecentInwards,
            onNavigateToRecentOutward: handleNavigateToRecentOutward,
            onNavigateToDispatchValue: handleNavigateToDispatchValue,
            onNavigateToTotalProducts: handleNavigateToTotalProducts,
            onNavigateToTopSelling: handleNavigateToTopSelling,
            onNavigateToTopCustomers: handleNavigateToTopCustomers,
            onOpenRMADetails: (rmaId) => {
              setPageLoading(true);
              setActiveItemId('rma_lifecycle');
              setSelectedItem(<RMAListPage initialOpenRMAId={rmaId} />);
              setRefreshKey((prev) => prev + 1);
              setTimeout(() => setPageLoading(false), 300);
            },
            onOpenRaiseService: () => {
              const roleLower = (user?.role || '').toLowerCase().trim();
              const isSP = roleLower.includes('service') || roleLower === 'engineer' || roleLower === 'technician';
              if (isSP) return;
              setPageLoading(true);
              setActiveItemId('raise_service');
              setSelectedItem(<RaiseService />);
              setRefreshKey((prev) => prev + 1);
              setTimeout(() => setPageLoading(false), 300);
            }
          })
        ) : (
          selectedItem
        )}
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        PaperProps={{ sx: { borderRadius: 3, p: 0.5, minWidth: 340 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#334155', fontSize: '15px' }}>
            Are you sure you want to logout from {(() => {
              const loc =
                user?.assignedLocation ||
                user?.warehouseName ||
                user?.serviceCenter ||
                user?.staffLocation ||
                user?.customerStore;
              const role = user?.role || 'User';
              if (loc && loc.toLowerCase() !== role.toLowerCase()) {
                return `${role} (${loc})`;
              }
              return role;
            })()}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleLogoutCancel} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              fontWeight: 600,
              px: 2.5,
            }}
            autoFocus
          >
            Confirm Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
