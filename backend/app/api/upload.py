from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.incident import Upload, Incident
import pandas as pd
import io

router = APIRouter()

@router.post("/")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV or JSON files are supported.")
        
    content = await file.read()
    
    # Create Upload Record
    db_upload = Upload(filename=file.filename, file_type=file.filename.split('.')[-1], status="processing")
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    try:
        # Data Normalization Engine (Basic CSV parsing)
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
            
            # Map columns to unified schema (simplified for demo)
            for _, row in df.iterrows():
                incident = Incident(
                    timestamp=pd.to_datetime(row.get('timestamp', pd.Timestamp.now())),
                    severity=row.get('severity', 'Low'),
                    source_ip=row.get('source_ip', ''),
                    destination_ip=row.get('destination_ip', ''),
                    hostname=row.get('hostname', ''),
                    username=row.get('username', ''),
                    event_type=row.get('event_type', 'Unknown'),
                    status=row.get('status', 'Open'),
                    description=row.get('description', ''),
                    upload_id=db_upload.id
                )
                db.add(incident)
                
            db.commit()
            db_upload.status = "processed"
            db.commit()
            
    except Exception as e:
        db_upload.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Successfully uploaded and parsed dataset", "upload_id": db_upload.id}
