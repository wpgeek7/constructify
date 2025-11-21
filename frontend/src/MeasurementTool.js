import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import './MeasurementTool.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Scale presets
const SCALE_PRESETS = {
  architectural: [
    { label: '1/128" = 1\'', ratio: 1/128 },
    { label: '1/64" = 1\'', ratio: 1/64 },
    { label: '1/32" = 1\'', ratio: 1/32 },
    { label: '1/16" = 1\'', ratio: 1/16 },
    { label: '3/32" = 1\'', ratio: 3/32 },
    { label: '1/8" = 1\'', ratio: 1/8 },
    { label: '3/16" = 1\'', ratio: 3/16 },
    { label: '1/4" = 1\'', ratio: 1/4 },
    { label: '3/8" = 1\'', ratio: 3/8 },
    { label: '1/2" = 1\'', ratio: 1/2 },
    { label: '3/4" = 1\'', ratio: 3/4 },
    { label: '1" = 1\'', ratio: 1 },
    { label: '1½" = 1\'', ratio: 1.5 },
    { label: '3" = 1\'', ratio: 3 },
    { label: '6" = 1\'', ratio: 6 },
    { label: '12" = 1\'', ratio: 12 },
  ],
  engineering: [
    { label: '1" = 5\'', ratio: 60 },
    { label: '1" = 10\'', ratio: 120 },
    { label: '1" = 20\'', ratio: 240 },
    { label: '1" = 30\'', ratio: 360 },
    { label: '1" = 40\'', ratio: 480 },
    { label: '1" = 50\'', ratio: 600 },
    { label: '1" = 60\'', ratio: 720 },
    { label: '1" = 80\'', ratio: 960 },
    { label: '1" = 100\'', ratio: 1200 },
    { label: '1" = 200\'', ratio: 2400 },
    { label: '1" = 300\'', ratio: 3600 },
    { label: '1" = 400\'', ratio: 4800 },
    { label: '1" = 500\'', ratio: 6000 },
    { label: '1" = 1000\'', ratio: 12000 },
  ],
  metric: [
    { label: '1:10', ratio: 10 },
    { label: '1:20', ratio: 20 },
    { label: '1:25', ratio: 25 },
    { label: '1:50', ratio: 50 },
    { label: '1:75', ratio: 75 },
    { label: '1:100', ratio: 100 },
  ]
};

// Default discipline icons
const DISCIPLINE_ICONS = {
  'Electrical': '⚡',
  'Mechanical': '🔧',
  'Architectural': '🏗️',
  'Structural': '⚡',
  'Landscape': '🌳',
  'Plumbing': '🚰',
  'HVAC': '❄️',
  'Fire Protection': '🔥',
};

