# Sentivoy 🛡️
**AI-Powered Security Intelligence Platform**

Sentivoy is a real-time security intelligence platform that monitors application and server logs to identify threats. By combining PyTorch-based anomaly detection with an agentic decision layer, Sentivoy moves beyond simple pattern matching to provide context-aware security reasoning.

## 🚀 Features
- **Real-time Log Ingestion:** High-throughput ingestion via APIs or lightweight agents.
- **Isolated Forest Anomaly Detection:** Identifies behavioral deviations, unusual logins, and geo-anomalies.
- **Agentic Decision Layer:** Uses context-aware reasoning to classify threat severity and suggest automated responses.
- **Interactive Dashboard:** Clean visualization of system health and active threat intelligence.

## 🛠️ Tech Stack
- **AI/ML:** XGBOOST, Isolated Forest, LangChain (Agentic Layer)
- **Backend:** Python (FastAPI), Redis (Stream Processing)
- **Frontend:** React, Tailwind CSS, Recharts
- **Data Ingestion:** REST APIs, Logstash/Fluentbit

## 📂 Project Structure
- `/src/models`: PyTorch anomaly detection scripts.
- `/src/agent`: LLM-based decision and classification logic.
- `/src/api`: Log ingestion endpoints and dashboard backend.
- `/dashboard`: Frontend source code.

## 👥 Team Members
- **Member 1:** Utkarsh/NexVed — AI Model Development & Agentic Layer Logic
- **Member 2:** Himanshu Solanki/Rion — Backend Developer
- **Member 3:** Pari Singla/parisingla — Backend Developer
- **Member 4:** Dakshayani/dakshayani1226-oss— Frontend Developer

## 📜 License
This project is developed for Byte Me.
