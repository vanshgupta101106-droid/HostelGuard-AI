# Hostel Risk Management System

A comprehensive Next.js application for monitoring and managing student safety, wellbeing, and risk assessment in hostel environments.

## Features

### Core Modules

1. **Student Management**
   - Student profiles with room assignments
   - Department and year tracking
   - Parent contact information
   - Status management (active/inactive/suspended)

2. **Hostel Structure**
   - Hierarchical organization (Hostel → Block → Floor → Room)
   - Occupancy tracking
   - Warden assignments
   - Room capacity management

3. **Complaint System**
   - Student complaint logging
   - Severity classification (low/medium/high/critical)
   - Category tracking
   - Status workflow (pending/resolved/dismissed)

4. **Incident Management**
   - Incident reporting and verification
   - Warden verification workflow
   - Severity and category classification
   - Timeline tracking

5. **Behavior Logging**
   - Discipline incident tracking
   - Behavior type classification
   - Warden reporting
   - Severity assessment

6. **Wellbeing Monitoring**
   - Weekly student surveys
   - Stress level tracking (1-10 scale)
   - Mood assessment
   - Block-level aggregates

7. **Risk Assessment Engine**
   - Individual student risk profiles
   - Auto-calculated risk scores
   - Risk level classification
   - Environmental risk scores (hostel/block/floor level)

8. **Risk Ticket System**
   - Automated escalation for high-risk students
   - Warden assignment workflow
   - Status tracking (open/in_progress/resolved/closed)
   - Parent notification triggers

9. **Room Monitoring**
   - High-risk room flagging
   - Occupancy-based risk calculation
   - Alert system for problematic rooms

10. **Notification System**
    - Multi-channel notifications (email/SMS/in-app)
    - Automated alerts for risk tickets
    - Delivery status tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Charts**: Recharts

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- `hostel`, `block`, `floor`, `room` - Hierarchical structure
- `student` - Student profiles
- `warden` - Warden management
- `complaint_log` - Complaint tracking
- `incident` - Incident records
- `behavior_log` - Discipline logs
- `wellbeing_survey` - Wellbeing data
- `individual_risk_profile` - Student risk scores
- `environment_risk_score` - Location-based risk
- `risk_ticket` - Escalation tracking
- `notification_log` - Alert history
- `room_monitor_flag` - Room-based alerts

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Git

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Setup Supabase**:
   - Create a new Supabase project
   - Run the SQL schema (see DATABASE_SCHEMA.sql)
   - Get your project URL and anon key

3. **Configure environment variables**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run development server**:
```bash
npm run dev
```

Visit `http://localhost:3000`

### Database Setup

Execute the SQL schema in your Supabase SQL editor to create all necessary tables and relationships.

## Project Structure

