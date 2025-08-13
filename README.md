# Farm Direct - Clean Server-Side Version

A clean, server-side farm-to-table marketplace application built with React and Firebase. This version focuses on core functionality without blockchain dependencies.

## 🌟 Features

### **For Customers**
- Browse fresh products from local farmers
- Add products to cart and place orders
- Track order status and delivery
- Chat with farmers directly
- User authentication and profile management

### **For Farmers**
- List and manage products with images
- Receive and manage customer orders
- Update order status and delivery information
- Generate QR codes for product tracking
- Chat with customers

### **Core Functionality**
- Real-time messaging system
- Image upload and storage
- Order management with status tracking
- User role-based access control
- Responsive design for mobile and desktop

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router, Vite
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design system

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
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config

4. **Environment setup**
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🚀 Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── layout/         # Layout components (MainLayout, Navbar)
│   ├── auth/           # Authentication components
│   ├── products/       # Product-related components
│   ├── orders/         # Order management components
│   └── chat/           # Chat components
├── pages/              # Page components
│   ├── auth/           # Login, Register, Profile
│   ├── products/       # Product listing, details, management
│   ├── orders/         # Order management
│   ├── chat/           # Chat interface
│   └── admin/          # Admin dashboard
├── context/            # React Context providers
├── firebase/           # Firebase service functions
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── App.jsx             # Main app component
```

## 🔥 Firebase Setup

### Firestore Collections

The app uses these Firestore collections:

- **users**: User profiles and authentication data
- **products**: Product listings with images and details
- **orders**: Order management and tracking
- **conversations**: Chat conversations between users
- **messages**: Individual chat messages

### Storage Structure

Firebase Storage is organized as:

```
products/
  ├── {timestamp}_{filename}     # Product images
users/
  ├── avatars/                   # User profile pictures
```

### Security Rules

Make sure to set up appropriate Firestore security rules for your collections.

## 👥 User Roles

- **Customer** (`customer`/`klient`): Can browse, order, and chat
- **Farmer** (`farmer`/`rolnik`): Can list products, manage orders
- **Admin** (`admin`): Full access to all features

## 🎨 Styling

The app uses Tailwind CSS with a custom design system:

- **Primary Color**: Green (#16a34a)
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Responsive**: Mobile-first design

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use TypeScript-style prop validation with Zod
- Keep components small and focused

## 🚧 Future Enhancements

This clean version provides a solid foundation for adding:

- **Blockchain Integration**: Ethereum or Solana for transparency
- **Payment Processing**: Stripe or other payment gateways
- **Advanced Search**: Filtering and sorting capabilities
- **Analytics Dashboard**: Sales and user analytics
- **Mobile App**: React Native version
- **Email Notifications**: Order confirmations and updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

**Built with ❤️ for connecting farmers and customers directly**