# Office Management - Island-Based Architecture Update

## Overview
The office management system has been redesigned from **individual desk booking** to **island/area-based booking**. This enables better workspace management and team coordination.

## Architecture

### Three-Level Hierarchy

1. **Desk Islands/Areas** (Organization Level)
   - Defined by org admins
   - Examples: "North Wing", "Engineering Area", "Meeting Zone"
   - Contains multiple individual desks
   - Each island tracks: total desks, available desks, equipment features

2. **Island Bookings** (Community Lead Level)
   - Community leads book entire islands for their team
   - Specify: date range, expected team size, notes
   - Booking status: pending, confirmed, cancelled, completed
   - Each community can only book one island per date

3. **Individual Desk Bookings** (Team Member Level)
   - Team members book individual desks within booked islands
   - Can only book desks in islands booked by their community
   - Tracks: check-in/out times, booking status

## Database Schema

### desk_islands
```
- id (primary key)
- organization_id (foreign key)
- name (unique per org)
- description
- floor, building, location
- total_desks, available_desks
- has_monitors, has_docking_stations, has_standing_desks
- status (available, booked, maintenance)
- is_active, is_bookable
- created_at, updated_at, created_by_user_id
```

### office_desks (Updated)
```
- id (primary key)
- organization_id (foreign key)
- island_id (foreign key) - NOW REQUIRED
- desk_number (unique per org)
- position_in_island (for ordering)
- description
- has_monitor, has_docking_station, has_standing_desk
- equipment_notes
- status (available, occupied, maintenance)
- is_active, is_bookable
- created_at, updated_at, created_by_user_id
```

### island_bookings (New)
```
- id (primary key)
- island_id (foreign key)
- community_id (foreign key)
- booked_by_user_id (foreign key) - community lead
- organization_id (foreign key)
- booking_date, start_date, end_date
- team_size (expected number of team members)
- status (pending, confirmed, cancelled, completed)
- notes, cancellation_reason
- created_at, updated_at, cancelled_at
- UNIQUE(community_id, start_date, island_id)
```

### desk_bookings (Updated)
```
- id (primary key)
- desk_id (foreign key)
- island_booking_id (foreign key) - links to parent island booking
- user_id (foreign key)
- organization_id (foreign key)
- booking_date, start_date, end_date
- check_in_time, check_out_time
- status (pending, confirmed, cancelled, completed)
- notes, cancellation_reason
- created_at, updated_at, cancelled_at
- UNIQUE(user_id, booking_date)
```

## API Endpoints

### Island Management (Org Admin Only)
- `POST /api/office/islands` - Create new island
- `GET /api/office/islands` - List all islands
- `GET /api/office/islands/{island_id}` - Get island details
- `PATCH /api/office/islands/{island_id}` - Update island
- `DELETE /api/office/islands/{island_id}` - Delete island

### Desks in Islands (Org Admin)
- `POST /api/office/islands/{island_id}/desks` - Add desk to island
- `GET /api/office/islands/{island_id}/desks` - List desks in island
- `PATCH /api/office/desks/{desk_id}` - Update desk
- `DELETE /api/office/desks/{desk_id}` - Remove desk

### Island Bookings (Community Lead)
- `POST /api/office/island-bookings` - Community lead books island
- `GET /api/office/island-bookings` - List island bookings
- `GET /api/office/island-bookings/my-bookings` - Community lead's bookings
- `PATCH /api/office/island-bookings/{booking_id}` - Update booking
- `POST /api/office/island-bookings/{booking_id}/cancel` - Cancel booking

### Desk Bookings (Team Member)
- `POST /api/office/desk-bookings` - Team member books desk within island
- `GET /api/office/desk-bookings/my-bookings` - Team member's bookings
- `GET /api/office/desk-bookings/available` - Available desks in booked islands
- `POST /api/office/desk-bookings/{booking_id}/check-in` - Check in
- `POST /api/office/desk-bookings/{booking_id}/check-out` - Check out
- `POST /api/office/desk-bookings/{booking_id}/cancel` - Cancel booking

## Workflow

### Admin Setup
1. Admin creates desk islands (areas)
2. Admin defines which desks belong to each island
3. Each desk inherits or overrides island settings

### Community Lead Booking
1. Community lead views available islands
2. Community lead selects island and date range
3. System creates IslandBooking for community
4. Team members can now see available desks in that island

### Team Member Booking
1. Team member views available islands (that their community booked)
2. Team member selects individual desk within island
3. System creates DeskBooking linked to IslandBooking
4. Team member checks in/out to track usage

## Key Features

- **Hierarchical Organization**: Islands group desks logically by location/team
- **Team Coordination**: Community leads reserve space for entire team
- **Flexible Booking**: Individual team members pick specific desks
- **Equipment Tracking**: Each desk can specify monitor, docking station, standing desk
- **Check-in/Check-out**: Track actual desk usage for analytics
- **Cancellation Support**: Both island and desk bookings can be cancelled
- **Multi-day Booking**: Support for date ranges, not just single days
- **Unique Constraints**: Prevent double-booking and ensure data integrity
