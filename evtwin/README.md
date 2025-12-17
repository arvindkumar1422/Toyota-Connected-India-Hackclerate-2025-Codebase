## Real-time Features
- Requires: flask-socketio, scikit-learn

## Run
```bash
pip install -r requirements.txt
python app.py  # or python3 app.py
```

## Docker Deployment
```bash
docker build -t evtwin .
docker run -p 5000:5000 --env-file .env evtwin
```

## Environment Variables
- Configure sensitive settings in a `.env` file (see Docker example above).
- For Firebase, edit `config/firebase-config.js`.

## Mobile/Tablet Testing
- The dashboard is fully responsive. Test on Chrome DevTools (toggle device toolbar) or real devices.

## Audit Logging
- All login/logout and critical actions are logged in the backend (see future `audit.log`). 