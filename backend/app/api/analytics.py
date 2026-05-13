from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.incident import Incident

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total = db.query(Incident).count()
    critical = db.query(Incident).filter(Incident.severity == "Critical").count()
    
    severity_distribution = db.query(
        Incident.severity, func.count(Incident.id)
    ).group_by(Incident.severity).all()
    
    recent = db.query(Incident).order_by(Incident.timestamp.desc()).limit(10).all()
    
    return {
        "kpis": {
            "total_incidents": total,
            "critical_alerts": critical
        },
        "severity_distribution": [{"name": s[0], "value": s[1]} for s in severity_distribution],
        "recent_alerts": recent
    }