function MeasurementTool({ plan, onClose }) {
  // Canvas and context refs
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // State
  const [user, setUser] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(plan.total_pages || 1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [img, setImg] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const [tool, setTool] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); // For dropdown menus
  const [snapOn, setSnapOn] = useState(true);
  const [invertSnap, setInvertSnap] = useState(false);
  const [invert, setInvert] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Dark mode for PDF viewing area
  
  // Floating toolbar drag state
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: window.innerHeight - 76 }); // 76 = 26px from bottom + 50px toolbar height
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef(null);
  
  const [shapes, setShapes] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [layers, setLayers] = useState([]);
  const [expandedDisciplines, setExpandedDisciplines] = useState(new Set(['electrical-sd']));
  const [expandedLayers, setExpandedLayers] = useState(new Set(['el-01']));
  const [nextLayerId, setNextLayerId] = useState(1);
  const [working, setWorking] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [pixelsPerFoot, setPixelsPerFoot] = useState(null);
  const [metersPerPixel, setMetersPerPixel] = useState(null);
  const [usingMetric, setUsingMetric] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  const [isPanning, setIsPanning] = useState(false);
  const [panKey, setPanKey] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseScreen, setMouseScreen] = useState({ x: 0, y: 0 });
  
  const [hudText, setHudText] = useState('Loading plan...');
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [disciplineForm, setDisciplineForm] = useState({ name: '', icon: '📁', color: '#82eaff' });
  const [pendingTool, setPendingTool] = useState(null);
  const [layerForm, setLayerForm] = useState({ name: '', color: '#ffd166', disciplineId: null });
  
  const [calPts, setCalPts] = useState([]);
  const [lastLayerIds, setLastLayerIds] = useState({ line: null, poly: null, area: null, count: null });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderScale = 2;

  // Load plan file and data on mount
  useEffect(() => {
    loadPlanFile();
    loadDisciplines();
    loadMeasurements();
    setHudText('Select scale preset or calibrate, then start measuring');
  }, []);

  // Redraw on state changes
  useEffect(() => {
    if (imgLoaded) {
      draw();
    }
  }, [imgLoaded, shapes, working, view, selectedShape, invert, img, currentPage]);

  // Update zoom level display
  useEffect(() => {
    setZoomLevel(Math.round(view.z * 100));
  }, [view.z]);

  // Load plan file (PDF or image)
  const loadPlanFile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const fileUrl = `${API_URL}/plans/${plan.id}/file`;

      if (plan.file_type === 'application/pdf') {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          httpHeaders: { 'Authorization': `Bearer ${token}` },
          withCredentials: false,
          disableRange: true,
          disableStream: true
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPdfPage(pdf, 1);
      } else {
        const response = await fetch(fileUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        const image = new Image();
        image.onload = () => {
          setImg(image);
          setImgLoaded(true);
          setLoading(false);
          fitView();
          setHudText('Image loaded. Set scale to start measuring.');
        };
        image.onerror = () => {
          setHudText('Failed to load image');
          setLoading(false);
        };
        image.src = imageUrl;
      }
    } catch (err) {
      console.error('Error loading plan:', err);
      setHudText('Failed to load plan file');
      setLoading(false);
    }
  };

  // Render PDF page
  const renderPdfPage = async (pdf, pageNum) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: renderScale });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const image = new Image();
      image.onload = () => {
        setImg(image);
        setImgLoaded(true);
        setLoading(false);
        fitView();
        setHudText('PDF loaded. Set scale to start measuring.');
      };
      image.src = canvas.toDataURL();
    } catch (err) {
      console.error('Error rendering PDF:', err);
      setHudText('Failed to render PDF page');
      setLoading(false);
    }
  };

  // Navigate pages
  const nextPage = async () => {
    if (currentPage < totalPages && pdfDoc) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setLoading(true);
      await renderPdfPage(pdfDoc, next);
    }
  };

  const prevPage = async () => {
    if (currentPage > 1 && pdfDoc) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setLoading(true);
      await renderPdfPage(pdfDoc, prev);
    }
  };

  // Load disciplines from backend
  const loadDisciplines = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/plans/${plan.id}/disciplines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDisciplines(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading disciplines:', err);
    }
  };

  // Load measurements from backend
  const loadMeasurements = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/plans/${plan.id}/measurements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const measurements = response.data.data || [];
        
        // Group by layer_name to create layers
        const layerMap = new Map();
        measurements.forEach(m => {
          if (!layerMap.has(m.layer_name)) {
            layerMap.set(m.layer_name, {
              id: m.layer_name,
              name: m.layer_name,
              type: m.type,
              color: m.color,
              disciplineId: m.discipline_id,
              visible: true
            });
          }
        });
        setLayers(Array.from(layerMap.values()));
        
        // Convert measurements to shapes
        const loadedShapes = measurements.map(m => ({
          id: m.id,
          type: m.type,
          color: m.color,
          layer: m.layer_name,
          disciplineId: m.discipline_id,
          points: m.coordinates || [],
          value: m.value ? Number(m.value) : 0,
          unit: m.unit || '',
          page: m.page_number
        }));
        setShapes(loadedShapes);
      }
    } catch (err) {
      console.error('Error loading measurements:', err);
    }
  };

  // Save measurements to backend
  const saveMeasurements = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Convert shapes to measurements format
      const measurements = shapes.map(shape => ({
        id: shape.id || undefined,
        layer_name: shape.layer,
        type: shape.type,
        color: shape.color,
        coordinates: shape.points,
        value: shape.value,
        unit: shape.unit,
        page_number: currentPage,
        discipline_id: shape.disciplineId,
        scale_info: {
          pixelsPerFoot,
          metersPerPixel,
          usingMetric
        }
      }));

      const response = await axios.post(
        `${API_URL}/plans/${plan.id}/measurements`,
        { measurements },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setHudText('Measurements saved successfully!');
        setTimeout(() => setHudText(''), 3000);
      }
    } catch (err) {
      console.error('Error saving measurements:', err);
      setHudText('Failed to save measurements');
    } finally {
      setSaving(false);
    }
  };

  // Create new discipline
  const createDiscipline = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/plans/${plan.id}/disciplines`,
        disciplineForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        await loadDisciplines();
        setShowDisciplineModal(false);
        setDisciplineForm({ name: '', icon: '📁', color: '#82eaff' });
        setHudText('Discipline created');
      }
    } catch (err) {
      console.error('Error creating discipline:', err);
      alert('Failed to create discipline');
    }
  };

  // Delete discipline
  const deleteDiscipline = async (disciplineId) => {
    if (!window.confirm('Delete this discipline and all its measurements?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/plans/${plan.id}/disciplines/${disciplineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadDisciplines();
      // Remove shapes belonging to this discipline
      setShapes(shapes.filter(s => s.disciplineId !== disciplineId));
      setHudText('Discipline deleted');
    } catch (err) {
      console.error('Error deleting discipline:', err);
      alert('Failed to delete discipline');
    }
  };

  // Toggle discipline expansion
  const toggleDiscipline = (disciplineId) => {
    const newExpanded = new Set(expandedDisciplines);
    if (newExpanded.has(disciplineId)) {
      newExpanded.delete(disciplineId);
    } else {
      newExpanded.add(disciplineId);
    }
    setExpandedDisciplines(newExpanded);
  };

  // Toggle layer expansion
  const toggleLayer = (layerId) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  // Create new layer
  const createLayer = () => {
    if (!layerForm.name.trim()) {
      alert('Please enter a layer name');
      return;
    }

    const newLayer = {
      id: `layer-${nextLayerId}`,
      name: layerForm.name,
      color: layerForm.color,
      type: pendingTool,
      disciplineId: layerForm.disciplineId,
      visible: true
    };

    setLayers([...layers, newLayer]);
    setLastLayerIds({ ...lastLayerIds, [pendingTool]: newLayer.id });
    setSelectedLayer(newLayer.id);
    setTool(pendingTool);
    setShowLayerModal(false);
    setLayerForm({ name: '', color: '#ffd166', disciplineId: null });
    setNextLayerId(nextLayerId + 1);

    const instructions = {
      line: 'Click two points to measure a line',
      poly: 'Click multiple points. Press Enter to finish.',
      area: 'Click points to define area. Press Enter to finish.',
      count: 'Click to place counting markers'
    };
    setHudText(instructions[pendingTool] || 'Start measuring');
  };

  // Handle preset scale selection
  const handlePresetScale = (presetValue) => {
    if (!presetValue) {
      setSelectedPreset('');
      return;
    }

    setSelectedPreset(presetValue);
    
    const [category, index] = presetValue.split('-');
    const preset = SCALE_PRESETS[category][parseInt(index)];
    
    if (!preset) return;

    const pixelsPerInch = 96;
    
    if (category === 'metric') {
      const mmPerPixel = preset.ratio / pixelsPerInch * 25.4;
      setMetersPerPixel(mmPerPixel / 1000);
      setUsingMetric(true);
      setHudText(`Scale set to ${preset.label}. Start measuring!`);
    } else {
      const ppf = pixelsPerInch / preset.ratio;
      setPixelsPerFoot(ppf);
      setUsingMetric(false);
      setHudText(`Scale set to ${preset.label}. Start measuring!`);
    }
    setActiveMenu(null);
  };

  // Handle tool selection
  const handleToolSelect = (toolType) => {
    if (toolType === 'calibrate') {
      setTool('scale');
      setHudText('Click two points on a known distance, then enter the measurement.');
      setActiveMenu(null);
      return;
    }

    if (toolType === 'auto-scale') {
      // Try to auto-detect scale from plan annotations
      setHudText('Auto-scale not yet implemented');
      setActiveMenu(null);
      return;
    }

    // Check if there's a layer for this tool
    const existingLayer = layers.find(l => l.type === toolType);
    
    if (existingLayer) {
      setLastLayerIds({ ...lastLayerIds, [toolType]: existingLayer.id });
      setSelectedLayer(existingLayer.id);
      setTool(toolType);
      
      const instructions = {
        line: 'Click two points to measure a line',
        poly: 'Click multiple points. Press Enter to finish.',
        area: 'Click points to define area. Press Enter to finish.',
        count: 'Click to place counting markers'
      };
      setHudText(instructions[toolType] || 'Start measuring');
    } else {
      // Auto-create a default layer if discipline is selected
      if (selectedDiscipline) {
        const toolLabel = toolType.charAt(0).toUpperCase() + toolType.slice(1);
        const newLayer = {
          id: `layer-${nextLayerId}`,
          name: `${toolLabel} 1`,
          color: '#ffd166',
          type: toolType,
          disciplineId: selectedDiscipline,
          visible: true
        };
        
        setLayers([...layers, newLayer]);
        setLastLayerIds({ ...lastLayerIds, [toolType]: newLayer.id });
        setSelectedLayer(newLayer.id);
        setNextLayerId(nextLayerId + 1);
        setTool(toolType);
        
        // Auto-expand the discipline to show the new layer
        setExpandedDisciplines(prev => new Set([...prev, selectedDiscipline]));
        setExpandedLayers(prev => new Set([...prev, newLayer.id]));
        
        const instructions = {
          line: 'Click two points to measure a line',
          poly: 'Click multiple points. Press Enter to finish.',
          area: 'Click points to define area. Press Enter to finish.',
          count: 'Click to place counting markers'
        };
        setHudText(instructions[toolType] || 'Start measuring');
      } else {
        // No discipline selected, show modal to create layer
      setPendingTool(toolType);
      setLayerForm({ 
        name: `${toolType.charAt(0).toUpperCase() + toolType.slice(1)} 1`, 
        color: '#ffd166',
          disciplineId: null
      });
      setShowLayerModal(true);
      }
    }
    setActiveMenu(null);
  };

  // Drawing and canvas functions
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    ctx.save();
    ctx.fillStyle = '#1a1d2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(view.x, view.y);
    ctx.scale(view.z, view.z);

    if (invert) {
      ctx.filter = 'invert(1)';
    }

    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';

    // Draw all shapes
    shapes.forEach(shape => {
      if (shape.page !== currentPage) return;
      
      const layer = layers.find(l => l.id === shape.layer);
      if (layer && !layer.visible) return;

      drawShape(ctx, shape, shape === selectedShape);
    });

    // Draw working shape
    if (working && working.points.length > 0) {
      drawShape(ctx, working, true);
    }

    // Draw calibration points
    if (tool === 'scale' && calPts.length > 0) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2 / view.z;
      ctx.beginPath();
      calPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      calPts.forEach(pt => {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4 / view.z, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();
  };

  const drawShape = (ctx, shape, highlight) => {
    if (shape.points.length === 0) return;

    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = (highlight ? 3 : 2) / view.z;
    ctx.globalAlpha = 0.8;

    if (shape.type === 'line' || shape.type === 'poly') {
      ctx.beginPath();
      shape.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      
      // Draw points
      shape.points.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3 / view.z, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Show measurement
      if (shape.value && typeof shape.value === 'number' && shape.points.length > 0) {
        const mid = shape.points[Math.floor(shape.points.length / 2)];
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = `${12 / view.z}px Arial`;
        ctx.fillText(`${shape.value.toFixed(2)} ${shape.unit || ''}`, mid.x, mid.y - 10 / view.z);
        ctx.restore();
      }
    } else if (shape.type === 'area') {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      shape.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();
      
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      
      // Show measurement at centroid
      if (shape.value && typeof shape.value === 'number' && shape.points.length > 2) {
        const centroid = getPolygonCentroid(shape.points);
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = `${14 / view.z}px Arial`;
        ctx.fillText(`${shape.value.toFixed(2)} ${shape.unit || ''}`, centroid.x, centroid.y);
        ctx.restore();
      }
    } else if (shape.type === 'count') {
      // Draw markers
      shape.points.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8 / view.z, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw number
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.font = `bold ${10 / view.z}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, pt.x, pt.y);
        ctx.restore();
      });
    }

    ctx.globalAlpha = 1;
  };

  // Canvas mouse handlers
  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.x) / view.z;
    const y = (e.clientY - rect.top - view.y) / view.z;
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && panKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
      e.preventDefault();
      return;
    }

    if (!tool || e.button !== 0) return;

    const pt = getCanvasPoint(e);

    if (tool === 'scale') {
      const newCalPts = [...calPts, pt];
      setCalPts(newCalPts);
      if (newCalPts.length === 2) {
        const dist = Math.hypot(newCalPts[1].x - newCalPts[0].x, newCalPts[1].y - newCalPts[0].y);
        const realDist = prompt('Enter the real-world distance (e.g., 10 for 10 feet):');
        if (realDist && parseFloat(realDist) > 0) {
          const ppf = dist / parseFloat(realDist);
          setPixelsPerFoot(ppf);
          setUsingMetric(false);
          setHudText(`Scale calibrated: ${ppf.toFixed(2)} pixels per foot. Start measuring!`);
        }
        setCalPts([]);
        setTool('');
      }
      return;
    }

    // Start new measurement
    if (!selectedLayer) {
      setHudText('Please create a layer first');
      return;
    }

    const layer = layers.find(l => l.id === selectedLayer);
    if (!layer) return;

    if (tool === 'line') {
      if (!working) {
        setWorking({
          type: 'line',
          color: layer.color,
          layer: layer.id,
          disciplineId: layer.disciplineId,
          points: [pt],
          page: currentPage
        });
      } else {
        const newPts = [...working.points, pt];
        if (newPts.length === 2) {
          const dist = Math.hypot(newPts[1].x - newPts[0].x, newPts[1].y - newPts[0].y);
          const value = pixelsPerFoot ? Number(dist / pixelsPerFoot) : 0;
          const unit = usingMetric ? 'm' : 'FT';
          const newShape = { ...working, points: newPts, value: Number(value) || 0, unit, id: Date.now() };
          setShapes([...shapes, newShape]);
          setWorking(null);
          setHudText('Line measured. Click Save to save.');
        } else {
          setWorking({ ...working, points: newPts });
        }
      }
    } else if (tool === 'poly' || tool === 'area') {
      if (!working) {
        setWorking({
          type: tool,
          color: layer.color,
          layer: layer.id,
          disciplineId: layer.disciplineId,
          points: [pt],
          page: currentPage
        });
      } else {
        setWorking({ ...working, points: [...working.points, pt] });
      }
    } else if (tool === 'count') {
      if (!working) {
        setWorking({
          type: 'count',
          color: layer.color,
          layer: layer.id,
          disciplineId: layer.disciplineId,
          points: [pt],
          value: 1,
          unit: 'EA',
          page: currentPage
        });
      } else {
        const newPts = [...working.points, pt];
        setWorking({ ...working, points: newPts, value: newPts.length });
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setMouseScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (isPanning) {
      setView({
        ...view,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - view.x) / view.z;
    const worldY = (mouseY - view.y) / view.z;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZ = Math.max(0.1, Math.min(10, view.z * delta));
    
    const newX = mouseX - worldX * newZ;
    const newY = mouseY - worldY * newZ;
    
    setView({ x: newX, y: newY, z: newZ });
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      setPanKey(true);
      e.preventDefault();
    } else if (e.key === 'Enter' && working && (tool === 'poly' || tool === 'area')) {
      // Finish polyline or area
      if (working.points.length >= 2) {
        let value = 0;
        let unit = '';
        
        if (tool === 'poly') {
          // Calculate total length
          let totalDist = 0;
          for (let i = 1; i < working.points.length; i++) {
            const dx = working.points[i].x - working.points[i-1].x;
            const dy = working.points[i].y - working.points[i-1].y;
            totalDist += Math.hypot(dx, dy);
          }
          value = pixelsPerFoot ? Number(totalDist / pixelsPerFoot) : 0;
          unit = usingMetric ? 'm' : 'FT';
        } else {
          // Calculate area
          const area = getPolygonArea(working.points);
          value = pixelsPerFoot ? Number(area / (pixelsPerFoot * pixelsPerFoot)) : 0;
          unit = usingMetric ? 'm²' : 'SF';
        }
        
        const newShape = { ...working, value: Number(value) || 0, unit, id: Date.now() };
        setShapes([...shapes, newShape]);
        setWorking(null);
        setHudText('Measurement complete. Click Save to save.');
      }
    } else if (e.key === 'Escape') {
      setWorking(null);
      setTool('');
      setHudText('Cancelled');
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === ' ') {
      setPanKey(false);
    }
  };

  // Utility functions
  const getPolygonArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const getPolygonCentroid = (points) => {
    let cx = 0, cy = 0;
    points.forEach(pt => {
      cx += pt.x;
      cy += pt.y;
    });
    return { x: cx / points.length, y: cy / points.length };
  };

  const fitView = () => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    
    setView({ x, y, z: scale });
  };

  const handleUndo = () => {
    if (working) {
      if (working.points.length > 1) {
        setWorking({ ...working, points: working.points.slice(0, -1) });
      } else {
        setWorking(null);
      }
    } else if (shapes.length > 0) {
      setShapes(shapes.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all measurements on this page?')) {
      setShapes(shapes.filter(s => s.page !== currentPage));
      setWorking(null);
      setHudText('Page cleared');
    }
  };

  // Calculate totals for sidebar
  const calculateTotals = () => {
    const totals = {};
    
    disciplines.forEach(discipline => {
      const disciplineLayers = layers.filter(l => l.disciplineId === discipline.id);
      
      disciplineLayers.forEach(layer => {
        const layerShapes = shapes.filter(s => s.layer === layer.id);
        
        const layerTotals = {
          length: 0,
          area: 0,
          count: 0
        };
        
        layerShapes.forEach(shape => {
          if (shape.type === 'line' || shape.type === 'poly') {
            layerTotals.length += shape.value || 0;
          } else if (shape.type === 'area') {
            layerTotals.area += shape.value || 0;
          } else if (shape.type === 'count') {
            layerTotals.count += shape.points.length;
          }
        });
        
        totals[layer.id] = layerTotals;
      });
    });
    
    return totals;
  };

  const totals = calculateTotals();

  // Toggle menu
  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  // Floating toolbar drag handlers
  const handleToolbarMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = toolbarRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && toolbarRef.current) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Constrain within window bounds
        const maxX = window.innerWidth - toolbarRef.current.offsetWidth;
        const maxY = window.innerHeight - toolbarRef.current.offsetHeight;
        
        setToolbarPos({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(32, Math.min(newY, maxY)) // 32px for top header
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Center toolbar on mount
  useEffect(() => {
    if (toolbarRef.current) {
      const toolbarWidth = 464; // From Figma design
      setToolbarPos({
        x: (window.innerWidth - toolbarWidth) / 2,
        y: window.innerHeight - 76 // 26px from bottom + 50px height
      });
    }
  }, []);

  // Render sidebar
  const renderSidebar = () => {
    // Calculate totals for the first layer/discipline if available
    const firstLayerTotals = layers.length > 0 ? (totals[layers[0].id] || { length: 0, area: 0, count: 0 }) : { length: 0, area: 0, count: 0 };
    
    return (
      <div className="measurement-sidebar-figma">
        {/* Sidebar Header */}
        <div className="figma-sidebar-header">
          <div className="header-top">
            <button className="logo-btn">
              <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M3 3h14v2.7H3V3z" fill="#f97316"/>
                <path d="M3 9.5h14v2.73H3V9.5z" fill="#22c55e"/>
                <path d="M0 6.35h8v2.74H0V6.35z" fill="#fb923c"/>
                <path d="M5.59 0h8v2.73h-8V0z" fill="#ef4444"/>
                <path d="M5.60 12.73h8v2.73h-8v-2.73z" fill="rgba(0,0,0,0.2)"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <button className="settings-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
          </button>
        </div>

          <div className="project-name-row">
            <h3 className="project-name">{plan.file_name || plan.project_name || 'Matheson Residence'}</h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="figma-tabs-section">
          <div className="figma-tabs">
            <button className="figma-tab active">File</button>
            <button className="figma-tab">Assembly</button>
            </div>
          <button className="search-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>

        {/* File Tree */}
        <div className="figma-file-tree">
          {/* Electrical - SD Section */}
          <div className="file-tree-item discipline-level">
                    <button 
              className="tree-item-header"
              onClick={() => toggleDiscipline('electrical-sd')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={expandedDisciplines.has('electrical-sd') ? 'expanded' : ''}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span className="discipline-icon">⚡</span>
              <span className="item-name">Electrical - SD</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
                    </button>
                  </div>
                  
          {/* EL-01 Section (Expanded) */}
          {expandedDisciplines.has('electrical-sd') && (
            <>
              <div className="file-tree-item layer-level">
                <button 
                  className="tree-item-header"
                  onClick={() => toggleLayer('el-01')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={expandedLayers.has('el-01') ? 'expanded' : ''}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span className="item-name">EL-01</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="more-icon">
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>

                {/* Measurements for EL-01 */}
                {expandedLayers.has('el-01') && (
                  <div className="measurements-list-figma">
                    {/* Length Measurement */}
                    <div className="measurement-row">
                      <div className="measurement-icon-group">
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 9V1h10" stroke="white" strokeWidth="0.5"/>
                          <circle cx="3" cy="1.5" r="1.3" fill="white"/>
                          <circle cx="5" cy="1.5" r="1.3" fill="white"/>
                          <circle cx="7" cy="1.5" r="1.3" fill="white"/>
                          <circle cx="9" cy="1.5" r="1.3" fill="white"/>
                        </svg>
                              </div>
                      <div className="measurement-content">
                                      <span className="measurement-label">Length</span>
                        <div className="measurement-value-row">
                          <div className="color-indicator purple"></div>
                          <span className="measurement-value">{firstLayerTotals.length > 0 ? `${firstLayerTotals.length.toFixed(1)} FT` : '264.8 FT'}</span>
                                    </div>
                      </div>
                    </div>

                    {/* Area Measurement */}
                    <div className="measurement-row">
                      <div className="measurement-icon-group">
                        <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                          <rect x="1.64" y="0.82" width="8" height="8" fill="white"/>
                          <circle cx="1" cy="2.93" r="0.5" fill="white"/>
                          <circle cx="1" cy="2.93" r="0.5" fill="white"/>
                          <circle cx="3.56" cy="0" r="0.5" fill="white"/>
                          <circle cx="3.56" cy="0" r="0.5" fill="white"/>
                          <circle cx="7.95" cy="0" r="0.5" fill="white"/>
                          <circle cx="7.95" cy="0" r="0.5" fill="white"/>
                          <circle cx="7.95" cy="4.39" r="0.5" fill="white"/>
                          <circle cx="7.95" cy="4.39" r="0.5" fill="white"/>
                          <circle cx="5.39" cy="6.95" r="0.5" fill="white"/>
                          <circle cx="5.39" cy="6.95" r="0.5" fill="white"/>
                          <circle cx="1" cy="6.95" r="0.5" fill="white"/>
                          <circle cx="1" cy="6.95" r="0.5" fill="white"/>
                        </svg>
                      </div>
                      <div className="measurement-content">
                                      <span className="measurement-label">Area</span>
                        <div className="measurement-value-row">
                          <div className="color-indicator green"></div>
                          <span className="measurement-value">{firstLayerTotals.area > 0 ? `${firstLayerTotals.area.toFixed(1)} SF` : '540.5 SF'}</span>
                                    </div>
                      </div>
                    </div>

                    {/* New Count 1 */}
                    <div className="measurement-row">
                      <div className="measurement-icon-group count-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                      <div className="measurement-content">
                        <span className="measurement-label">New Count</span>
                        <div className="measurement-value-row">
                          <div className="color-indicator blue"></div>
                          <span className="measurement-value">{firstLayerTotals.count > 0 ? `${firstLayerTotals.count} EA` : '24.0 EA'}</span>
                          <span className="red-dot"></span>
                        </div>
                      </div>
                    </div>

                    {/* New Count 2 */}
                    <div className="measurement-row">
                      <div className="measurement-icon-group count-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                      <div className="measurement-content">
                        <span className="measurement-label">New Count</span>
                        <div className="measurement-value-row">
                          <div className="color-indicator orange"></div>
                          <span className="measurement-value">240 EA</span>
                          <span className="expand-arrow">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 1h8L5 7 1 1z" fill="white"/>
                            </svg>
                                      </span>
                                    </div>
                                </div>
                            </div>
                    </div>
                  )}
                </div>

              {/* EL-02 through EL-10 (Collapsed) */}
              {['EL-02', 'EL-03', 'EL-04', 'EL-05', 'EL-06', 'EL-07', 'EL-08', 'EL-09', 'EL-10'].map((layerName, index) => (
                <div key={layerName} className="file-tree-item layer-level">
                  <button className="tree-item-header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="collapsed">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className="item-name">{layerName}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="more-icon">
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  // Load user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const updateCanvasSize = () => {
        const sidebarWidth = sidebarCollapsed ? 50 : 320; // 50px when collapsed, 320px when expanded
        canvas.width = window.innerWidth - sidebarWidth;
        canvas.height = window.innerHeight - 92; // Subtract top (32px macos header + 60px bottom toolbar)
      };
      
      updateCanvasSize();
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('resize', updateCanvasSize);
      
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', updateCanvasSize);
      };
    }
  }, [sidebarCollapsed]); // Re-run when sidebar is collapsed/expanded

  return (
    <div className={`measurement-tool ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* macOS Window Header */}
      <div className="macos-window-header">
        <div className="window-controls">
          <div className="window-dot red" onClick={onClose}></div>
          <div className="window-dot orange"></div>
          <div className="window-dot green"></div>
        </div>
        
        {/* Tab Bar */}
        <div className="window-tabs">
          <button className="window-tab" onClick={() => setTool('')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
          
          <div className="tab-item active">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            <span>Takeoff</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
        </div>
        
          <div className="tab-item">
            <span>Pricing Sheet</span>
          </div>

          <div className="tab-item">
            <span>Proposal</span>
          </div>

          <div className="tab-item">
            <span>Presentation</span>
          </div>

          <button className="tab-add">+</button>
        </div>

        {/* Window Controls Right */}
        <div className="window-controls-right">
          <button className="window-control-btn" title="Minimize">−</button>
          <button className="window-control-btn" title="Maximize">□</button>
          <button className="window-control-btn" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Collaboration Toolbar (Top Right) */}
      <div className="collaboration-toolbar">
        <div className="collab-avatars">
          <div className="collab-avatar">{user && user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}</div>
          <div className="collab-avatar secondary">A</div>
          <button className="btn-add-collaborator">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <button className="btn-zoom-control">
          <span>{zoomLevel}%</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <button className="btn-comments">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="14" rx="2"/>
          </svg>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <button className="btn-share">Share</button>
      </div>

      {/* Main Content */}
      <div className="measurement-content">
        {/* Left Sidebar */}
        {renderSidebar()}

        {/* Canvas Area */}
        <div className={`canvas-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning || panKey ? 'grab' : 'crosshair' }}
          />
          
          {/* HUD */}
          <div className="hud">{hudText}</div>
          
          {loading && <div className="loading-overlay">Loading plan...</div>}
        </div>
      </div>

      {/* Floating Toolbar - Figma Design */}
      <div 
        ref={toolbarRef}
        className={`floating-toolbar-figma ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`,
        }}
        onMouseDown={handleToolbarMouseDown}
      >
        {/* Drag Handle with Orange Icon */}
        <div className="toolbar-section left-section drag-handle">
          <button className="tool-drag-btn" title="Drag to move toolbar">
            <div className="drag-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <polyline points="19 12 12 5 5 12"/>
            </svg>
            </div>
          </button>
          <button className="tool-dropdown-arrow">
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
              <path d="M0 0 L9 0 L4.5 10 Z"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider-figma"></div>

        {/* Center Tools */}
        <div className="toolbar-section center-section">
          {/* Scale Tool */}
          <button 
            className={`tool-icon-btn-figma ${tool === 'scale' ? 'active' : ''}`}
            onClick={() => handleToolSelect('calibrate')}
            title="Calibrate Scale"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="8" x2="4" y2="16"/>
              <line x1="20" y1="8" x2="20" y2="16"/>
            </svg>
          </button>

          {/* Line Measurement */}
          <button 
            className={`tool-icon-btn-figma ${tool === 'line' ? 'active' : ''}`}
            onClick={() => handleToolSelect('line')}
            title="Measure Line / Length"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="19" x2="19" y2="5"/>
              <circle cx="5" cy="19" r="2" fill="currentColor"/>
              <circle cx="19" cy="5" r="2" fill="currentColor"/>
            </svg>
          </button>

          {/* Area Measurement */}
          <button 
            className={`tool-icon-btn-figma ${tool === 'area' ? 'active' : ''}`}
            onClick={() => handleToolSelect('area')}
            title="Measure Area"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2,2"/>
              <line x1="12" y1="4" x2="12" y2="20" strokeDasharray="2,2"/>
            </svg>
          </button>

          {/* Count Tool */}
          <button 
            className={`tool-icon-btn-figma ${tool === 'count' ? 'active' : ''}`}
            onClick={() => handleToolSelect('count')}
            title="Count Objects"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <text x="12" y="17" fontSize="14" fontWeight="bold" textAnchor="middle" fill="currentColor">123</text>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-divider-figma"></div>

        {/* Right Tools */}
        <div className="toolbar-section right-section">
          {/* Shapes Dropdown */}
          <button className="tool-icon-btn-figma" title="Shapes">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <circle cx="17" cy="7" r="4"/>
              <polygon points="12,14 8,22 16,22"/>
            </svg>
            </button>
          <button className="tool-dropdown-arrow">
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
              <path d="M0 0 L9 0 L4.5 10 Z"/>
            </svg>
          </button>

          {/* Pen/Draw Tool */}
          <button 
            className={`tool-icon-btn-figma ${tool === 'poly' ? 'active' : ''}`}
            onClick={() => handleToolSelect('poly')}
            title="Pen Tool"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </button>
          <button className="tool-dropdown-arrow">
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
              <path d="M0 0 L9 0 L4.5 10 Z"/>
            </svg>
          </button>

          {/* Text Tool */}
          <button className="tool-icon-btn-figma" title="Text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
          </button>

          {/* Comment/Note Tool */}
          <button className="tool-icon-btn-figma" title="Comment">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* More Tools */}
          <button className="tool-icon-btn-figma" title="More Tools">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>

          {/* Layers Panel Toggle */}
          <button className="tool-icon-btn-figma" title="Toggle Layers">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>

          {/* Dark/Light Mode Toggle */}
          <button 
            className={`tool-icon-btn-figma ${!darkMode ? 'active' : ''}`}
            onClick={() => setDarkMode(!darkMode)} 
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Discipline Modal */}
      {showDisciplineModal && (
        <div className="modal-overlay" onClick={() => setShowDisciplineModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Discipline</h3>
            <input
              type="text"
              placeholder="Discipline Name (e.g., Electrical - SD)"
              value={disciplineForm.name}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={disciplineForm.icon}
              maxLength={2}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, icon: e.target.value })}
            />
            <input
              type="color"
              value={disciplineForm.color}
              onChange={(e) => setDisciplineForm({ ...disciplineForm, color: e.target.value })}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDisciplineModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={createDiscipline}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer Modal */}
      {showLayerModal && (
        <div className="modal-overlay" onClick={() => setShowLayerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Layer</h3>
            <input
              type="text"
              placeholder="Layer Name"
              value={layerForm.name}
              onChange={(e) => setLayerForm({ ...layerForm, name: e.target.value })}
            />
            <select
              value={layerForm.disciplineId || ''}
              onChange={(e) => setLayerForm({ ...layerForm, disciplineId: parseInt(e.target.value) || null })}
            >
              <option value="">No Discipline</option>
              {disciplines.map(d => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={layerForm.color}
              onChange={(e) => setLayerForm({ ...layerForm, color: e.target.value })}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLayerModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={createLayer}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeasurementTool;
