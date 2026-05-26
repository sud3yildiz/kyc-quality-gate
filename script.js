const FUNCTION_URL = "https://sude-kyc-api-france-endnercbd7adftgj.francecentral-01.azurewebsites.net/api/validateKyc";

function validateKYC() {
    const formData = {
        customer_type: document.getElementById('customerType').value,
        country_risk: document.getElementById('countryRisk').value,
        customer_segment: document.getElementById('customerSegment').value,
        monthly_volume: document.getElementById('monthlyVolume').value,
        id_document: document.getElementById('idDocument').checked,
        address_proof: document.getElementById('addressProof').checked,
        tax_id: document.getElementById('taxId').checked,
        source_of_funds: document.getElementById('sourceOfFunds').checked,
        pep_status: document.getElementById('pepStatus').checked,
        sanctions_match: document.getElementById('sanctionsMatch').checked
    };

    const btn = document.getElementById('validateBtn');
    btn.textContent = 'Validating...';
    btn.disabled = true;

    fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => displayResult(data))
    .catch(() => {
        // v1: If no backend yet, show a demo result
        displayResult(getDemoResult(formData));
    })
    .finally(() => {
        btn.textContent = 'Validate KYC Data';
        btn.disabled = false;
    });
}

function displayResult(data) {
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('scoreValue').textContent = data.data_quality_score;

    const riskEl = document.getElementById('riskLevel');
    riskEl.textContent = data.risk_level;
    riskEl.className = 'card-value ' + data.risk_level.toLowerCase();

    document.getElementById('kycStatus').textContent = data.kyc_status;

    fillList('missingList', data.missing_documents);
    fillList('warningsList', data.warnings);
    fillList('recommendationsList', data.recommendations);

    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

function fillList(elementId, items) {
    const ul = document.getElementById(elementId);
    ul.innerHTML = '';
    if (items && items.length > 0) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'None';
        ul.appendChild(li);
    }
}

function getDemoResult(data) {
    let score = 100;
    const missing = [];
    const warnings = [];
    const recommendations = [];

    if (!data.id_document) { score -= 20; missing.push('ID Document'); }
    if (!data.address_proof) { score -= 15; missing.push('Address Proof'); }
    if (!data.tax_id) { score -= 15; missing.push('Tax ID'); }
    if (!data.source_of_funds) { score -= 20; missing.push('Source of Funds Declaration'); }

    if (data.customer_type === 'corporate' && !data.tax_id) {
        warnings.push('Corporate customers require a valid Tax ID.');
        recommendations.push('Request Tax ID documentation from the customer.');
    }
    if (data.monthly_volume === 'high' && !data.source_of_funds) {
        warnings.push('High transaction volume requires source of funds declaration.');
        recommendations.push('Collect source of funds documentation.');
    }
    if (data.pep_status) {
        warnings.push('Customer is a Politically Exposed Person. Enhanced due diligence required.');
        recommendations.push('Escalate to compliance review team.');
    }

    let risk = 'Low';
    if (data.sanctions_match) { risk = 'Critical'; score = Math.min(score, 30); }
    else if (data.pep_status && data.country_risk === 'high') risk = 'High';
    else if (data.country_risk === 'high' || data.pep_status) risk = 'High';
    else if (score < 70 || data.country_risk === 'medium') risk = 'Medium';

    let status = 'Ready for Onboarding';
    if (risk === 'Critical' || data.sanctions_match) status = 'Manual Review Required';
    else if (risk === 'High' || missing.length >= 2) status = 'Manual Review Required';
    else if (missing.length > 0) status = 'Review Needed';

    if (missing.length === 0 && !warnings.length) {
        recommendations.push('KYC file is complete. Proceed with onboarding.');
    }

    return {
        data_quality_score: Math.max(score, 0),
        risk_level: risk,
        kyc_status: status,
        missing_documents: missing,
        warnings: warnings,
        recommendations: recommendations
    };
}