```
hostel-risk-system/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── page.tsx                # Overview dashboard
│   │   ├── students/
│   │   │   ├── page.tsx            # Student list
│   │   │   ├── [id]/page.tsx       # Student detail
│   │   │   └── new/page.tsx        # Add student
│   │   ├── hostel/
│   │   │   ├── page.tsx            # Hostel structure
│   │   │   └── [type]/page.tsx     # Block/Floor/Room mgmt
│   │   ├── complaints/
│   │   │   ├── page.tsx            # Complaint list
│   │   │   ├── [id]/page.tsx       # Complaint detail
│   │   │   └── new/page.tsx        # File complaint
│   │   ├── incidents/
│   │   │   ├── page.tsx            # Incident list
│   │   │   ├── [id]/page.tsx       # Incident detail
│   │   │   └── new/page.tsx        # Report incident
│   │   ├── behavior/
│   │   │   ├── page.tsx            # Behavior logs
│   │   │   └── new/page.tsx        # Log behavior
│   │   ├── wellbeing/
│   │   │   ├── page.tsx            # Wellbeing dashboard
│   │   │   └── survey/page.tsx     # Submit survey
│   │   ├── risk/
│   │   │   ├── page.tsx            # Risk overview
│   │   │   ├── profiles/page.tsx   # Risk profiles
│   │   │   └── tickets/page.tsx    # Risk tickets
│   │   ├── rooms/
│   │   │   ├── page.tsx            # Room monitoring
│   │   │   └── [id]/page.tsx       # Room details
│   │   └── wardens/
│   │       ├── page.tsx            # Warden management
│   │       └── [id]/page.tsx       # Warden detail
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── logout/
│   │   └── route.ts                # Logout handler
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   └── page.tsx                    # Root redirect
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── StatsCard.tsx
│   ├── students/
│   │   ├── StudentForm.tsx
│   │   ├── StudentTable.tsx
│   │   └── StudentDetail.tsx
│   ├── hostel/
│   │   ├── HostelForm.tsx
│   │   ├── BlockForm.tsx
│   │   ├── FloorForm.tsx
│   │   └── RoomForm.tsx
│   ├── complaints/
│   │   ├── ComplaintForm.tsx
│   │   ├── ComplaintTable.tsx
│   │   └── ComplaintDetail.tsx
│   ├── incidents/
│   │   ├── IncidentForm.tsx
│   │   ├── IncidentTable.tsx
│   │   └── IncidentDetail.tsx
│   ├── behavior/
│   │   ├── BehaviorForm.tsx
│   │   └── BehaviorTable.tsx
│   ├── wellbeing/
│   │   ├── SurveyForm.tsx
│   │   ├── WellbeingChart.tsx
│   │   └── StatsOverview.tsx
│   ├── risk/
│   │   ├── RiskOverview.tsx
│   │   ├── RiskProfile.tsx
│   │   ├── RiskTicketTable.tsx
│   │   └── RiskCalculator.tsx
│   ├── room-monitor/
│   │   ├── RoomFlagTable.tsx
│   │   └── RoomRiskCard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Table.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── services/
│   │   ├── student.service.ts
│   │   ├── hostel.service.ts
│   │   ├── complaint.service.ts
│   │   ├── incident.service.ts
│   │   ├── behavior.service.ts
│   │   ├── wellbeing.service.ts
│   │   ├── risk.service.ts
│   │   ├── warden.service.ts
│   │   ├── room-monitor.service.ts
│   │   └── notification.service.ts
│   └── types/
│       └── database.ts
├── middleware.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Key Features Implementation

### Risk Calculation Algorithm

The system calculates individual risk scores based on:
- Complaints (weighted by severity)
- Incidents (weighted 2x)
- Behavior logs (weighted 1.5x)

```typescript
score = Σ(complaints × severity_weight) + 
        Σ(incidents × severity_weight × 2) +
        Σ(behaviors × severity_weight × 1.5)

Risk Levels:
- Low: score < 15
- Medium: 15 ≤ score < 30
- High: 30 ≤ score < 50
- Critical: score ≥ 50
```

### Room Risk Calculation

Rooms are flagged based on:
- Average risk score of occupants
- Number of high-risk students
- Complaint frequency from room

### Automatic Escalation

Risk tickets are automatically created when:
- Student reaches "high" or "critical" risk level
- Multiple complaints in short timeframe
- Serious incident verified
- Wellbeing survey shows distress

### Notification Triggers

Notifications are sent via:
- **Email**: Parents, wardens, administrators
- **SMS**: Emergency contacts for critical cases
- **In-app**: Dashboard alerts for wardens

## API Services

All data operations are handled through type-safe service modules:

- **Student Service**: CRUD + search + room assignment
- **Hostel Service**: Structure management (hostel/block/floor/room)
- **Complaint Service**: Filing, tracking, resolution
- **Incident Service**: Reporting, verification, analysis
- **Risk Service**: Score calculation, profiling, tickets
- **Wellbeing Service**: Survey submission, trend analysis
- **Notification Service**: Multi-channel alerts

## Security

- Row-level security (RLS) policies in Supabase
- Authentication required for all dashboard routes
- Server-side data fetching for sensitive information
- Encrypted passwords via Supabase Auth
- CSRF protection via middleware

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

### Environment Variables

Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Development

### Adding a New Module

1. Create service file in `lib/services/`
2. Add types to `lib/types/database.ts`
3. Create page in `app/dashboard/[module]/`
4. Add components in `components/[module]/`
5. Update sidebar navigation in `components/dashboard/Sidebar.tsx`

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Mobile app for students
- [ ] Real-time notifications via WebSockets
- [ ] Machine learning for risk prediction
- [ ] Integration with campus security systems
- [ ] Automated parent communication
- [ ] Report generation (PDF exports)
- [ ] Data visualization improvements
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG compliance)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions:
- GitHub Issues
- Email: support@example.com

---

Built with ❤️ for safer hostel environments