document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate selected tab
      button.classList.add('active');
      const tabId = `${button.dataset.tab}-tab`;
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Analysis form submission
  const analysisForm = document.getElementById('analysis-form');
  analysisForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const audioFile = document.getElementById('audio-file').files[0];
    const analysisType = document.getElementById('analysis-type').value;
    
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }
    
    // Show loading state
    const resultContent = document.querySelector('#analysis-results .result-content');
    resultContent.innerHTML = '<div class="loading">Processing...</div>';
    
    // Reset metrics
    updateMetrics('-', '-', '-');
    
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('type', analysisType);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.status === 'error') {
        resultContent.innerHTML = `<div class="error">${result.error}</div>`;
        return;
      }
      
      // Display results
      let resultHtml = '';
      
      if (analysisType === 'transcription') {
        resultHtml = `<p class="transcription">${result.data?.transcription || 'No transcription available'}</p>`;
      } else if (analysisType === 'features') {
        resultHtml = '<div class="features">';
        resultHtml += '<h4>Audio Features</h4>';
        if (result.data?.features) {
          resultHtml += '<p>Feature extraction successful. Features available for processing.</p>';
          resultHtml += `<p>Feature count: ${result.data.featureCount || 'Unknown'}</p>`;
          resultHtml += `<p>Feature type: ${result.data.metadata?.type || 'Unknown'}</p>`;
        } else {
          resultHtml += '<p>No features available</p>';
        }
        resultHtml += '</div>';
      } else if (analysisType === 'patterns') {
        resultHtml = '<div class="patterns">';
        resultHtml += '<h4>Audio Patterns</h4>';
        if (result.data?.segments) {
          resultHtml += '<ul>';
          result.data.segments.forEach((segment, index) => {
            resultHtml += `<li>Segment ${index + 1}: ${segment.text} (${segment.start}s - ${segment.end}s, confidence: ${segment.confidence.toFixed(2)})</li>`;
          });
          resultHtml += '</ul>';
        } else {
          resultHtml += '<p>No patterns detected</p>';
        }
        resultHtml += '</div>';
      }
      
      resultContent.innerHTML = resultHtml;
      
      // Set up audio player
      const audioPlayer = document.querySelector('#analysis-results audio');
      audioPlayer.src = URL.createObjectURL(audioFile);
      
      // Update metrics
      updateMetrics(
        result.metrics?.processingTime ? `${result.metrics.processingTime}ms` : '-',
        result.metrics?.memoryUsage ? formatBytes(result.metrics.memoryUsage) : '-',
        'wav2vec2'
      );
      
    } catch (error) {
      resultContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  });
  
  // Generation form submission
  const generationForm = document.getElementById('generation-form');
  generationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const prompt = document.getElementById('prompt').value;
    const duration = document.getElementById('duration').value;
    const quality = document.getElementById('quality').value;
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    // Show loading state
    const resultContent = document.querySelector('#generation-results .result-content');
    resultContent.innerHTML = '<div class="loading">Generating audio...</div>';
    
    // Reset metrics
    updateMetrics('-', '-', '-');
    
    // Prepare request
    const steps = quality === 'fast' ? 15 : quality === 'quality' ? 35 : 25;
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          params: {
            duration: parseFloat(duration),
            diffusionSteps: steps
          }
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'error') {
        resultContent.innerHTML = `<div class="error">${result.error}</div>`;
        return;
      }
      
      // Display prompt used
      resultContent.innerHTML = `
        <p class="prompt"><strong>Prompt:</strong> ${prompt}</p>
        <p><strong>Parameters:</strong> Duration: ${duration}s, Quality: ${quality} (${steps} steps)</p>
      `;
      
      // Set up audio player
      const audioPlayer = document.querySelector('#generation-results audio');
      if (result.data?.outputPath) {
        audioPlayer.src = result.data.outputPath;
        audioPlayer.style.display = 'block';
      } else {
        audioPlayer.style.display = 'none';
        resultContent.innerHTML += '<div class="error">No audio output available</div>';
      }
      
      // Update metrics
      updateMetrics(
        result.metrics?.processingTime ? `${result.metrics.processingTime}ms` : '-',
        result.metrics?.memoryUsage ? formatBytes(result.metrics.memoryUsage) : '-',
        'audioldm'
      );
      
    } catch (error) {
      resultContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  });
  
  // Helper to update metrics
  function updateMetrics(time, memory, model) {
    document.getElementById('metric-time').textContent = time;
    document.getElementById('metric-memory').textContent = memory;
    document.getElementById('metric-model').textContent = model;
  }
  
  // Helper to format bytes
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // Check system status on load
  async function checkSystemStatus() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      
      console.log('System status:', status);
      
      // Could display system status in the UI if needed
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }
  
  // Initialize
  checkSystemStatus();
});