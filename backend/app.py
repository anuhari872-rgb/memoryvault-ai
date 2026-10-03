"""
MemoryVault AI — Flask Backend

Minimal backend server providing API endpoints
for the MemoryVault AI application.
"""

from flask import Flask, jsonify

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """Return a simple health-check response."""
    return jsonify({
        "status": "ok",
        "service": "MemoryVault AI"
    })


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
