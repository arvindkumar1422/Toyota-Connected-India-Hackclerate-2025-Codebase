# EVTwin: Digital Twin for Industrial Monitoring

EVTwin is a real-time digital twin application designed for industrial monitoring. It simulates machine data, detects anomalies, assesses failure risks, and provides energy optimization recommendations. The system features a role-based dashboard for different user levels (Head, Lead, Worker) and visualizes data using charts and 3D models.

## Features

*   **Real-time Machine Simulation:** Simulates operational data (power, voltage, temperature, vibration, etc.) for CNC machines and Assembly Robots.
*   **Anomaly Detection:** Detects power spikes, voltage drops, high temperatures, idle power waste, vibration anomalies, and cycle time deviations.
*   **Failure Risk Assessment:** Calculates failure probability based on machine health indicators.
*   **Energy Recommendations:** Suggests optimizations to reduce energy consumption.
*   **Role-Based Access Control:**
    *   **Head:** Overview of all metrics and high-level insights.
    *   **Lead:** Detailed monitoring and team management views.
    *   **Worker:** Operational view focused on specific machine tasks.
*   **Interactive Dashboard:** Visualizes real-time data with charts and 3D model integration.
*   **Firebase Authentication:** Secure login using Google Sign-In.

## Architecture

```mermaid
graph TD
    User[User (Head/Lead/Worker)] -->|Access| WebUI[Web Dashboard (HTML/JS)]
    WebUI -->|Auth| Firebase[Firebase Auth]
    WebUI -->|Real-time Data| SocketIO[Flask-SocketIO]
    
    subgraph Backend
        Flask[Flask App]
        SocketIO --> Flask
        Simulator[Machine Simulator] -->|Raw Data| Flask
        Detector[Anomaly Detector] -->|Analysis| Flask
        Logger[Audit Logger]
        Flask --> Logger
    end
    
    subgraph Frontend
        Charts[Chart.js]
        ThreeJS[3D Models]
        WebUI --> Charts
        WebUI --> ThreeJS
    end
```

## Tech Stack

*   **Backend:** Python, Flask, Flask-SocketIO
*   **Frontend:** HTML, CSS, JavaScript
*   **Data Processing:** Scikit-learn (for potential future ML integration), Custom Rule-based Logic
*   **Containerization:** Docker

## Project Structure

```
evtwin/
├── app.py                 # Main Flask application entry point
├── detector.py            # Anomaly detection logic
├── simulator.py           # Machine data simulation logic
├── security.py            # Security related utilities
├── requirements.txt       # Python dependencies
├── Dockerfile             # Docker build instructions
├── README.md              # Project documentation
├── LICENSE                # MIT License
├── config/
│   └── firebase-config.js # Firebase configuration
├── data/
│   └── mock_data.json     # Static mock data
├── static/
│   ├── css/               # Stylesheets
│   ├── img/               # Images and assets
│   ├── js/                # Frontend JavaScript logic
│   └── models/            # 3D models (GLB files)
└── templates/             # HTML templates
    ├── index.html         # Login page
    ├── dashboard.html     # Main dashboard layout
    └── ...                # Role-specific dashboards
```

## Getting Started

### Prerequisites

*   Python 3.8+
*   Docker (optional, for containerized deployment)

### Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arvindkumar1422/Toyota-Connected-India-Hackclerate-2025-Codebase.git
    cd Toyota-Connected-India-Hackclerate-2025-Codebase/evtwin
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `evtwin` directory (or set them in your shell) if needed.
    *   `SECRET_KEY`: Flask secret key (default provided for dev).

5.  **Run the application:**
    ```bash
    python app.py
    ```
    The application will be available at `http://localhost:5000`.

### Docker Deployment

1.  **Build the Docker image:**
    ```bash
    docker build -t evtwin .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 5000:5000 evtwin
    ```

## Usage

1.  Open your browser and navigate to `http://localhost:5000`.
2.  Log in using Google Sign-In (requires valid Firebase configuration in `static/js/firebase-config.js`).
3.  Based on the logged-in user's email, you will be redirected to the appropriate dashboard (Head, Lead, or Worker).
    *   *Note: The current role mapping is hardcoded in `app.py` for demonstration purposes.*

## Audit Logging
- All login/logout and critical actions are logged in the backend (see `audit.log`).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note:** This codebase was developed under tight time constraints for the Toyota Connected India Hackclerate 2025. Some implementations may be simplified or require further refinement for production use.
- The dashboard is fully responsive. Test on Chrome DevTools (toggle device toolbar) or real devices.

## Audit Logging
- All login/logout and critical actions are logged in the backend (see future `audit.log`). 
