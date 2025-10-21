# KreativLab - Dental Administrative Support CRM

A comprehensive SaaS CRM platform designed specifically for dental administrative support services, enabling efficient management of dental practice relationships, patient communications, and revenue cycle operations.

🚀 **Latest Features**: Line2 VoIP integration, OpenStreetMap lead generation, multi-source data aggregation

## 🦷 About

KreativLab is built to power dental administrative support businesses like Happy Teeth Support Services, providing a complete solution for managing:
- Virtual dental call center operations
- Front-office administrative management
- Revenue cycle management (RCM)
- 24/7 patient support communications

## 🚀 Features

### Practice Management
- **Dental Practice CRM** - Manage relationships with dental practice clients
- **Contact Management** - Track practice staff, dentists, and key contacts
- **Service Agreements** - Manage contracts and service levels
- **Performance Tracking** - Monitor KPIs and client satisfaction

### Call Center Operations
- **Call Logging** - Comprehensive call tracking and history
- **Patient Support Tickets** - Manage patient inquiries and issues
- **Communication Hub** - Multi-channel communication management
- **Queue Management** - Distribute calls and tasks efficiently

### Revenue Cycle Management
- **Billing Tracking** - Monitor billing and collections for practices
- **Payment Processing** - Track payments and outstanding balances
- **Insurance Claims** - Manage insurance claim processing
- **Financial Reporting** - Revenue analytics and reporting

### Analytics & Reporting
- **Performance Dashboards** - Real-time KPIs and metrics
- **Client Reporting** - Generate reports for dental practices
- **Team Performance** - Track virtual support team efficiency
- **Revenue Analytics** - Financial performance insights

### Compliance & Security
- **HIPAA Compliance** - Secure handling of dental patient data
- **Audit Trails** - Complete logging of all patient interactions
- **Data Encryption** - End-to-end security for sensitive information
- **Access Controls** - Role-based permissions and security

## 🏗️ Technology Stack

### Backend
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: tRPC with Zod validation
- **Authentication**: NextAuth.js with role-based access

### Frontend
- **Framework**: React 19 with Next.js 15
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui
- **State Management**: tRPC + React Query

### Security & Compliance
- **Data Protection**: Encryption at rest and in transit
- **Authentication**: Multi-factor authentication support
- **Audit Logging**: Complete activity tracking
- **HIPAA Compliance**: Built-in privacy controls

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- SMTP server for notifications

### Installation

1. **Clone and install dependencies**
```bash
git clone https://github.com/Ipswich38/kreativlab.git
cd kreativlab
npm install
```

2. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your database and service configurations
```

3. **Initialize database**
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

4. **Start development server**
```bash
npm run dev
```

5. **Open http://localhost:3000**

## 📊 Core Features

### Dashboard
- Overview of call center metrics
- Practice performance summaries
- Revenue cycle status
- Team productivity metrics

### Practice Management
- Add and manage dental practices
- Track service agreements and contracts
- Monitor practice-specific KPIs
- Communication history

### Call Center
- Real-time call queue management
- Call logging and history
- Patient support ticket system
- Performance analytics

### Revenue Management
- Billing and collections tracking
- Insurance claim management
- Payment processing
- Financial reporting

## 🔒 Security & Compliance

### HIPAA Compliance
- Encrypted data storage and transmission
- Access logging and audit trails
- User authentication and authorization
- Privacy controls and data minimization

### Security Features
- Multi-factor authentication
- Role-based access control
- Session management
- Secure API endpoints

## 📈 Analytics

### Key Performance Indicators
- Call response times
- Patient satisfaction scores
- Revenue cycle efficiency
- Practice retention rates

### Reporting
- Custom report generation
- Automated client reports
- Performance dashboards
- Export capabilities

## 🔧 Configuration

### Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Features Configuration
- Call center settings
- Notification preferences
- Report scheduling
- Integration settings

## 🚢 Deployment

### Production Deployment
1. Build the application: `npm run build`
2. Set up production database
3. Configure environment variables
4. Deploy to your hosting platform

### Vercel Deployment
- Optimized for Vercel deployment
- Automatic builds from GitHub
- Environment variable management
- Database integration

## 📞 Support

For support with KreativLab CRM:
- **Documentation**: Coming soon
- **Issues**: [GitHub Issues](https://github.com/Ipswich38/kreativlab/issues)
- **Email**: support@kreativlab.com

## 📄 License

This project is licensed under the MIT License.

---

Built specifically for dental administrative support services to maximize practice efficiency and profitability.