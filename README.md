# KYC Quality Gate

**KYC Data Quality Validator for Banking Onboarding**

KYC Quality Gate is a cloud-based internal data quality validation tool designed for banking onboarding and compliance teams. It validates customer KYC records by checking missing documents, identifying inconsistent data, calculating a data quality score, assigning a risk level, and recommending next actions.

## Architecture

- **Frontend**: Azure Web App (Flask + Gunicorn) — serves the UI
- **Backend**: Azure Function App (Python V2) — runs the validation logic
- **Communication**: HTTP fetch requests with JSON responses
- **CI/CD**: GitHub Actions — auto-deploys on every push to main

## Project Structure

```
kyc-quality-gate/
├── app.py                  # Flask frontend server
├── requirements.txt        # Frontend dependencies
├── index.html              # KYC form and result dashboard
├── style.css               # UI styling
├── script.js               # Frontend logic and fetch calls
├── api/
│   ├── function_app.py     # Azure Function validation logic
│   ├── requirements.txt    # Backend dependencies
│   ├── host.json
│   └── local.settings.json
└── .github/workflows/      # GitHub Actions CI/CD
```

## Disclaimer

This tool does not make final compliance decisions. It supports banking staff by validating KYC data quality and highlighting cases that require manual review.
