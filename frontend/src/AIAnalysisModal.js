import React from 'react';
import './AIAnalysisModal.css';

const AIAnalysisModal = ({ analysis, onClose, imageSrc }) => {
  if (!analysis) return null;

  const getComplianceColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 Comprehensive AI Analysis Results</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Image Preview */}
          <div className="modal-image-section">
            <img src={imageSrc} alt="Analyzed" className="modal-image" />
            <div className="compliance-overlay">
              <span 
                className="compliance-badge-large"
                style={{ backgroundColor: getComplianceColor(analysis.compliance_score) }}
              >
                {analysis.compliance_score}% Safety Compliant
              </span>
            </div>
          </div>

          {/* Analysis Sections Grid */}
          <div className="analysis-grid">
            
            {/* 1. Image Description */}
            <div className="analysis-card description-card">
              <div className="card-header">
                <span className="card-icon">📝</span>
                <h3>Image Description</h3>
              </div>
              <div className="card-body">
                <p className="brief-caption">{analysis.caption}</p>
                {analysis.detailed_description && (
                  <div className="detailed-description">
                    <strong>Detailed Analysis:</strong>
                    <p>{analysis.detailed_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Objects Detected */}
            {analysis.objects_detected && analysis.objects_detected.length > 0 && (
              <div className="analysis-card">
                <div className="card-header">
                  <span className="card-icon">🔍</span>
                  <h3>Objects Detected ({analysis.objects_detected.length})</h3>
                </div>
                <div className="card-body">
                  <div className="tags-grid">
                    {analysis.objects_detected.map((obj, idx) => (
                      <span key={idx} className="object-tag">{obj}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. People Analysis */}
            {analysis.people_count > 0 && (
              <div className="analysis-card">
                <div className="card-header">
                  <span className="card-icon">👥</span>
                  <h3>People Analysis</h3>
                </div>
                <div className="card-body">
                  <div className="stat-item">
                    <span className="stat-label">Count:</span>
                    <span className="stat-value">{analysis.people_count} {analysis.people_count === 1 ? 'person' : 'people'}</span>
                  </div>
                  {analysis.people_details && analysis.people_details.description && (
                    <p className="details">{analysis.people_details.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Scene Understanding */}
            <div className="analysis-card">
              <div className="card-header">
                <span className="card-icon">🏞️</span>
                <h3>Scene Understanding</h3>
              </div>
              <div className="card-body">
                <div className="stats-list">
                  {analysis.scene_type && (
                    <div className="stat-item">
                      <span className="stat-label">Scene Type:</span>
                      <span className="stat-value">{analysis.scene_type}</span>
                    </div>
                  )}
                  {analysis.time_of_day && (
                    <div className="stat-item">
                      <span className="stat-label">Time of Day:</span>
                      <span className="stat-value">{analysis.time_of_day}</span>
                    </div>
                  )}
                  {analysis.weather_condition && (
                    <div className="stat-item">
                      <span className="stat-label">Weather:</span>
                      <span className="stat-value">{analysis.weather_condition}</span>
                    </div>
                  )}
                  {analysis.lighting_quality && (
                    <div className="stat-item">
                      <span className="stat-label">Lighting:</span>
                      <span className="stat-value">{analysis.lighting_quality}</span>
                    </div>
                  )}
                  {analysis.scene_mood && (
                    <div className="stat-item">
                      <span className="stat-label">Atmosphere:</span>
                      <span className="stat-value">{analysis.scene_mood}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Text Extraction */}
            {analysis.has_text && analysis.extracted_text && (
              <div className="analysis-card">
                <div className="card-header">
                  <span className="card-icon">📄</span>
                  <h3>Text Found (OCR)</h3>
                </div>
                <div className="card-body">
                  <div className="extracted-text-box">
                    {analysis.extracted_text}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Activity Recognition */}
            {(analysis.primary_activity || (analysis.activities_detected && analysis.activities_detected.length > 0)) && (
              <div className="analysis-card">
                <div className="card-header">
                  <span className="card-icon">🎬</span>
                  <h3>Activity Recognition</h3>
                </div>
                <div className="card-body">
                  {analysis.primary_activity && (
                    <div className="stat-item">
                      <span className="stat-label">Primary Activity:</span>
                      <span className="stat-value">{analysis.primary_activity}</span>
                    </div>
                  )}
                  {analysis.activities_detected && analysis.activities_detected.length > 0 && (
                    <ul className="activities-list">
                      {analysis.activities_detected.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* 7. Color Analysis */}
            {(analysis.dominant_colors || analysis.color_palette) && (
              <div className="analysis-card">
                <div className="card-header">
                  <span className="card-icon">🎨</span>
                  <h3>Color Analysis</h3>
                </div>
                <div className="card-body">
                  {analysis.dominant_colors && analysis.dominant_colors.length > 0 && (
                    <div className="color-section">
                      <strong>Dominant Colors:</strong>
                      <div className="colors-grid">
                        {analysis.dominant_colors.map((color, idx) => (
                          <span key={idx} className="color-chip">{color}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.color_palette && (
                    <div className="stat-item">
                      <span className="stat-label">Palette:</span>
                      <span className="stat-value">{analysis.color_palette}</span>
                    </div>
                  )}
                  {analysis.visual_aesthetics && (
                    <p className="details">{analysis.visual_aesthetics}</p>
                  )}
                </div>
              </div>
            )}

            {/* 8. Quality Assessment */}
            <div className="analysis-card">
              <div className="card-header">
                <span className="card-icon">⚡</span>
                <h3>Quality Assessment</h3>
              </div>
              <div className="card-body">
                <div className="quality-badges-grid">
                  <span className={`quality-chip ${analysis.image_quality}`}>
                    {analysis.image_quality || 'unknown'} quality
                  </span>
                  {analysis.is_blurry && <span className="warning-chip">Blurry</span>}
                  {analysis.is_overexposed && <span className="warning-chip">Overexposed</span>}
                  {analysis.is_underexposed && <span className="warning-chip">Underexposed</span>}
                </div>
                {analysis.composition_notes && (
                  <p className="details">{analysis.composition_notes}</p>
                )}
              </div>
            </div>

            {/* 9. Safety Compliance */}
            {analysis.safety_compliance && Object.keys(analysis.safety_compliance).length > 0 && (
              <div className="analysis-card safety-card">
                <div className="card-header">
                  <span className="card-icon">🛡️</span>
                  <h3>Safety Compliance Checklist</h3>
                </div>
                <div className="card-body">
                  {Object.entries(analysis.safety_compliance).map(([key, item]) => (
                    <div key={key} className="safety-item">
                      <div className="safety-header">
                        <span className={`safety-icon ${item.passed ? 'passed' : 'failed'}`}>
                          {item.passed ? '✅' : '❌'}
                        </span>
                        <strong>{item.question}</strong>
                      </div>
                      <p className="safety-answer">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="modal-footer">
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-icon">🤖</span>
                <span>{analysis.ai_model_version || 'Moondream AI'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-icon">⏱️</span>
                <span>{analysis.processing_time_ms}ms</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-icon">📅</span>
                <span>{new Date(analysis.analyzed_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;

