import azure.functions as func
import json

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="validateKyc", methods=["POST", "OPTIONS"])
def validate_kyc(req: func.HttpRequest) -> func.HttpResponse:

    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=200, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        })

    try:
        data = req.get_json()
    except Exception:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON"}),
            status_code=400,
            mimetype="application/json"
        )

    result = run_validation(data)

    return func.HttpResponse(
        json.dumps(result),
        mimetype="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )


def run_validation(data):
    score = 100
    missing = []
    warnings = []
    recommendations = []

    if not data.get("id_document"):
        score -= 20
        missing.append("ID Document")
    if not data.get("address_proof"):
        score -= 15
        missing.append("Address Proof")
    if not data.get("tax_id"):
        score -= 15
        missing.append("Tax ID")
    if not data.get("source_of_funds"):
        score -= 20
        missing.append("Source of Funds Declaration")

    if data.get("customer_type") == "corporate" and not data.get("tax_id"):
        warnings.append("Corporate customers require a valid Tax ID.")
        recommendations.append("Request Tax ID documentation from the customer.")

    if data.get("monthly_volume") == "high" and not data.get("source_of_funds"):
        warnings.append("High transaction volume requires source of funds declaration.")
        recommendations.append("Collect source of funds documentation.")

    if data.get("pep_status"):
        warnings.append("Customer is a Politically Exposed Person. Enhanced due diligence required.")
        recommendations.append("Escalate to compliance review team.")

    if data.get("country_risk") == "high":
        warnings.append("Customer is from a high-risk country.")

    risk = "Low"
    if data.get("sanctions_match"):
        risk = "Critical"
        score = min(score, 30)
        warnings.append("Sanctions match detected. Immediate manual review required.")
        recommendations.append("Do not proceed. Escalate to compliance immediately.")
    elif data.get("pep_status") and data.get("country_risk") == "high":
        risk = "High"
    elif data.get("country_risk") == "high" or data.get("pep_status"):
        risk = "High"
    elif score < 70 or data.get("country_risk") == "medium":
        risk = "Medium"

    status = "Ready for Onboarding"
    if data.get("sanctions_match") or risk == "Critical":
        status = "Manual Review Required"
    elif risk == "High" or len(missing) >= 2:
        status = "Manual Review Required"
    elif len(missing) > 0:
        status = "Review Needed"

    if not missing and not warnings:
        recommendations.append("KYC file is complete. Proceed with onboarding.")

    return {
        "data_quality_score": max(score, 0),
        "risk_level": risk,
        "kyc_status": status,
        "missing_documents": missing,
        "warnings": warnings,
        "recommendations": recommendations
    }
