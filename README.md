# Farm Direct - Enhanced Farm-to-Table Marketplace

An advanced farm-to-table marketplace application built with React, Firebase, and blockchain integration for enhanced transparency and crowdfunding capabilities. This version builds upon the core server-side functionality with Ethereum-based smart contracts for secure transactions and campaign management.

## 🌟 Features

### **For Customers**
- Browse and search for fresh products from local farmers with map integration
- Add products to cart, place orders, and track deliveries in real-time
- Participate in crowdfunding campaigns for farm projects
- Chat directly with farmers
- Leave reviews and ratings
- Crypto wallet payments
- User authentication, profile management, and notification center

### **For Farmers**
- List and manage products with inventory tracking, images, and QR codes
- Create and manage crowdfunding campaigns
- Process orders, update status, and manage deliveries
- Set up payment wallets and receive crypto payments
- Real-time chat with customers
- Notification dashboard and preferences
- Blockchain synchronization for transparent operations

### **For Admins**
- Deploy and manage blockchain contracts
- Verify farmers and campaigns
- Monitor system-wide activities
- Manage user roles and permissions

### **Core Functionality**
- Real-time messaging and notifications
- Image upload and storage with Firebase
- Order management with timeline and QR tracking
- Geolocation-based search and maps
- Crowdfunding with milestones and rewards
- Blockchain integration for transparent funding
- Role-based access control
- Responsive design for mobile and desktop

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router, Vite
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Blockchain**: Ethereum (Ethers.js, OpenZeppelin Contracts)
- **Form Handling**: React Hook Form with Zod validation
- **Payments**: Crypto wallet integration
- **Maps**: Google Maps API integration
- **Styling**: Tailwind CSS with custom design system
- **Other**: QR code generation, Web3 hooks, Notification system

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xjaqbek/FARMER.git
   cd FARMER
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password), Firestore, Storage, and Cloud Functions
   - Copy your Firebase config to `.env` (see below)
   - Deploy Cloud Functions: `cd functions && npm install && firebase deploy --only functions`

4. **Set up Blockchain (Optional for development)**
   - Configure Ethereum provider (e.g., Infura or Alchemy)
   - Deploy the smart contract (`FarmDirectCrowdfunding.sol`) to a testnet (e.g., Sepolia)
   - Update contract address in `src/services/web3Service.js`

5. **Environment setup**
   - Create a `.env` file in the root directory
   - Add your configurations:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your_infura_key  # For blockchain
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key  # For maps integration
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## 🚀 Build for Production

```bash
npm run build
```

Deploy the `dist` folder to your hosting provider (e.g., Firebase Hosting: `firebase deploy --only hosting`).

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── layout/         # Layout components (MainLayout, Navbar)
│   ├── auth/           # Authentication components
│   ├── products/       # Product-related components
│   ├── orders/         # Order management components
│   ├── chat/           # Chat components
│   ├── notifications/  # Notification components
│   ├── payment/        # Payment and wallet components
│   ├── maps/           # Map integration components
│   ├── location/       # Location picker components
│   ├── farmer/         # Farmer-specific components
│   ├── admin/          # Admin-specific components
│   └── ...             # Other feature-specific components
├── pages/              # Page components
│   ├── auth/           # Login, Register, Profile
│   ├── products/       # Product listing, details, management
│   ├── orders/         # Order management
│   ├── chat/           # Chat interface
│   ├── campaigns/      # Crowdfunding campaigns
│   ├── farmers/        # Farmer directory and profiles
│   ├── notifications/  # Notification pages
│   └── admin/          # Admin dashboard
├── context/            # React Context providers (Auth, Cart)
├── firebase/           # Firebase service functions
├── hooks/              # Custom React hooks (useWeb3, useLocation, etc.)
├── lib/                # Utility functions
├── services/           # API services (auth, farmer, web3, etc.)
├── smartcontract/      # Solidity contracts
├── utils/              # Helper utilities (notifications, maps, etc.)
└── App.jsx             # Main app component
```

## 🔥 Firebase Setup

### Firestore Collections
- **users**: User profiles and roles
- **products**: Product listings with inventory and seasonality
- **orders**: Order tracking and status
- **conversations**: Real-time chat sessions
- **messages**: Individual chat messages
- **notifications**: User notifications
- **campaigns**: Crowdfunding campaigns (synced with blockchain)
- **reviews**: Product and farmer reviews
- **inventory_logs**: Inventory change history

### Storage Structure
```
products/
  ├── {product_id}/     # Product images
users/
  ├── avatars/          # User profile pictures
campaigns/
  ├── {campaign_id}/    # Campaign media
```

### Security Rules
Configure Firestore and Storage security rules to enforce role-based access. Example rules are available in the Firebase console.

### Cloud Functions
Deploy the functions in `/functions` for scheduled tasks like expiring batch checks, notifications, and order status updates.

## 🔗 Blockchain Integration

- Smart Contract: `FarmDirectCrowdfunding.sol` for crowdfunding campaigns
- Network: Supports Ethereum mainnet/testnets (default: Sepolia)
- Features: Campaign creation, contributions, milestones, refunds, and admin verification
- Wallet: MetaMask or similar for crypto interactions

## 👥 User Roles

- **Customer** (`customer`/`klient`): Browse, order, chat, contribute to campaigns
- **Farmer** (`farmer`/`rolnik`): Manage products, orders, campaigns, and inventory
- **Admin** (`admin`): Full access, blockchain deployment, verifications

## 🎨 Styling

- **Primary Color**: Green (#16a34a)
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Responsive**: Mobile-first design with Tailwind CSS

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Zod for validation
- Keep components small and focused
- ESLint for code quality

## 🚧 Future Enhancements

- **Payment Gateways**: Integrate Stripe for fiat payments
- **Advanced Analytics**: Sales dashboards and insights
- **Mobile App**: React Native companion app
- **AI Features**: Product recommendations and inventory predictions
- **Multi-Chain Support**: Add Solana or other blockchains
- **Sustainability Tracking**: Carbon footprint and eco-metrics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, create an issue on GitHub or email your-email@example.com.

---

**Built with ❤️ for connecting farmers and customers directly, powered by blockchain for trust and transparency**