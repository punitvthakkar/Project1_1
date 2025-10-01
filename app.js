// CloseTheLoop App.js - Vanilla JS for SPA behavior

document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');

  // Role buttons
  document.getElementById('role-professor').addEventListener('click', () => showView('professor'));
  document.getElementById('role-student').addEventListener('click', () => showView('student'));

  function showView(role) {
    const sections = content.querySelectorAll('section');
    sections.forEach(s => s.classList.remove('visible'));

    let section = document.getElementById(`${role}-view`);
    if (!section) {
      section = createView(role);
      content.appendChild(section);
    }
    section.classList.add('visible');
  }

  function createView(role) {
    const section = document.createElement('section');
    section.id = `${role}-view`;
    section.innerHTML = role === 'professor' ? createProfessorView() : createStudentView();
    return section;
  }

  function createProfessorView() {
    return `
      <h2>Professor Dashboard</h2>
      <div id="professor-menu">
        <button class="btn" onclick="showSubView('create-session')">Create Session</button>
        <button class="btn" onclick="showSubView('view-dashboard')">View Dashboard</button>
      </div>
      <div id="sub-content"></div>
    `;
  }

  function createStudentView() {
    return `
      <h2>Student Submission</h2>
      <form id="submit-form">
        <label for="session-id">Session ID:</label>
        <input type="text" id="session-id" required>

        <label for="student-name">Student Name (Optional):</label>
        <input type="text" id="student-name">

        <label for="file-input">Upload Assignment (PDF/DOCX/PPTX):</label>
        <input type="file" id="file-input" accept=".pdf,.docx,.pptx" required>

        <button type="submit">Submit and Get Feedback</button>
        <div id="feedback-container" style="display:none;"></div>
      </form>
    `;

    // Attach submit handler
    setTimeout(() => {
      document.getElementById('submit-form').addEventListener('submit', handleStudentSubmit);
    });
  }

  window.showSubView = function(subView) {
    const subContent = document.getElementById('sub-content');
    if (subView === 'create-session') {
      subContent.innerHTML = `
        <form id="session-form">
          <h3>Create Session</h3>
          <p class="error" id="session-form-error"></p>
          <label for="session-id">Session ID (Unique):</label>
          <input type="text" id="session-id" required aria-describedby="session-id-desc">
          <small id="session-id-desc">Enter a unique identifier for your session, e.g., CHEM101-2025.</small>

          <label for="session-title">Title:</label>
          <input type="text" id="session-title" required>

          <label for="document-file">Upload Lecture Document:</label>
          <input type="file" id="document-file" accept=".pdf,.docx,.pptx" required aria-describedby="file-desc">
          <small id="file-desc">Accepted formats: PDF, DOCX, PPTX (max 10MB).</small>

          <label for="is-professor">
            <input type="checkbox" id="is-professor" required>
            I confirm I am a professor/instructor.
          </label>

          <button type="submit">Create Session</button>
          <div id="kau-container" style="display:none;"></div>
        </form>
      `;
      document.getElementById('session-form').addEventListener('submit', handleSessionCreate);
    } else if (subView === 'view-dashboard') {
      subContent.innerHTML = `
        <form id="dashboard-form">
          <label for="dashboard-session-id">Session ID:</label>
          <input type="text" id="dashboard-session-id" required>
          <button type="submit">Fetch Dashboard</button>
        </form>
        <div id="dashboard-container"></div>
      `;
      document.getElementById('dashboard-form').addEventListener('submit', handleDashboardFetch);
    }
  };

  async function handleSessionCreate(e) {
    e.preventDefault();
    const sessionId = document.getElementById('session-id').value.trim();
    const title = document.getElementById('session-title').value.trim();
    const file = document.getElementById('document-file').files[0];
    const isProfessor = document.getElementById('is-professor').checked;

    if (!file) return showError('Please select a file.');
    if (!isProfessor) return showError('You must confirm you are a professor.');

    showLoading(true);
    document.querySelector('button[type="submit"]').disabled = true;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileBase64 = btoa(reader.result);
      const fileType = file.type;

      try {
        const res = await axios.post('/api/sessions', { sessionId, title, fileBase64, fileType, isProfessor });
        alert('Session created!');

        // Show KAUs for finalization
        const kauContainer = document.getElementById('kau-container');
        kauContainer.innerHTML = `<h4>Suggested KAUs:</h4>` + res.data.suggestedKaus.map((kau, i) =>
          `<p><input type="checkbox" id="kau-${i}" checked> ${kau.category}: ${kau.description}</p>`
        ).join('') + `<button id="finalize-kaus" aria-label="Finalize selected KAUs">Finalize Selected KAUs</button>`;
        kauContainer.style.display = 'block';

        document.getElementById('finalize-kaus').addEventListener('click', () => finalizeKAUs(sessionId, res.data.suggestedKaus));
      } catch (err) {
        showError('Error creating session: ' + (err.response?.data?.error || 'Unknown error'));
      } finally {
        showLoading(false);
        document.querySelector('button[type="submit"]').disabled = false;
      }
    };
    reader.readAsBinaryString(file);
  }

  async function finalizeKAUs(sessionId, kaus) {
    const selected = [];
    kaus.forEach((kau, i) => {
      const checkbox = document.getElementById(`kau-${i}`);
      if (checkbox.checked) selected.push(kau.category);
    });

    try {
      await axios.put(`/api/kaus/${sessionId}/finalize`, { kauCategories: selected });
      alert('KAUs finalized!');
    } catch (err) {
      alert('Error finalizing KAUs');
    }
  }

  async function handleDashboardFetch(e) {
    e.preventDefault();
    const sessionId = document.getElementById('dashboard-session-id').value.trim();

    try {
      const res = await axios.get(`/api/sessions/${sessionId}`);
      const { session, submissionsCount, topGaps, suggestions } = res.data;

      const container = document.getElementById('dashboard-container');
      container.innerHTML = `
        <h3>Session: ${session.title}</h3>
        <p>Submissions: ${submissionsCount}</p>
        <canvas id="gaps-chart" width="400" height="200"></canvas>
        <h4>Top Missing Gaps:</h4>
        <ul>${topGaps.map(([gap, count]) => `<li>${gap} (${count} times)</li>`).join('')}</ul>
        <h4>AI Suggestions for Teaching:</h4>
        <ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
      `;

      // Simple chart
      const ctx = document.getElementById('gaps-chart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topGaps.map(([gap]) => gap),
          datasets: [{
            label: 'Frequency',
            data: topGaps.map(([, count]) => count),
            backgroundColor: 'rgba(0,123,255,0.5)'
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (err) {
      alert('Error: ' + err.response?.data?.error || 'Failed to fetch dashboard');
    }
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    const sessionId = document.getElementById('session-id').value.trim();
    const studentPlaceholder = document.getElementById('student-name').value.trim();
    const file = document.getElementById('file-input').files[0];

    if (!file) return alert('Please select a file.');

    const reader = new FileReader();
    reader.onload = async () => {
      const fileBase64 = btoa(reader.result);
      const filename = file.name;

      try {
        const res = await axios.post('/api/submissions', { sessionId, studentPlaceholder, filename, fileBase64 });

        // Display feedback
        const { feedback } = res.data;
        const container = document.getElementById('feedback-container');
        container.innerHTML = `
          <hr>
          <div class="feedback-section">
            <h3>Highlights (Done Well)</h3>
            <p>${feedback.highlights.replace(/;/g, '<br>• ')}</p>
          </div>
          <div class="feedback-section">
            <h3>Missing Points</h3>
            <p>${feedback.missingPoints.replace(/;/g, '<br>• ')}</p>
          </div>
          <div class="feedback-section">
            <h3>Reflective Questions/Hints</h3>
            <p>${feedback.reflectiveQuestions.replace(/;/g, '<br>• ')}</p>
          </div>
        `;
        container.style.display = 'block';
        alert('Feedback generated!');
      } catch (err) {
        alert('Error: ' + err.response?.data?.error || 'Failed to submit');
      }
    };
    reader.readAsBinaryString(file);
  }

  function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
  }

  function showError(message) {
    const errorDiv = document.getElementById('error-msg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
  }
});
