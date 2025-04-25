# Kasi Bus Booking System (KBBS)


The **Kasi Bus Booking System (KBBS)** is a digital platform designed to streamline the process of booking, managing, and tracking bus tickets for local travel. The system aims to enhance user convenience, improve operational efficiency for bus service providers, and reduce manual errors associated with traditional ticketing systems.

---

## Table of Contents
1. [Introduction](#introduction)
2. [Team Roles and Responsibilities](#team-roles-and-responsibilities)
3. [Company Situation Analysis](#company-situation-analysis)
4. [Problems and Constraints](#problems-and-constraints)
5. [Database System Specifications](#database-system-specifications)
6. [ERD: Attributes, Keys & Relationships](#erd-attributes-keys--relationships)  
7. [Database Normalization](#database-normalization)  
8. [Conclusion](#conclusion)
9. [References](#references)

---

## 1. Introduction
A bus stop serving a large number of bus lines can experience a condition known as **bus stop failure** due to limited capacity and high passenger demand, which negatively affects the punctuality and reliability of bus services and causes delays to other traffic [1].

The **Kasi Bus Booking System (KBBS)** aims to address these challenges by providing a fast, reliable, and user-friendly platform for booking bus tickets. One of the **key features** of the system is **route scheduling and seat reservations**, which ensures real-time updates and efficient management of bus operations.

---

## 2. Team Roles and Responsibilities
To ensure the successful development and implementation of the KBBS, the following roles have been assigned:

| Role                  | Team Member           | Responsibilities                                                                 |
|-----------------------|-----------------------|---------------------------------------------------------------------------------|
| **Project Manager**   | Qhoba Leon (37337300) | Oversees the entire project, manages timelines, and ensures objectives are met. |
| **Frontend Developers** | Oratile Riet (46315713), B.T Zwane (31670903), Thuso Makhada (45367108) | Design and develop the user interface (UI) using **React.js**. |
| **Backend Developers** | Raphulu M.L (42284066), B Mashabela (45556415) | Develop server-side logic, database integration, and APIs using **Express.js**. |
| **Database Designer** | Kgotso Seadimo (37611720) | Design and manage the database schema using **MySQL**. |
| **System Analyst**    | Dineo Kekana (40912965) | Analyze system requirements and propose solutions. |
| **QA Engineer**       | Kw Sejake (35006676) | Test the system for bugs and ensure reliability. |
| **Documentation Specialist** | Thuso Makhada (45367108) | Create and maintain project documentation using **GitHub** and **[Eraser.io](https://app.eraser.io/dashboard/all)**. |

---

## 3. Company Situation Analysis
### 3.1 Objectives (Mission)
- Provide a **fast, reliable, and user-friendly platform** for booking bus tickets.
- Reduce manual errors and inefficiencies in traditional ticketing systems [2].
- Offer **real-time seat availability** and **dynamic pricing** based on demand.
- Enhance data security and fraud prevention through secure payment processing [3].
- Improve customer satisfaction by providing timely updates and support.

### 3.2 Operations
- **User Registration & Authentication:** Passengers can create accounts to manage bookings.
- **Bus Scheduling & Management:** Admins can update bus schedules and routes using the **route scheduling module**.
- **Seat Reservation:** Users can select seats based on **real-time availability** to prevent overbooking.
- **Payment Processing:** Secure online payments through multiple gateways.
- **Real-Time Tracking & Notifications:** Passengers receive updates on bus departure times.
- **Customer Support:** A dedicated module for handling complaints and inquiries.

---

## 4. Problems and Constraints
### 4.1 Identified Problems
- **Manual Booking Errors:** Long wait times and inefficiencies in traditional ticketing [4].
- **Overbooking & Scheduling Conflicts:** Poor data management leads to errors in seat allocation.
- **Limited Digital Accessibility:** Some passengers may struggle with mobile applications [5].
- **Cybersecurity Risks:** Online payment systems require robust security measures [6].
- **Internet Connectivity Constraints:** Rural areas may face challenges in accessing online booking [7].

### 4.2 Constraints
- **Financial Resources:** Limited budget for advanced technological enhancements.
- **Technical Expertise:** Insufficient technical expertise for database and system development.
- **Payment Integration:** Dependence on external service providers for online payment systems.
- **Scalability:** The system must handle increasing numbers of users and transactions [8].

---

## 5. Database System Specifications
### 5.1 Objectives
- Automate ticket booking and cancellation to reduce manual errors.
- Provide **real-time seat availability** to prevent overbooking [9].
- Implement **dynamic pricing models** based on time and demand.
- Ensure secure payments and user authentication mechanisms [10].
- Maintain a scalable and optimized database structure for fast queries.

### 5.2 Information Required from the Database
- **User Information:** Name, contact details, booking history.
- **Bus Details:** Bus numbers, capacity, types, routes, and schedules.
- **Booking Records:** User reservations, seat numbers, timestamps.
- **Payment Transactions:** Payment method, status, transaction history.
- **Customer Complaints:** Complaint type, user details, resolution status.

---

## 6.  📚 ERD: Attributes, Keys & Relationships

### 🏷️ Attributes

**User Table**
- `User_ID` (PK)  
- `First_Name`, `Last_Name`, `Age`, `Email`, `Phone_num`, `Reg_Date`, `Password`  
- `NextOfKin_Name`, `NextOfKin_Phone`

**Bus Table**
- `Bus_ID` (PK)  
- `Bus_Model`, `Bus_Capacity`  
- `Driver_ID` (FK → Driver)

**Schedule Table**
- `ScheduleID` (PK)  
- `Bus_ID` (FK), `RouteID` (FK)  
- `DepartureDate`, `DepartureTime`, `ArrivalTime`, `SeatsAvailable`

**Route Table**
- `RouteID` (PK)  
- `Source`, `Destination`, `Distance_KM`, `Estimated_Time`

**Booking Table**
- `Booking_ID` (PK)  
- `User_ID` (FK), `ScheduleID` (FK), `Booking_Date`, `Price`, `Booking_Status`

**Seat Table**
- `Seat_ID` (PK), `Bus_ID` (FK), `Seat_Availability`

**Booking_Seat Table**
- `Booking_ID` (FK), `Seat_ID` (FK)

**Complaint Table**
- `Complaint_ID` (PK)  
- `User_ID` (FK), `Booking_ID` (FK)  
- `Complaint_Type`, `Description`, `Status`, `DateSubmitted`, `DateResolved`, `Admin_ID` (FK)

**Admin Table**
- `Admin_ID` (PK), `Admin_Name`

**Driver Table**
- `Driver_ID` (PK), `Driver_Name`

---
## 7.Entity Relationships

1. **User** — books — **Booking** (1:N)  
2. **Booking** — assigned to — **Seat** (1:1 at a time, M:1 historically)  
3. **Bus** — has — **Schedule** (1:N)  
4. **Schedule** — follows — **Route** (1:N)  
5. **Bus** — contains — **Seat** (1:N)  
6. **User** — submits — **Complaint** (1:N)  
7. **Complaint** — about — **Booking** (1:N)  
8. **Complaint** — handled by — **Admin** (1:N)  
9. **Bus** — driven by — **Driver** (1:N)

---

## 🧩 Database Normalization

### 1NF
- Split composite attributes like `Names` into `First_Name` and `Last_Name`  
- All attributes are atomic

### 2NF
- Eliminated partial dependencies in `Booking_Seat`  
- All relations with single-column PKs, so 2NF satisfied

### 3NF
- Removed transitive dependencies  
  - `Assigned_BusDriver_Name` → `Driver` table  
  - `Assigned_Admin_Name` → `Admin` table

    
![Alt text](path/to/image)

--- 

## 8. Conclusion
The **Kasi Bus Booking System (KBBS)** aims to revolutionize local public transport by providing a **fast, reliable, and user-friendly platform** for booking bus tickets. By addressing the identified problems and constraints, the system will enhance operational efficiency, reduce manual errors, and improve customer satisfaction. The **route scheduling** and **seat reservation** features are central to the system's success, ensuring real-time updates and efficient management of bus operations.

---

## 7. References
1. Wang, Y., & Zhang, X. (2020). "Bus Stop Failure and Its Impact on Transit System Performance." *Journal of Public Transportation*, 23(4), 45-60.
2. Kumar, S., & Sharma, R. (2022). *Modern Public Transportation Systems: Challenges and Innovations*. Springer.
3. Jones, P. (2021). *Digital Transformation in Transportation: The Future of Mobility*. Wiley.
4. Smith, J. (2020). "The Role of Technology in Enhancing Public Transport Efficiency." *Journal of Transportation and Logistics*, 45(3), 120-135.
5. World Bank. (2023). *The Impact of Digitalization on Urban Transport*. Available at: [https://www.worldbank.org](https://www.worldbank.org).
6. Department of Transport. (2022). *National Public Transport Strategy Report*. Government of South Africa.
7. DeepSeek. (2024). *DeepSeek Chat: AI-powered conversational assistant*. Available at: [https://deepseek.com](https://deepseek.com).
8. Johnson, L. (2021). "Scalability Challenges in Public Transport Systems." *International Journal of Transport Management*, 12(2), 89-102.
9. Brown, T. (2020). "Real-Time Seat Allocation Systems: A Case Study." *Transportation Research*, 15(1), 34-49.
10. Green, M. (2023). "Secure Payment Systems in Public Transport." *Journal of Cybersecurity*, 8(3), 210-225.
11. Miro. (n.d.). Bus Booking System ERD. [online] Available at: https://miro.com/app/board/uXjVI_IZwF4=
12. Monkhouse, J. (2021). Logical Data Modelling using Crow's Foot Notation. [YouTube video] Available at: https://youtu.be/J-drts33N8g?si=Pid8V6yFVl6_A6RM

---

## Key Features Highlighted
- **Route Scheduling:**
  - Admins can update bus schedules and routes in real-time.
  - Passengers can view available routes and schedules on the platform.
  - Algorithms ensure no scheduling conflicts or overbooking.

- **Seat Reservations:**
  - Users can select seats based on real-time availability.
  - The system prevents overbooking by updating seat availability instantly.
  - Seat selection is integrated with the payment gateway for seamless transactions.

---

## Tools and Technologies
- **Frontend:** React.js
- **Backend:** Express.js
- **Database:** MySQL
- **Version Control & CI/CD:** GitHub
- **UML Design:** [Eraser.io](https://app.eraser.io/dashboard/all)
