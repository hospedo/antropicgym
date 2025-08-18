# 🏋️ Gym Management System

A complete gym management system built with Next.js, Supabase, and TypeScript. Perfect for managing clients, memberships, attendance, and payments in your gym or fitness center.

## ✨ Features

### 🔐 Authentication & Security
- User registration and login
- Row Level Security (RLS) policies
- Multi-gym support with isolated data
- Protected routes and session management

### 👥 Client Management
- Complete CRUD operations for clients
- Client profiles with detailed information
- Search and filter functionality
- Active/inactive status management

### 💳 Membership Plans
- Create and manage subscription plans
- Flexible pricing and duration options
- Quick templates for common plans
- Plan activation/deactivation

### 📅 Attendance Tracking
- Daily check-in system
- Real-time attendance monitoring
- Historical attendance records
- Date-filtered views and statistics

### 💰 Payment Management
- Register payments and transactions
- Multiple payment methods support
- Filter by date and payment method
- Revenue tracking and statistics

### 📊 Dashboard & Analytics
- Real-time statistics overview
- Quick action buttons
- Responsive design for all devices
- Clean and intuitive interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment setup**
   
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database setup**
   
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase.sql`
   - Execute the script

4. **Run the application**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000

## 📁 Project Structure

```
gym-management/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application
│   │   ├── clientes/      # Client management
│   │   ├── planes/        # Plans management
│   │   ├── asistencias/   # Attendance tracking
│   │   └── pagos/         # Payment management
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   └── supabase-server.ts # Server-side client
├── types/                 # TypeScript definitions
│   ├── index.ts           # Main types
│   └── supabase.ts        # Database types
├── supabase.sql           # Database schema
├── package.json           # Dependencies
└── README.md             # This file
```

## 🗄️ Database Schema

### Core Tables
- **usuarios** - System users (gym owners)
- **gimnasios** - Gym information and settings
- **clientes** - Gym members/clients
- **planes** - Membership plans and pricing
- **inscripciones** - Client subscriptions
- **asistencias** - Daily attendance records
- **pagos** - Payment transactions

### Security
- Row Level Security (RLS) ensures data isolation
- Each gym owner only accesses their own data
- Comprehensive policies for all CRUD operations

## 🎯 Usage Guide

### 1. Register Your Gym
- Visit the registration page
- Create your gym admin account
- Set up your gym information

### 2. Manage Clients
- Add new clients with complete profiles
- Edit client information as needed
- Track active/inactive status

### 3. Create Membership Plans
- Define plan types (monthly, annual, etc.)
- Set pricing and duration
- Use quick templates or create custom plans

### 4. Track Attendance
- Daily check-in for clients
- View attendance history
- Monitor gym usage patterns

### 5. Record Payments
- Register payments by method
- Track revenue and financial data
- Generate payment reports

## 🛠️ Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **State Management**: Zustand (ready for complex state)

## 🔒 Security Features

- **Row Level Security**: Data isolation per gym
- **Authentication**: Secure login/logout
- **Protected Routes**: Dashboard requires authentication
- **Input Validation**: Form validation on client and server
- **SQL Injection Protection**: Supabase handles this automatically

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🔧 Customization

### Adding New Features
1. Create new pages in `app/dashboard/`
2. Add navigation items to `app/dashboard/layout.tsx`
3. Create corresponding database tables in `supabase.sql`
4. Add TypeScript types in `types/`

### Styling
- Modify `tailwind.config.js` for custom themes
- Update `app/globals.css` for global styles
- Use Tailwind classes for component styling

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables
4. Deploy automatically

### Other Platforms
- Netlify
- Railway
- Any Node.js hosting service

## 📈 Future Enhancements

### Version 1.1
- [ ] WhatsApp/Email notifications
- [ ] Advanced reporting dashboard
- [ ] Member check-in via QR codes

### Version 1.2
- [ ] Mobile app
- [ ] Payment integrations (Stripe, PayPal)
- [ ] Workout tracking
- [ ] Trainer management

### Version 1.3
- [ ] Multi-location support
- [ ] Advanced analytics
- [ ] API for integrations
- [ ] White-label solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For support and questions:
- Check the setup guide above
- Review the code documentation
- Create an issue in the repository

---

**Built with ❤️ for gym owners and fitness professionals**# antropicgym
