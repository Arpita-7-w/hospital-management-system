# hospital-management-system

# Hospital Management System

A frontend website for managing doctor appointments, built for the ISD Lab project. It has two separate portals, one for **doctors** and one for **patients**, each with its own registration, login, and dashboard.

## Features

*Doctor portal**
- Register and log in as a doctor (with a specialty)
- Dashboard with appointment statistics (total, waiting, confirmed)
- View appointment requests from patients
- Accept or decline each request

**Patient portal**
- Register and log in as a patient
- Dashboard with an appointment booking form (choose a doctor, date, time, and reason)
- View all booked appointments and their status (Pending, Confirmed, Declined, Cancelled)
- Cancel an appointment

# Built with

- HTML
- CSS
- JavaScript (no frameworks)

Data is stored in the browser using `localStorage`, so no backend or database is needed.

Pages

| File | Purpose |

| `index.html` | Home page with links to both portals |
| `doctor-auth.html` | Doctor login and registration |
| `patient-auth.html` | Patient login and registration |
| `doctor-dashboard.html` | Doctor dashboard |
| `patient-dashboard.html` | Patient dashboard |
| `styles.css` | Shared styling |
| `script.js` | Shared logic for all pages |

 How to run

1. Download or clone this repository.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a browser.

 How to try it

1. Register a doctor account and log out.
2. Register a patient account.
3. As the patient, book an appointment with the doctor.
4. Log out, log in as the doctor, and accept or decline the request.
5. Log back in as the patient to see the updated status.


## Code Developed By
- Jannatul Maowa
