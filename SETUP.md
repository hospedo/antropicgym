# Gym Management System - Setup Guide

## Prerequisites

Make sure you have the following installed:
- Node.js (version 18 or higher)
- npm or yarn
- A Supabase account

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

## Step 3: Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase.sql` file
4. Execute the SQL script to create all tables and policies

## Step 4: Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Default Pages

- **Home**: `/` - Landing page with login/register links
- **Login**: `/auth/login` - User authentication
- **Register**: `/auth/register` - Gym registration
- **Dashboard**: `/dashboard` - Main dashboard (requires authentication)
- **Clients**: `/dashboard/clientes` - Client management
- **Plans**: `/dashboard/planes` - Membership plans
- **Attendance**: `/dashboard/asistencias` - Check-in system

## Features Implemented

✅ **Authentication System**
- User registration and login
- Protected routes
- Session management

✅ **Client Management**
- Add/edit/delete clients
- Client profiles with detailed information
- Search and filter functionality

✅ **Plans Management**
- Create membership plans with pricing
- Edit and activate/deactivate plans
- Quick templates for common plans

✅ **Attendance Tracking**
- Daily check-in system
- Real-time attendance monitoring
- Statistics and reporting

✅ **Dashboard**
- Overview statistics
- Quick actions
- Responsive design

## Database Structure

The system uses the following main tables:
- `usuarios` - System users (gym owners)
- `gimnasios` - Gym information
- `clientes` - Gym clients
- `planes` - Membership plans
- `inscripciones` - Client subscriptions
- `asistencias` - Daily attendance records
- `pagos` - Payment records

## Security

- Row Level Security (RLS) policies ensure data isolation
- Each gym owner can only access their own data
- Authentication required for all dashboard features

## Troubleshooting

### Common Issues

1. **Build errors**: Make sure all dependencies are installed
2. **Database connection**: Verify your Supabase credentials in `.env.local`
3. **Authentication issues**: Check that RLS policies are properly set up
4. **Type errors**: Run `npm run typecheck` to identify TypeScript issues

### Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Next Steps (Future Versions)

- Payment registration system
- WhatsApp/Email notifications
- QR code check-in
- Advanced reporting and analytics
- Mobile app integration